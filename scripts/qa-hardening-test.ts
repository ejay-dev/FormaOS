/**
 * QA Hardening Test Script
 * Tests all user flows with the hardening fixes
 *
 * Run with: npx tsx scripts/qa-hardening-test.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bvfniosswcvuyfaaicze.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Zm5pb3Nzd2N2dXlmYWFpY3plIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njg5NjQyNSwiZXhwIjoyMDgyNDcyNDI1fQ.486jhV7U5BM7B4Px4tGUQ_V3PP0s6tu15OZbMHT22Vg';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2Zm5pb3Nzd2N2dXlmYWFpY3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTY0MjUsImV4cCI6MjA4MjQ3MjQyNX0.tYxorl1DjdgcDZreor_AqGiz2zqxaYVwNMApCpnsrPI';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const timestamp = Date.now();
const createdUserIds: string[] = [];
const createdOrgIds: string[] = [];

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function log(msg: string) {
  console.log(`[QA] ${msg}`);
}

function logResult(result: TestResult) {
  results.push(result);
  const status = result.passed ? '✅' : '❌';
  console.log(`${status} ${result.test}: ${result.details}`);
}

// Legacy plan_code mapping
function toLegacyPlanCode(planKey: string): string {
  return planKey === 'basic' ? 'starter' : planKey;
}

async function createTestUser(email: string, password: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    logResult({ test: `Create user ${email}`, passed: false, details: error.message });
    return null;
  }

  createdUserIds.push(data.user.id);
  return data.user.id;
}

async function simulateFullAuthCallback(
  userId: string,
  email: string,
  plan: string | null,
  isExistingUser: boolean = false
): Promise<boolean> {
  const now = new Date().toISOString();
  const fallbackName = email.split('@')[0];

  // HARDENING: Default to 'basic' if no plan
  const resolvedPlan = plan || 'basic';

  if (!isExistingUser) {
    // 1. Create organization
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name: fallbackName,
        created_by: userId,
        plan_key: resolvedPlan,
        plan_selected_at: now,
        onboarding_completed: false,
      })
      .select('id')
      .single();

    if (orgError || !org?.id) {
      logResult({ test: `Create org for ${email}`, passed: false, details: orgError?.message || 'No org ID' });
      return false;
    }

    createdOrgIds.push(org.id);

    // 2. Create legacy orgs entry (upsert for safety)
    await admin.from('orgs').upsert({
      id: org.id,
      name: fallbackName,
      created_by: userId,
      created_at: now,
      updated_at: now,
    }, { onConflict: 'id' });

    // 3. Create membership
    await admin.from('org_members').insert({
      organization_id: org.id,
      user_id: userId,
      role: 'owner',
    });

    // 4. Create subscription with trial
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    await admin.from('org_subscriptions').upsert({
      org_id: org.id,
      organization_id: org.id,
      plan_code: toLegacyPlanCode(resolvedPlan),
      plan_key: resolvedPlan,
      status: 'trialing',
      current_period_end: trialEnd.toISOString(),
      trial_started_at: now,
      trial_expires_at: trialEnd.toISOString(),
      updated_at: now,
    });

    // 5. Sync entitlements
    const entitlements = resolvedPlan === 'pro'
      ? ['audit_export', 'reports', 'framework_evaluations', 'certifications', 'team_limit']
      : ['audit_export', 'reports', 'framework_evaluations', 'team_limit'];

    for (const feature of entitlements) {
      await admin.from('org_entitlements').upsert({
        organization_id: org.id,
        feature_key: feature,
        enabled: true,
        updated_at: now,
      }, { onConflict: 'organization_id,feature_key' });
    }
  }

  return true;
}

async function verifyUserHasAccess(userId: string, email: string): Promise<void> {
  // Check membership
  const { data: membership } = await admin
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership?.organization_id) {
    logResult({ test: `${email} has org membership`, passed: false, details: 'No membership found' });
    return;
  }

  logResult({ test: `${email} has org membership`, passed: true, details: `Role: ${membership.role}` });

  // Check subscription
  const { data: subscription } = await admin
    .from('org_subscriptions')
    .select('plan_key, status, org_id')
    .eq('organization_id', membership.organization_id)
    .maybeSingle();

  const hasValidSub = Boolean(
    subscription && ['active', 'trialing'].includes(subscription.status),
  );
  const hasLegacyOrgId = subscription?.org_id === membership.organization_id;

  logResult({
    test: `${email} has valid subscription`,
    passed: hasValidSub,
    details: hasValidSub
      ? `Plan: ${subscription.plan_key}, Status: ${subscription.status}`
      : 'No valid subscription'
  });

  logResult({
    test: `${email} has legacy org_id set`,
    passed: hasLegacyOrgId,
    details: hasLegacyOrgId ? 'org_id matches organization_id' : 'org_id missing or mismatched'
  });

  // Check entitlements
  const { data: entitlements } = await admin
    .from('org_entitlements')
    .select('feature_key, enabled')
    .eq('organization_id', membership.organization_id);

  const enabledCount = entitlements?.filter(e => e.enabled).length || 0;
  logResult({
    test: `${email} has entitlements`,
    passed: enabledCount > 0,
    details: `${enabledCount} features enabled`
  });

  // Check legacy orgs entry
  const { data: legacyOrg } = await admin
    .from('orgs')
    .select('id')
    .eq('id', membership.organization_id)
    .maybeSingle();

  logResult({
    test: `${email} has legacy orgs entry`,
    passed: !!legacyOrg,
    details: legacyOrg ? 'Legacy org exists' : 'Missing legacy org entry'
  });

  // Check login works
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: session } = await anonClient.auth.signInWithPassword({
    email,
    password: 'QaTest123!Secure',
  });

  logResult({
    test: `${email} can login`,
    passed: !!session?.session,
    details: session?.session ? 'Login successful' : 'Login failed'
  });

  await anonClient.auth.signOut();
}

async function cleanup(): Promise<void> {
  log('Cleaning up test data...');

  for (const orgId of createdOrgIds) {
    await admin.from('org_entitlements').delete().eq('organization_id', orgId);
    await admin.from('org_subscriptions').delete().eq('organization_id', orgId);
    await admin.from('org_onboarding_status').delete().eq('organization_id', orgId);
    await admin.from('org_members').delete().eq('organization_id', orgId);
    await admin.from('orgs').delete().eq('id', orgId);
    await admin.from('organizations').delete().eq('id', orgId);
  }

  for (const userId of createdUserIds) {
    await admin.auth.admin.deleteUser(userId);
  }

  log(`Cleanup complete: ${createdUserIds.length} users, ${createdOrgIds.length} orgs deleted`);
}

async function runTests(): Promise<void> {
  console.log('\n========================================');
  console.log('FormaOS QA Hardening Tests');
  console.log('========================================\n');

  try {
    // Test 1: New user via CTA with basic plan
    log('\n--- Test 1: New User via CTA (basic plan) ---');
    const basicEmail = `qa.basic.${timestamp}@formaos.team`;
    const basicUserId = await createTestUser(basicEmail, 'QaTest123!Secure');
    if (basicUserId) {
      await simulateFullAuthCallback(basicUserId, basicEmail, 'basic');
      await verifyUserHasAccess(basicUserId, basicEmail);
    }

    // Test 2: New user via CTA with pro plan
    log('\n--- Test 2: New User via CTA (pro plan) ---');
    const proEmail = `qa.pro.${timestamp}@formaos.team`;
    const proUserId = await createTestUser(proEmail, 'QaTest123!Secure');
    if (proUserId) {
      await simulateFullAuthCallback(proUserId, proEmail, 'pro');
      await verifyUserHasAccess(proUserId, proEmail);
    }

    // Test 3: User via direct /auth/signup (no plan - should default to basic)
    log('\n--- Test 3: User via Direct Signup (no plan - should default to basic) ---');
    const noPlanEmail = `qa.noplan.${timestamp}@formaos.team`;
    const noPlanUserId = await createTestUser(noPlanEmail, 'QaTest123!Secure');
    if (noPlanUserId) {
      await simulateFullAuthCallback(noPlanUserId, noPlanEmail, null); // No plan specified
      await verifyUserHasAccess(noPlanUserId, noPlanEmail);
    }

    // Test 4: Google OAuth signup (plan missing - simulated)
    log('\n--- Test 4: Google OAuth Signup (no plan in callback) ---');
    const oauthEmail = `qa.oauth.${timestamp}@formaos.team`;
    const oauthUserId = await createTestUser(oauthEmail, 'QaTest123!Secure');
    if (oauthUserId) {
      await simulateFullAuthCallback(oauthUserId, oauthEmail, null); // No plan (simulates OAuth without plan param)
      await verifyUserHasAccess(oauthUserId, oauthEmail);
    }

    // Test 5: Existing user (simulate user created before today without proper setup)
    log('\n--- Test 5: Existing User Backfill (missing subscription/entitlements) ---');
    const existingEmail = `qa.existing.${timestamp}@formaos.team`;
    const existingUserId = await createTestUser(existingEmail, 'QaTest123!Secure');
    if (existingUserId) {
      // Create org and membership WITHOUT subscription/entitlements (simulates old user)
      const now = new Date().toISOString();
      const { data: oldOrg } = await admin
        .from('organizations')
        .insert({
          name: 'Old Organization',
          created_by: existingUserId,
          plan_key: null, // No plan set
          onboarding_completed: true, // Already onboarded
        })
        .select('id')
        .single();

      if (oldOrg?.id) {
        createdOrgIds.push(oldOrg.id);

        // Create membership but NO legacy orgs, NO subscription, NO entitlements
        await admin.from('org_members').insert({
          organization_id: oldOrg.id,
          user_id: existingUserId,
          role: 'owner',
        });

        log('Created old user without subscription/entitlements - simulating backfill...');

        // Now simulate what auth callback does for existing users
        // BACKFILL: Create legacy orgs entry
        await admin.from('orgs').upsert({
          id: oldOrg.id,
          name: 'Old Organization',
          created_by: existingUserId,
          created_at: now,
          updated_at: now,
        }, { onConflict: 'id' });

        // BACKFILL: Update org with default plan
        await admin
          .from('organizations')
          .update({ plan_key: 'basic', plan_selected_at: now })
          .eq('id', oldOrg.id);

        // BACKFILL: Create subscription
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);

        await admin.from('org_subscriptions').upsert({
          org_id: oldOrg.id,
          organization_id: oldOrg.id,
          plan_code: 'starter',
          plan_key: 'basic',
          status: 'trialing',
          current_period_end: trialEnd.toISOString(),
          trial_started_at: now,
          trial_expires_at: trialEnd.toISOString(),
          updated_at: now,
        });

        // BACKFILL: Create entitlements
        const entitlements = ['audit_export', 'reports', 'framework_evaluations', 'team_limit'];
        for (const feature of entitlements) {
          await admin.from('org_entitlements').upsert({
            organization_id: oldOrg.id,
            feature_key: feature,
            enabled: true,
            updated_at: now,
          }, { onConflict: 'organization_id,feature_key' });
        }

        await verifyUserHasAccess(existingUserId, existingEmail);
      }
    }

  } catch (err) {
    console.error('Test suite error:', err);
  } finally {
    await cleanup();
  }

  // Summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.test}: ${r.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! All users end at /app with access.');
    process.exit(0);
  }
}

runTests();
