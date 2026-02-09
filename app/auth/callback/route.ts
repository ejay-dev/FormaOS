import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolvePlanKey } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import { isFounder } from '@/lib/utils/founder';
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
      normalized.sameSite = 'lax';
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
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
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

  const isPresent = (value?: string | null) =>
    Boolean(value && value !== 'undefined' && value !== 'null');
  const supabaseUrl = isPresent(process.env.NEXT_PUBLIC_SUPABASE_URL)
    ? process.env.NEXT_PUBLIC_SUPABASE_URL!
    : '';
  const supabaseAnonKey = isPresent(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    : '';

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
    // setup=1: Called after client-side signInWithIdToken (Google Identity Services).
    // The session already exists in browser cookies — skip code exchange
    // and proceed directly to the org-creation / onboarding flow.
    const setupMode = searchParams.get('setup') === '1';
    const { data } = await supabase.auth.getUser();

    if (!data?.user) {
      return redirectWithCookies(
        setupMode
          ? `${appBase}/auth/signin?error=setup_incomplete&message=${encodeURIComponent('Session not found. Please sign in again.')}`
          : `${appBase}/auth/signin`,
      );
    }

    if (!setupMode) {
      // Regular visit to /auth/callback without code — redirect to app
      return redirectWithCookies(`${appBase}/app`);
    }

    // Setup mode: session already established via signInWithIdToken
    // Fall through to the org-setup logic below using the session user
    console.log(
      '[auth/callback] Setup mode (signInWithIdToken): session found for',
      data.user.email,
    );

    // Re-use the same variable name the rest of the route expects
    const user = data.user;

    // --- BEGIN SHARED ORG-SETUP FLOW (same logic as post-exchange) ---

    // Founder check
    const founderCheck = isFounder(user.email, user.id);
    if (founderCheck) {
      console.log(
        `[auth/callback] Setup mode: FOUNDER DETECTED: ${user.email}`,
      );
      const { data: founderMembership } = await admin
        .from('org_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (founderMembership?.organization_id) {
        if (founderMembership.role !== 'owner') {
          await admin
            .from('org_members')
            .update({ role: 'owner' })
            .eq('user_id', user.id);
        }
        await admin
          .from('organizations')
          .update({ plan_key: 'pro' })
          .eq('id', founderMembership.organization_id);
        await admin.from('org_subscriptions').upsert({
          org_id: founderMembership.organization_id,
          organization_id: founderMembership.organization_id,
          plan_code: 'pro',
          plan_key: 'pro',
          status: 'active',
          updated_at: new Date().toISOString(),
        });
      }
      return redirectWithCookies(`${appBase}/admin/dashboard`);
    }

    // Check existing membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) {
      // Check for pending invitations
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
          return redirectWithCookies(`${appBase}/app`);
        }
      }

      // No membership and no invite — redirect to join/create page
      return redirectWithCookies(
        `${appBase}/onboarding?plan=${encodeURIComponent(plan)}`,
      );
    }

    // Has membership — check onboarding completion
    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_completed')
      .eq('id', membership.organization_id)
      .maybeSingle();

    if (!org?.onboarding_completed) {
      return redirectWithCookies(`${appBase}/onboarding`);
    }

    return redirectWithCookies(`${appBase}/app`);
    // --- END SHARED ORG-SETUP FLOW ---
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
      String(exchangeError?.message ?? '').includes('code verifier'))
  ) {
    console.warn(
      '[auth/callback] PKCE verifier missing – attempting server-side fallback',
      {
        errorCode: exchangeError?.code,
        hasPkceVerifier,
        cookieNames: cookieNames.filter((n) => n.startsWith('sb-')),
      },
    );

    // Try exchanging the code via the Supabase Auth admin REST endpoint.
    // This bypasses the client-side PKCE check by talking directly to the auth server.
    try {
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
            code_verifier: '', // empty verifier – server may accept for trusted origins
          }),
        },
      );

      // If the direct token exchange doesn't work, try the admin route
      if (!tokenRes.ok) {
        // Exchange code via admin endpoint (code grant without PKCE)
        const adminTokenRes = await fetch(
          `${supabaseUrl}/auth/v1/token?grant_type=authorization_code`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ code }),
          },
        );

        if (adminTokenRes.ok) {
          const tokenData = await adminTokenRes.json();
          if (tokenData?.access_token && tokenData?.refresh_token) {
            // Set session via the supabase client so cookies are properly written
            const { data: sessionData, error: setErr } =
              await supabase.auth.setSession({
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
              });
            if (!setErr && sessionData?.user) {
              exchangeData = sessionData as any;
              exchangeError = null;
              console.log(
                '[auth/callback] ✅ Server-side fallback succeeded for:',
                sessionData.user.email,
              );
            }
          }
        }
      } else {
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
              '[auth/callback] ✅ PKCE-bypass token exchange succeeded for:',
              sessionData.user.email,
            );
          }
        }
      }
    } catch (fallbackErr) {
      console.error(
        '[auth/callback] Server-side fallback failed:',
        fallbackErr,
      );
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
  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

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

    try {
      const now = new Date().toISOString();

      // Use the admin (service-role) client for bootstrap writes so RLS doesn't block
      // HARDENING: Always set plan_key (defaulted to 'basic' above)
      const { data: organization, error: orgError } = await admin
        .from('organizations')
        .insert({
          name: fallbackName,
          created_by: user.id, // Set the creating user ID properly
          plan_key: plan, // Always set (defaulted to 'basic')
          plan_selected_at: now,
          onboarding_completed: false, // Ensure onboarding is NOT complete for new users
        })
        .select('id')
        .single();

      if (orgError || !organization?.id) {
        console.error(
          '[auth/callback] ❌ CRITICAL: Organization bootstrap failed:',
          orgError?.message ?? orgError,
          orgError?.details ?? null,
          orgError,
        );
        // On org creation failure, redirect to signin with clear error
        return redirectWithCookies(
          `${appBase}/auth/signin?error=org_creation_failed&message=${encodeURIComponent(
            'Account setup failed. Please try signing in again.',
          )}`,
        );
      }

      // HARDENING: Upsert into legacy 'orgs' table (prevents duplicates, required for org_subscriptions.org_id FK)
      const { error: legacyOrgError } = await admin.from('orgs').upsert(
        {
          id: organization.id, // Use same ID to keep them in sync
          name: fallbackName,
          created_by: user.id,
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'id' },
      );

      if (legacyOrgError) {
        console.error(
          '[auth/callback] Legacy orgs table upsert failed (non-critical):',
          legacyOrgError.message,
        );
      }

      // Create org membership with proper role
      const { error: memberError } = await admin.from('org_members').insert({
        organization_id: organization.id,
        user_id: user.id,
        role: 'owner', // New users become organization owners
      });

      if (memberError) {
        console.error(
          '[auth/callback] Membership bootstrap failed:',
          memberError?.message ?? memberError,
          memberError?.details ?? null,
          memberError,
        );
      }

      // Set up onboarding status (start at step 2 if plan already selected)
      const { error: onboardingError } = await admin
        .from('org_onboarding_status')
        .insert({
          organization_id: organization.id,
          current_step: plan ? 1 : 2,
          completed_steps: [],
        });

      if (onboardingError) {
        console.error(
          '[auth/callback] org_onboarding_status insert failed:',
          onboardingError?.message ?? onboardingError,
          onboardingError?.details ?? null,
          onboardingError,
        );
      }

      try {
        await ensureSubscription(organization.id, plan);
      } catch (subErr) {
        console.error('[auth/callback] ensureSubscription failed:', subErr);
      }

      // CRITICAL: Initialize compliance graph for new organization
      console.log('[auth/callback] 🏗️  Initializing compliance graph');
      const graphResult = await initializeComplianceGraph(
        organization.id,
        user.id,
      );

      if (graphResult.success) {
        console.log(
          `[auth/callback] ✅ Compliance graph initialized: ${graphResult.nodes?.length} nodes, ${graphResult.wires?.length} wires`,
        );
      } else {
        console.error(
          `[auth/callback] ⚠️  Graph initialization warning: ${graphResult.error}`,
        );
        // Continue anyway - graph can be initialized later
      }

      console.log(
        '[auth/callback] ✅ NEW USER setup complete, redirecting to onboarding',
      );
    } catch (err) {
      console.error(
        '[auth/callback] Organization bootstrap failed (unexpected):',
        err,
      );
    }

    // CRITICAL FIX: Always redirect new users to onboarding
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
  await ensureSubscription(membership.organization_id, resolvedPlan);

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
  const hasFrameworks =
    Array.isArray(organization?.frameworks) &&
    organization.frameworks.length > 0;
  const onboardingComplete = Boolean(organization?.onboarding_completed);

  if (!hasPlan || !hasIndustry || !hasFrameworks || !onboardingComplete) {
    console.log(
      '[auth/callback] 📋 Onboarding incomplete, redirecting to onboarding',
    );
    const planQuery = resolvedPlan
      ? `?plan=${encodeURIComponent(resolvedPlan)}`
      : '';
    return redirectWithCookies(`${appBase}/onboarding${planQuery}`);
  }

  console.log('[auth/callback] ✅ User fully onboarded, redirecting to app');
  return redirectWithCookies(`${appBase}/app`);
}
