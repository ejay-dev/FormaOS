import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolvePlanKey } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import { isFounder } from '@/lib/utils/founder';
import {
  initializeComplianceGraph,
  validateComplianceGraph,
} from '@/lib/compliance-graph';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const plan = resolvePlanKey(searchParams.get('plan'));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin;
  const appBase = appUrl.replace(/\/$/, '');

  if (!code) {
    return NextResponse.redirect(`${appBase}/auth/signin`);
  }

  // CRITICAL: Validate service role key is configured
  // Without this, user creation will fail and create orphaned auth users
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      '[auth/callback] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not configured. Cannot create user records.',
    );
    // Redirect to error page with clear message
    return NextResponse.redirect(
      `${appBase}/auth/signin?error=configuration_error&message=${encodeURIComponent(
        'Server configuration error. Please contact support.',
      )}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  // 1. Exchange the code for a session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    console.error('OAuth exchange failed:', error);
    return NextResponse.redirect(`${appBase}/auth/signin`);
  }

  // 2. CHECK IF USER IS A FOUNDER - Ensure proper role and redirect to admin
  const founderCheck = isFounder(data.user.email, data.user.id);
  console.log(`[auth/callback] 🔍 Founder check:`, {
    email: data.user.email,
    userId: data.user.id.substring(0, 8) + '...',
    isFounder: founderCheck,
  });

  if (founderCheck) {
    console.log(`[auth/callback] ✅ FOUNDER DETECTED: ${data.user.email}`);
    console.log('[auth/callback] 🔐 ADMIN GATE CHECK', {
      email: data.user.email,
      isFounder: founderCheck,
      redirectTarget: '/admin/dashboard',
      appBase,
    });

    // Ensure founder has proper role in org_members
    const { data: founderMembership } = await admin
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', data.user.id)
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
          .eq('user_id', data.user.id);
      }

      // Ensure organization has pro plan and active subscription
      await admin
        .from('organizations')
        .update({ plan_key: 'pro' })
        .eq('id', founderMembership.organization_id);

      await admin.from('org_subscriptions').upsert({
        organization_id: founderMembership.organization_id,
        plan_key: 'pro',
        status: 'active',
        updated_at: new Date().toISOString(),
      });
    }

    console.log(
      `[auth/callback] ✅ Founder setup complete, redirecting to /admin/dashboard`,
    );
    return NextResponse.redirect(`${appBase}/admin/dashboard`);
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
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (membershipError) {
    console.error('Membership lookup failed:', membershipError);
  }

  // 4. EXISTING USER WITHOUT ORGANIZATION - Fix orphaned accounts
  if (!membership?.organization_id) {
    console.log(
      '[auth/callback] 🔧 EXISTING USER without org - fixing orphaned account',
    );

    // Check if this user has an organization that they created but aren't a member of (data integrity issue)
    const { data: orphanedOrg } = await admin
      .from('organizations')
      .select('id, name')
      .or(`created_by.eq.${data.user.id}`)
      .maybeSingle();

    if (orphanedOrg) {
      console.log(
        '[auth/callback] 📎 Found orphaned org, restoring membership',
      );

      // Restore membership
      const { error: restoreError } = await admin.from('org_members').insert({
        organization_id: orphanedOrg.id,
        user_id: data.user.id,
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
          return NextResponse.redirect(`${appBase}/onboarding${planQuery}`);
        }

        return NextResponse.redirect(`${appBase}/app`);
      }
    }

    // If we reach here, create new organization for this user
    console.log(
      '[auth/callback] 🚀 NEW USER: Creating organization and setting up onboarding',
    );

    const fallbackName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split('@')[0] ||
      'New Organization';

    try {
      const now = new Date().toISOString();

      // Use the admin (service-role) client for bootstrap writes so RLS doesn't block
      const { data: organization, error: orgError } = await admin
        .from('organizations')
        .insert({
          name: fallbackName,
          created_by: data.user.id, // Set the creating user ID properly
          plan_key: plan ?? null,
          plan_selected_at: plan ? now : null,
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
        return NextResponse.redirect(
          `${appBase}/auth/signin?error=org_creation_failed&message=${encodeURIComponent(
            'Account setup failed. Please try signing in again.',
          )}`,
        );
      }

      // Create org membership with proper role
      const { error: memberError } = await admin.from('org_members').insert({
        organization_id: organization.id,
        user_id: data.user.id,
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
        data.user.id,
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
    return NextResponse.redirect(`${appBase}/onboarding${planQuery}`);
  }

  // 5. EXISTING USER WITH ORGANIZATION - Check their onboarding status
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
      .eq('user_id', data.user.id);
  }

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('plan_key, industry, onboarding_completed, frameworks')
    .eq('id', membership.organization_id)
    .maybeSingle();

  if (orgError) {
    console.error('Organization lookup failed:', orgError);
  }

  const resolvedPlan = resolvePlanKey(organization?.plan_key ?? null) || plan;
  await ensureSubscription(membership.organization_id, resolvedPlan);

  // CRITICAL: Validate compliance graph integrity for existing users
  console.log('[auth/callback] 🔍 Validating compliance graph integrity');
  const graphValidation = await validateComplianceGraph(
    membership.organization_id,
  );

  if (!graphValidation.isValid) {
    console.log(
      `[auth/callback] ⚠️  Graph issues detected: ${graphValidation.issues.join(', ')}`,
    );
    // Note: We don't block login for graph issues, just log them
  } else {
    console.log('[auth/callback] ✅ Compliance graph integrity verified');
  }

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
    return NextResponse.redirect(`${appBase}/onboarding${planQuery}`);
  }

  console.log('[auth/callback] ✅ User fully onboarded, redirecting to app');
  return NextResponse.redirect(`${appBase}/app`);
}
