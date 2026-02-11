import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { bootstrapOrganizationAtomic } from '@/lib/supabase/transaction';
import { resolvePlanKey } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import { isFounder } from '@/lib/utils/founder';
import {
  deriveOnboardingStep,
  isOnboardingComplete,
} from '@/lib/provisioning/workspace-recovery';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from '@/lib/supabase/env';
import {
  initializeComplianceGraph,
  validateComplianceGraph,
} from '@/lib/compliance-graph';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Default plan for users without a plan selection - ensures no one lands with "No Plan"
const DEFAULT_PLAN = 'basic';

// Legacy plan_code mapping (basic -> starter for FK constraint)
function toLegacyPlanCode(planKey: string): string {
  return planKey === 'basic' ? 'starter' : planKey;
}

type MembershipRow = {
  organization_id: string | null;
  role: string | null;
  created_at?: string | null;
};

type FrameworkRow = {
  framework_slug: string | null;
};

function normalizeFrameworks(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
}

function selectPrimaryMembership(
  memberships: MembershipRow[],
): MembershipRow | null {
  if (!memberships.length) return null;

  const weight = (role?: string | null) => {
    const normalized = (role ?? '').toLowerCase();
    if (normalized === 'owner') return 3;
    if (normalized === 'admin') return 2;
    return 1;
  };

  return (
    memberships
      .slice()
      .sort((a, b) => {
        const roleDelta = weight(b.role) - weight(a.role);
        if (roleDelta !== 0) return roleDelta;
        const aTime = a.created_at ? Date.parse(a.created_at) : 0;
        const bTime = b.created_at ? Date.parse(b.created_at) : 0;
        return bTime - aTime;
      })
      .at(0) ?? memberships[0]
  );
}

