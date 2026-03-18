import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  exchangeOAuthCode,
  isPkceExchangeError,
  resolveFrameworksForOrganization,
  selectPrimaryMembership,
  type MembershipRow,
} from '@/lib/auth/callback';
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
import { authLogger } from '@/lib/observability/structured-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Default plan for users without a plan selection - ensures no one lands with "No Plan"
const DEFAULT_PLAN = 'basic';

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
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
  authLogger.info('callback_received', {
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
  const requestedNextRaw = searchParams.get('next');
  const requestedNext =
    requestedNextRaw && requestedNextRaw.startsWith('/')
      ? requestedNextRaw
      : null;
  const ssoOrgId = searchParams.get('sso_org');

  // Handle OAuth errors (user denied permission, etc.)
  if (oauthError) {
    authLogger.error(
      'oauth_callback_error',
      {
        code: oauthError,
        message: errorDescription || 'Authentication failed during OAuth callback',
      },
      {
        oauthError,
        errorDescription,
      },
    );
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
    authLogger.critical(
      'service_role_key_missing',
      {
        code: 'SUPABASE_SERVICE_ROLE_KEY_MISSING',
        message:
          'SUPABASE_SERVICE_ROLE_KEY not configured. Cannot create user records.',
      },
    );
    return redirectWithCookies(
      `${appBase}/auth/signin?error=configuration_error&message=${encodeURIComponent(
        'Server configuration error. Please contact support.',
      )}`,
    );
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    authLogger.critical(
      'supabase_env_missing',
      {
        code: 'SUPABASE_ENV_INCOMPLETE',
        message: 'Missing Supabase URL or anonymous key.',
      },
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
      authLogger.info('no_code_session_exists', { email: data.user.email });
      return redirectWithCookies(`${appBase}${requestedNext ?? '/app'}`);
    }

    // No code, no session — redirect to sign-in
    authLogger.info('no_code_no_session');
    return redirectWithCookies(`${appBase}/auth/signin`);
  }

  const { exchangeData, exchangeError } = await exchangeOAuthCode({
    appBase,
    code,
    cookieDomain,
    cookieNames,
    cookieSnapshot,
    hasPkceVerifier,
    requestHost: requestUrl.hostname,
    serviceRoleKey,
    supabase,
    supabaseAnonKey,
    supabaseUrl,
  });

  if (exchangeError || !exchangeData?.user) {
    authLogger.error(
      'oauth_code_exchange_failed',
      {
        code: isPkceExchangeError(exchangeError)
          ? 'PKCE_EXCHANGE_FAILED'
          : 'OAUTH_EXCHANGE_FAILED',
        message:
          isPkceExchangeError(exchangeError)
            ? 'Sign-in verification failed during PKCE exchange.'
            : 'Failed to exchange OAuth code for a session.',
      },
      {
        errorCode:
          exchangeError && typeof exchangeError === 'object' && 'code' in exchangeError
            ? exchangeError.code
            : undefined,
        errorMessage:
          exchangeError &&
          typeof exchangeError === 'object' &&
          'message' in exchangeError
            ? exchangeError.message
            : undefined,
        hasPkceVerifier,
      },
    );
    const isPkce = isPkceExchangeError(exchangeError);
    const errorType = isPkce ? 'pkce_failed' : 'oauth_exchange_failed';
    const errorMsg = isPkce
      ? 'Sign-in verification failed. This can happen on some browsers. Please try again.'
      : 'Failed to authenticate. Please try again.';
    return redirectWithCookies(
      `${appBase}/auth/signin?error=${errorType}&message=${encodeURIComponent(errorMsg)}`,
    );
  }

  const user = exchangeData.user;
  authLogger.info('session_established', { email: user.email });

  // 2. CHECK IF USER IS A FOUNDER
  const founderCheck = isFounder(user.email, user.id);

  if (founderCheck) {
    authLogger.info('founder_detected', { email: user.email });

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
        authLogger.info('founder_role_fix', { previousRole: founderMembership.role });
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
      authLogger.info('founder_first_login_bootstrap');
      try {
        await bootstrapOrganizationAtomic({
          userId: user.id,
          userEmail: user.email ?? null,
          orgName: `${user.email?.split('@')[0] ?? 'Founder'}'s Organization`,
          planKey: 'pro',
        });
        authLogger.info('founder_org_bootstrapped');
      } catch (bootstrapErr) {
        authLogger.error('founder_org_bootstrap_failed', toError(bootstrapErr));
      }
    }

    authLogger.info('founder_setup_complete');
    return redirectWithCookies(`${appBase}/admin/dashboard`);
  }

  authLogger.info('regular_user_org_setup');

  if (plan) {
    try {
      await supabase.auth.updateUser({ data: { selected_plan: plan } });
    } catch (err) {
      authLogger.error('user_metadata_update_failed', toError(err), { plan });
    }
  }

  // 3. HANDLE EXISTING USERS - Check and fix their organization setup
  const { data: membershipRows, error: membershipError } = await admin
    .from('org_members')
    .select('organization_id, role, created_at')
    .eq('user_id', user.id)
    .limit(50);
  const scopedMembershipRows = (() => {
    const rows = (membershipRows ?? []) as MembershipRow[];
    if (!ssoOrgId) return rows;
    return rows.filter((r) => r.organization_id === ssoOrgId);
  })();
  const membership = selectPrimaryMembership(scopedMembershipRows);

  if (membershipError) {
    authLogger.error('membership_lookup_failed', toError(membershipError));
  }

  // 4. EXISTING USER WITHOUT ORGANIZATION - Fix orphaned accounts
  if (!membership?.organization_id) {
    // 🆕 CHECK FOR PENDING INVITATIONS FIRST
    // If an admin invited this employee by email, auto-accept the invitation
    // so the employee joins the employer's org automatically on first login.
    let inviteQuery = admin
      .from('team_invitations')
      .select('id, organization_id, role, email')
      .ilike('email', user.email || '')
      .eq('status', 'pending');
    if (ssoOrgId) {
      inviteQuery = inviteQuery.eq('organization_id', ssoOrgId);
    }
    const { data: pendingInvite } = await inviteQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingInvite) {
      authLogger.info('auto_accepting_invitation', { email: user.email, orgId: pendingInvite.organization_id });
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
          authLogger.info('auto_joined_via_invitation', { destination: '/app' });
          return redirectWithCookies(`${appBase}${requestedNext ?? '/app'}`);
        }
        authLogger.info('auto_joined_via_invitation', { destination: '/onboarding' });
        return redirectWithCookies(`${appBase}/onboarding`);
      }
      authLogger.error('auto_accept_invitation_failed', toError(joinError));
    } else if (ssoOrgId) {
      // Enterprise SSO is scoped to a specific org. If the user is not a member
      // and does not have a pending invitation, do not create a new org.
      await supabase.auth.signOut().catch(() => {});
      return redirectWithCookies(
        `${appBase}/auth/signin?error=sso_not_authorized&message=${encodeURIComponent(
          'Your account is not authorized for this organization. Please contact your administrator.',
        )}`,
      );
    }

    authLogger.info('existing_user_without_org');

    // Check if this user has an organization that they created but aren't a member of (data integrity issue)
    const { data: orphanedOrg } = await admin
      .from('organizations')
      .select('id, name')
      .or(`created_by.eq.${user.id}`)
      .maybeSingle();

    if (orphanedOrg) {
      authLogger.info('orphaned_org_found_restoring_membership');

      // Restore membership
      const { error: restoreError } = await admin.from('org_members').insert({
        organization_id: orphanedOrg.id,
        user_id: user.id,
        role: 'owner',
      });

      if (restoreError) {
        authLogger.error('restore_membership_failed', toError(restoreError));
      } else {
        authLogger.info('membership_restored');

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

        return redirectWithCookies(`${appBase}${requestedNext ?? '/app'}`);
      }
    }

    // If we reach here, create new organization for this user
    authLogger.info('new_user_creating_org');

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
      authLogger.error(
        'atomic_bootstrap_failed',
        {
          code: 'ATOMIC_BOOTSTRAP_FAILED',
          message:
            bootstrapError?.message ?? 'Account bootstrap failed unexpectedly.',
        },
      );
      return redirectWithCookies(
        `${appBase}/auth/signin?error=org_creation_failed&message=${encodeURIComponent(
          'Account setup failed. Please try signing in again.',
        )}`,
      );
    }

    const organizationId = bootstrapResult.organizationId;
    authLogger.info('atomic_bootstrap_succeeded', { organizationId });

    // Initialize compliance graph (non-critical, can fail)
    try {
      authLogger.info('initializing_compliance_graph');
      const graphResult = await initializeComplianceGraph(
        organizationId,
        user.id,
      );
      if (graphResult.success) {
        authLogger.info('compliance_graph_initialized', { nodeCount: graphResult.nodes?.length, wireCount: graphResult.wires?.length });
      } else {
        authLogger.warn('compliance_graph_initialization_warning', {
          error: graphResult.error,
        });
      }
    } catch (graphErr) {
      authLogger.error(
        'compliance_graph_initialization_failed',
        toError(graphErr),
      );
    }

    authLogger.info('new_user_setup_complete');
    const planQuery = plan ? `?plan=${encodeURIComponent(plan)}` : '';
    return redirectWithCookies(`${appBase}/onboarding${planQuery}`);
  }

  // 5. EXISTING USER WITH ORGANIZATION - Check their onboarding status and backfill missing data
  authLogger.info('existing_user_checking_onboarding');

  // Ensure user has proper role assignment
  if (membership.role === null || membership.role === undefined) {
    authLogger.info('fixing_missing_role');
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
    authLogger.error('organization_lookup_failed', toError(orgError));
  }

  // HARDENING: Default to 'basic' if org has no plan
  const resolvedPlan =
    resolvePlanKey(organization?.plan_key ?? null) || DEFAULT_PLAN;

  // BACKFILL: Update org with plan if missing
  if (!organization?.plan_key) {
    authLogger.info('backfilling_plan_key');
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
    authLogger.info('backfilling_legacy_orgs_entry');
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
    authLogger.error('ensure_subscription_failed', toError(subErr), {
      orgId: membership.organization_id,
      plan: resolvedPlan,
    });
  }

  // PERF: Validate compliance graph in background (non-blocking).
  // Previously this blocked every login with a DB query. Now fire-and-forget.
  validateComplianceGraph(membership.organization_id)
    .then((result) => {
      if (!result.isValid) {
        authLogger.warn('compliance_graph_async_issues', {
          issues: result.issues,
        });
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
    authLogger.info('repaired_org_frameworks', {
      orgId: membership.organization_id,
      frameworkCount: frameworkResolution.frameworks.length,
    });
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
      authLogger.info('promoted_onboarding_completed', {
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
    authLogger.info('onboarding_incomplete_redirecting', { onboardingStep });
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

  authLogger.info('user_fully_onboarded');
  return redirectWithCookies(`${appBase}${requestedNext ?? '/app'}`);
}
