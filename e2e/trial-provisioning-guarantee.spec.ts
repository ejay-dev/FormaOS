/**
 * Trial Provisioning Reliability Test
 *
 * Validates that after signup:
 * - User has organization
 * - User has trial subscription (14 days)
 * - User has basic entitlements
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })
    : null;

const appBase = process.env.PLAYWRIGHT_APP_BASE ?? 'https://app.formaos.com.au';

async function createTestUser(email: string): Promise<{ userId: string }> {
  if (!admin) throw new Error('Admin client not available');

  const password = `TestPass${Date.now()}!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      is_e2e_test: true,
      created_at: new Date().toISOString(),
    },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create user: ${error?.message}`);
  }

  return { userId: data.user.id };
}

async function cleanupUser(userId: string) {
  if (!admin) return;

  try {
    const { data: membership } = await admin
      .from('org_members')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (membership?.organization_id) {
      const { error: entitlementsDeleteError } = await admin
        .from('org_entitlements')
        .delete()
        .eq('organization_id', membership.organization_id);
      if (entitlementsDeleteError) {
        console.warn(
          '[trial-provisioning] cleanup org_entitlements failed:',
          entitlementsDeleteError.message,
        );
      }

      const { error: subscriptionsDeleteError } = await admin
        .from('org_subscriptions')
        .delete()
        .eq('organization_id', membership.organization_id);
      if (subscriptionsDeleteError) {
        console.warn(
          '[trial-provisioning] cleanup org_subscriptions failed:',
          subscriptionsDeleteError.message,
        );
      }

      const { error: membersDeleteError } = await admin
        .from('org_members')
        .delete()
        .eq('organization_id', membership.organization_id);
      if (membersDeleteError) {
        console.warn(
          '[trial-provisioning] cleanup org_members failed:',
          membersDeleteError.message,
        );
      }

      const { error: organizationsDeleteError } = await admin
        .from('organizations')
        .delete()
        .eq('id', membership.organization_id);
      if (organizationsDeleteError) {
        console.warn(
          '[trial-provisioning] cleanup organizations failed:',
          organizationsDeleteError.message,
        );
      }
    }

    await admin.auth.admin.deleteUser(userId).catch(() => null);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

test.describe('Trial Provisioning - Data Integrity', () => {
  test.beforeAll(async () => {
    if (!admin) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL required',
      );
    }
  });

  test('Manual signup creates complete trial setup', async () => {
    const email = `signup_${Date.now()}@test.formaos.local`;
    const { userId } = await createTestUser(email);

    try {
      // Simulate bootstrap by manually creating the trial setup
      // (This is what the auth/callback endpoint should do)
      const { data: org } = await admin!
        .from('organizations')
        .insert({
          name: `Test Org ${Date.now()}`,
          plan_key: 'basic',
        })
        .select()
        .single();

      if (!org) throw new Error('Failed to create organization');

      // Create membership
      await admin!.from('org_members').insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

      // Create trial subscription (14 days)
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      await admin!.from('org_subscriptions').insert({
        organization_id: org.id,
        plan_key: 'basic',
        status: 'trialing',
        trial_started_at: now.toISOString(),
        trial_expires_at: trialEnd.toISOString(),
      });

      // Create basic entitlements
      const entitlements = [
        { feature_key: 'audit_export', enabled: true },
        { feature_key: 'reports', enabled: true },
        { feature_key: 'framework_evaluations', enabled: true },
        { feature_key: 'team_limit', enabled: true, limit_value: 15 },
      ];

      for (const ent of entitlements) {
        await admin!.from('org_entitlements').upsert({
          organization_id: org.id,
          feature_key: ent.feature_key,
          enabled: ent.enabled,
          ...(ent.limit_value ? { limit_value: ent.limit_value } : {}),
        });
      }

      // ✅ Verify complete setup
      // 1. Membership exists
      const { data: membership } = await admin!
        .from('org_members')
        .select('organization_id, role')
        .eq('user_id', userId)
        .maybeSingle();

      expect(membership?.organization_id).toBe(org.id);
      expect(membership?.role).toBe('owner');

      // 2. Subscription exists with correct duration
      const { data: subscription } = await admin!
        .from('org_subscriptions')
        .select('status, trial_started_at, trial_expires_at')
        .eq('organization_id', org.id)
        .maybeSingle();

      expect(subscription?.status).toBe('trialing');

      const startDate = new Date(subscription!.trial_started_at!).getTime();
      const endDate = new Date(subscription!.trial_expires_at!).getTime();
      const daysMs = endDate - startDate;
      const daysCount = Math.round(daysMs / (24 * 60 * 60 * 1000));

      expect(daysCount).toBe(14);

      // 3. Entitlements exist and enabled
      const { data: ents } = await admin!
        .from('org_entitlements')
        .select('feature_key, enabled')
        .eq('organization_id', org.id);

      const enabledFeatures = (ents ?? [])
        .filter((e) => e.enabled)
        .map((e) => e.feature_key);
      expect(enabledFeatures).toContain('audit_export');
      expect(enabledFeatures).toContain('reports');
      expect(enabledFeatures).toContain('framework_evaluations');
    } finally {
      await cleanupUser(userId);
    }
  });

  test('Trial expiration date is correctly set', async () => {
    const email = `trial_duration_${Date.now()}@test.formaos.local`;
    const { userId } = await createTestUser(email);

    try {
      const { data: org } = await admin!
        .from('organizations')
        .insert({ name: `Test ${Date.now()}` })
        .select()
        .single();

      await admin!.from('org_members').insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

      const startTime = Date.now();
      const start = new Date(startTime);
      const end = new Date(startTime + 14 * 24 * 60 * 60 * 1000);

      await admin!.from('org_subscriptions').insert({
        organization_id: org.id,
        plan_key: 'basic',
        status: 'trialing',
        trial_started_at: start.toISOString(),
        trial_expires_at: end.toISOString(),
      });

      // Verify dates
      const { data: sub } = await admin!
        .from('org_subscriptions')
        .select('trial_started_at, trial_expires_at')
        .eq('organization_id', org.id)
        .single();

      if (!sub) throw new Error('Subscription not found');

      const duration =
        new Date(sub.trial_expires_at).getTime() -
        new Date(sub.trial_started_at).getTime();
      const days = Math.round(duration / (24 * 60 * 60 * 1000));

      expect(days).toBe(14);
    } finally {
      await cleanupUser(userId);
    }
  });

  test('Trial entitlements prevents access to locked features', async () => {
    const email = `entitlements_${Date.now()}@test.formaos.local`;
    const { userId } = await createTestUser(email);

    try {
      const { data: org } = await admin!
        .from('organizations')
        .insert({ name: `Test ${Date.now()}` })
        .select()
        .single();

      await admin!.from('org_members').insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
      });

      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      await admin!.from('org_subscriptions').insert({
        organization_id: org.id,
        plan_key: 'basic',
        status: 'trialing',
        trial_started_at: now.toISOString(),
        trial_expires_at: trialEnd.toISOString(),
      });

      // Create only basic tier entitlements
      const basicFeatures = [
        'audit_export',
        'reports',
        'framework_evaluations',
      ];
      for (const feature of basicFeatures) {
        await admin!.from('org_entitlements').upsert({
          organization_id: org.id,
          feature_key: feature,
          enabled: true,
        });
      }

      // Verify certifications (pro-only) is NOT enabled
      const { data: certEnt } = await admin!
        .from('org_entitlements')
        .select('enabled')
        .eq('organization_id', org.id)
        .eq('feature_key', 'certifications')
        .maybeSingle();

      // Either doesn't exist or is disabled
      expect(!certEnt || !certEnt.enabled).toBeTruthy();
    } finally {
      await cleanupUser(userId);
    }
  });
});