async function resolveFrameworksForOrganization(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  organizationFrameworks: unknown,
) {
  const directFrameworks = normalizeFrameworks(organizationFrameworks);
  if (directFrameworks.length > 0) {
    return {
      frameworks: directFrameworks,
      repairedFromOrgFrameworks: false,
    };
  }

  const { data: frameworkRows } = await admin
    .from('org_frameworks')
    .select('framework_slug')
    .eq('org_id', organizationId)
    .limit(100);

  const fallbackFrameworks = normalizeFrameworks(
    (frameworkRows as FrameworkRow[] | null)?.map((row) => row.framework_slug),
  );

  if (!fallbackFrameworks.length) {
    return {
      frameworks: [],
      repairedFromOrgFrameworks: false,
    };
  }

  const { error: backfillError } = await admin
    .from('organizations')
    .update({ frameworks: fallbackFrameworks })
    .eq('id', organizationId);

  return {
    frameworks: fallbackFrameworks,
    repairedFromOrgFrameworks: !backfillError,
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;
  const code = searchParams.get('code');
  const oauthError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const cookieStore = await cookies();
  let cookieSnapshot = cookieStore.getAll();
  const cookieDomain = getCookieDomain(requestUrl.hostname);
  const isHttps = requestUrl.protocol === 'https:';

  // --- Minimal diagnostic logging ---
  const cookieNames = cookieSnapshot.map((c) => c.name);
  const hasPkceVerifier = cookieNames.some((n) => n.includes('code-verifier'));
  console.log('[auth/callback]', {
    hasCode: !!code,
    hasError: !!oauthError,
    hasPkceVerifier,
  });
  const cookieChanges: { name: string; value: string; options: any }[] = [];

  const normalizeCookieOptions = (options?: Record<string, any>) => {
    const normalized = { ...(options ?? {}) };

    // Mobile Safari requires explicit cookie settings
    if (!normalized.sameSite) {
      normalized.sameSite = isHttps ? 'none' : 'lax';
    }
    if (!normalized.path) {
      normalized.path = '/';
    }
    if (isHttps) {
      normalized.secure = true;
    }

    // Ensure httpOnly is preserved from Supabase
    if (options?.httpOnly !== undefined) {
      normalized.httpOnly = options.httpOnly;
    }

    // Set explicit maxAge if provided by Supabase
    if (options?.maxAge !== undefined) {
      normalized.maxAge = options.maxAge;
    }

    // For production, only use domain if we're on the correct domain
    // Avoid setting domain for localhost/dev
    if (cookieDomain && isHttps) {
      normalized.domain = cookieDomain;
    }

    return normalized;
  };

  const redirectWithCookies = (destination: string) => {
    const response = NextResponse.redirect(destination);
    cookieChanges.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  };
  // HARDENING: Default to 'basic' if no valid plan provided - ensures no "No Plan" users
  const plan = resolvePlanKey(searchParams.get('plan')) || DEFAULT_PLAN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const appBase = (() => {
    if (appUrl) {
      try {
        return new URL(appUrl).origin.replace(/\/$/, '');
      } catch {
        // Fall back to request origin when env is invalid.
      }
    }
    return requestUrl.origin.replace(/\/$/, '');
  })();

  // Handle OAuth errors (user denied permission, etc.)
  if (oauthError) {
    console.error('[auth/callback] OAuth error:', {
      oauthError,
      errorDescription,
    });
    return redirectWithCookies(
      `${appBase}/auth/signin?error=oauth_error&message=${encodeURIComponent(
        errorDescription || 'Authentication failed. Please try again.',
      )}`,
    );
  }

  // CRITICAL: Validate service role key is configured
  // Without this, user creation will fail and create orphaned auth users
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) {
    console.error(
      '[auth/callback] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured. Cannot create user records.',
    );
    // Redirect to error page with clear message
    return redirectWithCookies(
      `${appBase}/auth/signin?error=configuration_error&message=${encodeURIComponent(
        'Server configuration error. Please contact support.',
      )}`,
    );
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[auth/callback] CRITICAL: Missing Supabase URL or anonymous key.',
    );
    return redirectWithCookies(
      `${appBase}/auth/signin?error=configuration_error&message=${encodeURIComponent(
        'Server configuration error. Please contact support.',
      )}`,
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieSnapshot,
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = normalizeCookieOptions(options);
            cookieChanges.push({ name, value, options: cookieOptions });
            cookieSnapshot = [
              ...cookieSnapshot.filter((cookie) => cookie.name !== name),
              { name, value },
            ];
          });
        } catch {
          // Ignore cookie write errors in auth callback
        }
      },
    },
  });
  const admin = createSupabaseAdminClient();

  if (!code) {
    // No authorization code present — this is not a valid OAuth callback.
    // (The old setup=1 mode for signInWithIdToken / Google One Tap has been
    //  removed; the only supported flow is Supabase signInWithOAuth which
    //  always sends a ?code= parameter.)
    const { data } = await supabase.auth.getUser();

    if (data?.user) {
      // User has an existing session — just send them to the app
      console.log(
        '[auth/callback] No code but session exists for',
        data.user.email,
        '→ /app',
      );
      return redirectWithCookies(`${appBase}/app`);
    }

    // No code, no session — redirect to sign-in
    console.log('[auth/callback] No code, no session → /auth/signin');
    return redirectWithCookies(`${appBase}/auth/signin`);
  }

  // 1. Exchange the code for a session
  let exchangeData: { user: any; session: any } | null = null;
  let exchangeError: any = null;

  try {
    const result = await supabase.auth.exchangeCodeForSession(code);
    exchangeData = result.data as any;
    exchangeError = result.error;
  } catch (err) {
    exchangeError = err;
  }

  // PKCE fallback: if the code verifier cookie was lost (common on mobile Safari,
  // cross-origin redirects, or ITP), fall back to a server-to-server exchange
  // using the admin client which bypasses PKCE verification.
  if (
    exchangeError &&
    (String(exchangeError?.code ?? '').includes('pkce') ||
      String(exchangeError?.message ?? '').includes('code verifier') ||
      String(exchangeError?.message ?? '').includes('verifier'))
  ) {
    console.warn(
      '[auth/callback] PKCE verifier missing – attempting server-side fallback',
      {
        errorCode: exchangeError?.code,
        errorMessage: exchangeError?.message,
        hasPkceVerifier,
        cookieNames: cookieNames.filter((n) => n.startsWith('sb-')),
        allCookieNames: cookieNames,
        cookieDomain,
        requestHost: requestUrl.hostname,
      },
    );

    // IMPROVED FALLBACK: Try to get the code verifier from all possible cookie locations
    // Sometimes the verifier is stored under different names
    const possibleVerifierCookies = cookieSnapshot.filter(
      (c) =>
        c.name.includes('code-verifier') || c.name.includes('code_verifier'),
    );

    if (possibleVerifierCookies.length > 0) {
      // Found a verifier cookie - try to use it
      for (const verifierCookie of possibleVerifierCookies) {
        try {
          console.log(
            '[auth/callback] Trying verifier from cookie:',
            verifierCookie.name,
          );
          const tokenRes = await fetch(
            `${supabaseUrl}/auth/v1/token?grant_type=pkce`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: supabaseAnonKey,
              },
              body: JSON.stringify({
                auth_code: code,
                code_verifier: verifierCookie.value,
              }),
            },
          );

          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            if (tokenData?.access_token && tokenData?.refresh_token) {
              const { data: sessionData, error: setErr } =
                await supabase.auth.setSession({
                  access_token: tokenData.access_token,
                  refresh_token: tokenData.refresh_token,
                });
              if (!setErr && sessionData?.user) {
                exchangeData = sessionData as any;
                exchangeError = null;
                console.log(
                  '[auth/callback] ✅ PKCE exchange with found verifier succeeded for:',
                  sessionData.user.email,
                );
                break;
              }
            }
          }
        } catch (verifierErr) {
          console.error(
            '[auth/callback] Verifier exchange failed:',
            verifierErr,
          );
        }
      }
    }

    // If still no success, try authorization_code grant with service role (Supabase Admin API)
    if (!exchangeData?.user) {
      try {
        // Use the admin API to exchange the code directly
        // This requires the service role key
        const adminTokenRes = await fetch(
          `${supabaseUrl}/auth/v1/token?grant_type=authorization_code`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              code,
              redirect_uri: `${appBase}/auth/callback`,
            }),
          },
        );

        if (adminTokenRes.ok) {
          const tokenData = await adminTokenRes.json();
          if (tokenData?.access_token && tokenData?.refresh_token) {
            const { data: sessionData, error: setErr } =
              await supabase.auth.setSession({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
              });
            if (!setErr && sessionData?.user) {
              exchangeData = sessionData as any;
              exchangeError = null;
              console.log(
                '[auth/callback] ✅ Admin API token exchange succeeded for:',
                sessionData.user.email,
              );
            }
          }
        } else {
          const errBody = await adminTokenRes.text();
          console.error('[auth/callback] Admin token exchange failed:', {
            status: adminTokenRes.status,
            body: errBody,
          });
        }
      } catch (fallbackErr) {
        console.error(
          '[auth/callback] Server-side fallback failed:',
          fallbackErr,
        );
      }
    }
  }

  if (exchangeError || !exchangeData?.user) {
    console.error('[auth/callback] OAuth code exchange failed:', {
      errorCode: exchangeError?.code,
      errorMessage: exchangeError?.message,
      hasPkceVerifier,
    });
    const isPkce =
      String(exchangeError?.code ?? '').includes('pkce') ||
      String(exchangeError?.message ?? '').includes('code verifier');
    const errorType = isPkce ? 'pkce_failed' : 'oauth_exchange_failed';
    const errorMsg = isPkce
      ? 'Sign-in verification failed. This can happen on some browsers. Please try again.'
      : 'Failed to authenticate. Please try again.';
    return redirectWithCookies(
      `${appBase}/auth/signin?error=${errorType}&message=${encodeURIComponent(errorMsg)}`,
    );
  }

  const user = exchangeData.user;
  console.log('[auth/callback] Session established for:', user.email);

  // 2. CHECK IF USER IS A FOUNDER
  const founderCheck = isFounder(user.email, user.id);

  if (founderCheck) {
    console.log(`[auth/callback] Founder: ${user.email} → /admin/dashboard`);

    // Ensure founder has proper role in org_members
    const { data: founderMembership } = await admin
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (founderMembership?.organization_id) {
      // Update role to owner if not already
      if (founderMembership.role !== 'owner') {
        console.log(
          `[auth/callback] 🔧 Fixing founder role from ${founderMembership.role} to owner`,
        );
        await admin
          .from('org_members')
          .update({ role: 'owner' })
          .eq('user_id', user.id);
      }

      // Ensure organization has pro plan and active subscription
      await admin
        .from('organizations')
        .update({ plan_key: 'pro' })
        .eq('id', founderMembership.organization_id);

      await admin.from('org_subscriptions').upsert({
        org_id: founderMembership.organization_id, // Legacy column
        organization_id: founderMembership.organization_id,
        plan_code: 'pro', // Legacy column
        plan_key: 'pro',
        status: 'active',
        updated_at: new Date().toISOString(),
      });
    } else {
      // Founder has NO org yet (first login) — bootstrap one
      console.log(
        '[auth/callback] 🆕 Founder first login — bootstrapping organization',
      );
      try {
        await bootstrapOrganizationAtomic({
          userId: user.id,
          userEmail: user.email ?? null,
          orgName: `${user.email?.split('@')[0] ?? 'Founder'}'s Organization`,
          planKey: 'pro',
        });
        console.log('[auth/callback] ✅ Founder org bootstrapped successfully');
      } catch (bootstrapErr) {
        console.error(
          '[auth/callback] ❌ Founder org bootstrap failed:',
          bootstrapErr,
        );
      }
    }

    console.log(
      `[auth/callback] ✅ Founder setup complete, redirecting to /admin/dashboard`,
    );
    return redirectWithCookies(`${appBase}/admin/dashboard`);
  }

  console.log(
    `[auth/callback] ℹ️  Regular user (not founder), proceeding with org setup`,
  );

  if (plan) {
    try {
      await supabase.auth.updateUser({ data: { selected_plan: plan } });
    } catch (err) {
      console.error('User metadata update failed:', err);
    }
  }

  // 3. HANDLE EXISTING USERS - Check and fix their organization setup
  const { data: membershipRows, error: membershipError } = await admin
    .from('org_members')
    .select('organization_id, role, created_at')
    .eq('user_id', user.id)
    .limit(50);
  const membership = selectPrimaryMembership((membershipRows ?? []) as MembershipRow[]);

  if (membershipError) {
    console.error('Membership lookup failed:', membershipError);
  }

  // 4. EXISTING USER WITHOUT ORGANIZATION - Fix orphaned accounts
  if (!membership?.organization_id) {
    // 🆕 CHECK FOR PENDING INVITATIONS FIRST
    // If an admin invited this employee by email, auto-accept the invitation
    // so the employee joins the employer's org automatically on first login.
    const { data: pendingInvite } = await admin
      .from('team_invitations')
      .select('id, organization_id, role, email')
      .ilike('email', user.email || '')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingInvite) {
      console.log(
        '[auth/callback] 📧 Auto-accepting pending invitation for',
        user.email,
        '→ org',
        pendingInvite.organization_id,
      );
      const { error: joinError } = await admin.from('org_members').upsert(
        {
          organization_id: pendingInvite.organization_id,
          user_id: user.id,
          role: pendingInvite.role || 'member',
        },
        { onConflict: 'user_id,organization_id' },
      );
      if (!joinError) {
        await admin
          .from('team_invitations')
          .update({ status: 'accepted' })
          .eq('id', pendingInvite.id);

        // Check if org has completed onboarding
        const { data: inviteOrg } = await supabase
          .from('organizations')
          .select('onboarding_completed')
          .eq('id', pendingInvite.organization_id)
          .maybeSingle();

        if (inviteOrg?.onboarding_completed) {
          console.log('[auth/callback] ✅ Auto-joined via invitation → /app');
          return redirectWithCookies(`${appBase}/app`);
        }
        console.log(
          '[auth/callback] ✅ Auto-joined via invitation → /onboarding',
        );
        return redirectWithCookies(`${appBase}/onboarding`);
      }
      console.error(
        '[auth/callback] Failed to auto-accept invitation:',
        joinError,
      );
    }

    console.log(
      '[auth/callback] 🔧 EXISTING USER without org - fixing orphaned account',
    );

    // Check if this user has an organization that they created but aren't a member of (data integrity issue)
    const { data: orphanedOrg } = await admin
      .from('organizations')
      .select('id, name')
      .or(`created_by.eq.${user.id}`)
      .maybeSingle();

    if (orphanedOrg) {
      console.log(
        '[auth/callback] 📎 Found orphaned org, restoring membership',
      );

      // Restore membership
      const { error: restoreError } = await admin.from('org_members').insert({
        organization_id: orphanedOrg.id,
        user_id: user.id,
        role: 'owner',
      });

      if (restoreError) {
        console.error(
          '[auth/callback] Failed to restore membership:',
          restoreError,
        );
      } else {
        console.log('[auth/callback] ✅ Restored membership to existing org');

        // Continue with existing org flow
        const { data: restoredOrg } = await supabase
          .from('organizations')
          .select('plan_key, industry, onboarding_completed, frameworks')
          .eq('id', orphanedOrg.id)
          .maybeSingle();

        const resolvedPlan =
          resolvePlanKey(restoredOrg?.plan_key ?? null) || plan;
        await ensureSubscription(orphanedOrg.id, resolvedPlan);

        const hasPlan = Boolean(restoredOrg?.plan_key ?? resolvedPlan);
        const hasIndustry = Boolean(restoredOrg?.industry);
        const hasFrameworks =
          Array.isArray(restoredOrg?.frameworks) &&
          restoredOrg.frameworks.length > 0;
        const onboardingComplete = Boolean(restoredOrg?.onboarding_completed);

        if (!hasPlan || !hasIndustry || !hasFrameworks || !onboardingComplete) {
          const planQuery = resolvedPlan
            ? `?plan=${encodeURIComponent(resolvedPlan)}`
            : '';
          return redirectWithCookies(`${appBase}/onboarding${planQuery}`);
        }

        return redirectWithCookies(`${appBase}/app`);
      }
    }

    // If we reach here, create new organization for this user
    console.log(
      '[auth/callback] 🚀 NEW USER: Creating organization and setting up onboarding',
    );

    const fallbackName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'New Organization';

    // Use atomic bootstrap with rollback on failure
    const { data: bootstrapResult, error: bootstrapError } =
      await bootstrapOrganizationAtomic({
        userId: user.id,
        userEmail: user.email ?? null,
        orgName: fallbackName,
        planKey: plan,
      });

    if (bootstrapError || !bootstrapResult) {
      console.error(
        '[auth/callback] ❌ Atomic bootstrap failed:',
        bootstrapError?.message,
      );
      return redirectWithCookies(
        `${appBase}/auth/signin?error=org_creation_failed&message=${encodeURIComponent(
          'Account setup failed. Please try signing in again.',
        )}`,
      );
    }

    const organizationId = bootstrapResult.organizationId;
    console.log(
      '[auth/callback] ✅ Atomic bootstrap succeeded:',
      organizationId,
    );

    // Initialize compliance graph (non-critical, can fail)
    try {
      console.log('[auth/callback] 🏗️  Initializing compliance graph');
      const graphResult = await initializeComplianceGraph(
        organizationId,
        user.id,
      );
      if (graphResult.success) {
        console.log(
          `[auth/callback] ✅ Compliance graph initialized: ${graphResult.nodes?.length} nodes, ${graphResult.wires?.length} wires`,
        );
      } else {
        console.warn(
          `[auth/callback] ⚠️  Graph initialization warning: ${graphResult.error}`,
        );
      }
    } catch (graphErr) {
      console.error(
        '[auth/callback] Graph initialization failed (non-critical):',
        graphErr,
      );
    }

    console.log(
      '[auth/callback] ✅ NEW USER setup complete, redirecting to onboarding',
    );
    const planQuery = plan ? `?plan=${encodeURIComponent(plan)}` : '';
    return redirectWithCookies(`${appBase}/onboarding${planQuery}`);
  }

  // 5. EXISTING USER WITH ORGANIZATION - Check their onboarding status and backfill missing data
  console.log(
    '[auth/callback] 🔍 EXISTING USER with org - checking onboarding status',
  );

  // Ensure user has proper role assignment
  if (membership.role === null || membership.role === undefined) {
    console.log('[auth/callback] 🔧 Fixing missing role for existing user');
    await admin
      .from('org_members')
      .update({ role: 'member' }) // Default role for existing users
      .eq('organization_id', membership.organization_id)
      .eq('user_id', user.id);
  }

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select(
      'plan_key, industry, onboarding_completed, frameworks, name, created_by',
    )
    .eq('id', membership.organization_id)
    .maybeSingle();

  if (orgError) {
    console.error('Organization lookup failed:', orgError);
  }

  // HARDENING: Default to 'basic' if org has no plan
  const resolvedPlan =
    resolvePlanKey(organization?.plan_key ?? null) || DEFAULT_PLAN;

  // BACKFILL: Update org with plan if missing
  if (!organization?.plan_key) {
    console.log(
      '[auth/callback] 🔧 Backfilling missing plan_key for existing org',
    );
    await admin
      .from('organizations')
      .update({
        plan_key: resolvedPlan,
        plan_selected_at: new Date().toISOString(),
      })
      .eq('id', membership.organization_id);
  }

  // BACKFILL: Ensure legacy orgs table entry exists (for org_subscriptions.org_id FK)
  const { data: legacyOrg } = await admin
    .from('orgs')
    .select('id')
    .eq('id', membership.organization_id)
    .maybeSingle();

  if (!legacyOrg) {
    console.log('[auth/callback] 🔧 Backfilling legacy orgs table entry');
    const now = new Date().toISOString();
    await admin.from('orgs').upsert(
      {
        id: membership.organization_id,
        name: organization?.name || 'Organization',
        created_by: organization?.created_by || user.id,
        created_at: now,
        updated_at: now,
      },
      { onConflict: 'id' },
    );
  }

  // HARDENING: Always ensure subscription + entitlements exist
  try {
    await ensureSubscription(membership.organization_id, resolvedPlan);
  } catch (subErr) {
    console.error(
      '[auth/callback] ensureSubscription failed (non-critical):',
      subErr,
    );
  }

  // PERF: Validate compliance graph in background (non-blocking).
  // Previously this blocked every login with a DB query. Now fire-and-forget.
  validateComplianceGraph(membership.organization_id)
    .then((result) => {
      if (!result.isValid) {
        console.warn(
          '[auth/callback] Graph issues (async):',
          result.issues.join(', '),
        );
      }
    })
    .catch(() => {});

  const hasPlan = Boolean(organization?.plan_key ?? resolvedPlan);
  const hasIndustry = Boolean(organization?.industry);
  const frameworkResolution = await resolveFrameworksForOrganization(
    admin,
    membership.organization_id,
    organization?.frameworks ?? null,
  );
  if (frameworkResolution.repairedFromOrgFrameworks) {
    console.log(
      '[auth/callback] Repaired organization.frameworks from org_frameworks',
      {
        orgId: membership.organization_id,
        frameworkCount: frameworkResolution.frameworks.length,
      },
    );
  }
  const hasFrameworks = frameworkResolution.frameworks.length > 0;
  const { data: onboardingStatus } = await admin
    .from('org_onboarding_status')
    .select('current_step, completed_steps, completed_at')
    .eq('organization_id', membership.organization_id)
    .maybeSingle();

  const statusMarkedComplete =
    Boolean(onboardingStatus?.completed_at) ||
    Boolean(onboardingStatus?.completed_steps?.includes(7));
  let onboardingCompleted = Boolean(organization?.onboarding_completed);
  const canPromoteOnboarding =
    hasPlan && hasIndustry && hasFrameworks && Boolean(membership.role);

  if (!onboardingCompleted && canPromoteOnboarding && statusMarkedComplete) {
    const { error: promoteError } = await admin
      .from('organizations')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', membership.organization_id);

    if (!promoteError) {
      onboardingCompleted = true;
      console.log('[auth/callback] Promoted onboarding_completed from status', {
        orgId: membership.organization_id,
      });
    }
  }

  const onboardingSnapshot = {
    hasPlan,
    hasIndustry,
    hasFrameworks,
    hasRole: Boolean(membership.role),
    onboardingCompleted,
    storedStep: onboardingStatus?.current_step ?? null,
  };

  if (!isOnboardingComplete(onboardingSnapshot)) {
    const onboardingStep = deriveOnboardingStep(onboardingSnapshot);
    await admin.from('org_onboarding_status').upsert({
      organization_id: membership.organization_id,
      current_step: onboardingStep,
      updated_at: new Date().toISOString(),
    });
    console.log(
      '[auth/callback] 📋 Onboarding incomplete, redirecting to onboarding step',
      onboardingStep,
    );
    const query = new URLSearchParams();
    query.set('step', String(onboardingStep));
    if (resolvedPlan) {
      query.set('plan', resolvedPlan);
    }
    const queryString = query.toString();
    const planQuery = queryString
      ? `?${queryString}`
      : '';
    return redirectWithCookies(`${appBase}/onboarding${planQuery}`);
  }

  console.log('[auth/callback] ✅ User fully onboarded, redirecting to app');
  return redirectWithCookies(`${appBase}/app`);
}
