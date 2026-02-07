/**
 * E2E Test Authentication Helper
 * Provides self-contained auth for Playwright tests
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env.local for local development
config({ path: '.env.local' });

interface TestUser {
  id: string;
  email: string;
  password: string;
  orgId?: string;
}

// Test user state (module-level for cleanup)
let createdTestUser: TestUser | null = null;

/**
 * Get or create test credentials
 * Uses env vars if available, otherwise creates temporary user
 */
export async function getTestCredentials(): Promise<{
  email: string;
  password: string;
}> {
  // Use environment variables if provided
  if (process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) {
    return {
      email: process.env.E2E_TEST_EMAIL,
      password: process.env.E2E_TEST_PASSWORD,
    };
  }

  // Create temporary test user
  const testUser = await createTemporaryTestUser();
  return {
    email: testUser.email,
    password: testUser.password,
  };
}

/**
 * Create a temporary test user via Supabase Admin API
 */
async function createTemporaryTestUser(): Promise<TestUser> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'E2E tests require either E2E_TEST_EMAIL/PASSWORD or SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Generate unique test email
  const testId = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const email = `${testId}@test.formaos.local`;
  const password = `TestPass${testId}!`;

  // Create user with admin API (auto-confirms email)
  const { data: userData, error: userError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for testing
      user_metadata: {
        is_e2e_test: true,
        created_at: new Date().toISOString(),
      },
    });

  if (userError || !userData.user) {
    throw new Error(`Failed to create test user: ${userError?.message}`);
  }

  // Create test organization
  const { data: orgData, error: orgError } = await adminClient
    .from('organizations')
    .insert({
      name: `E2E Test Org ${testId}`,
      industry: 'healthcare',
      team_size: '1-10',
      plan_key: 'pro',
      onboarding_completed: true, // Skip onboarding for tests
    })
    .select('id')
    .single();

  if (orgError) {
    // Cleanup user if org creation fails
    await adminClient.auth.admin.deleteUser(userData.user.id);
    throw new Error(`Failed to create test org: ${orgError.message}`);
  }

  // Add user as org owner
  const { error: memberError } = await adminClient.from('org_members').insert({
    user_id: userData.user.id,
    organization_id: orgData.id,
    role: 'owner',
  });

  if (memberError) {
    // Cleanup
    await adminClient.from('organizations').delete().eq('id', orgData.id);
    await adminClient.auth.admin.deleteUser(userData.user.id);
    throw new Error(`Failed to add user to org: ${memberError.message}`);
  }

  // Create trial subscription (required by middleware)
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14); // 14 day trial

  const { error: subscriptionError } = await adminClient
    .from('org_subscriptions')
    .insert({
      organization_id: orgData.id,
      org_id: orgData.id, // Legacy column, still required
      plan_key: 'pro',
      status: 'trialing',
      trial_expires_at: trialEnd.toISOString(),
      current_period_end: trialEnd.toISOString(),
    });

  if (subscriptionError) {
    console.warn('[E2E] Failed to create subscription:', subscriptionError.message);
    // Don't fail - subscription might already exist or be optional
  }

  createdTestUser = {
    id: userData.user.id,
    email,
    password,
    orgId: orgData.id,
  };

  return createdTestUser;
}

/**
 * Cleanup temporary test user and org
 * Call this in globalTeardown or afterAll
 */
export async function cleanupTestUser(): Promise<void> {
  if (!createdTestUser) return;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Delete subscription first (before org)
    if (createdTestUser.orgId) {
      await adminClient
        .from('org_subscriptions')
        .delete()
        .eq('organization_id', createdTestUser.orgId);
    }

    // Delete org member
    await adminClient
      .from('org_members')
      .delete()
      .eq('user_id', createdTestUser.id);

    // Delete organization and cascade
    if (createdTestUser.orgId) {
      await adminClient
        .from('organizations')
        .delete()
        .eq('id', createdTestUser.orgId);
    }

    // Delete user
    await adminClient.auth.admin.deleteUser(createdTestUser.id);

    createdTestUser = null;
  } catch (error) {
    console.error('[E2E Cleanup] Failed to cleanup test user:', error);
  }
}

/**
 * Check if running in test environment
 */
export function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.PLAYWRIGHT_TEST_BASE_URL !== undefined ||
    process.env.CI !== undefined
  );
}
