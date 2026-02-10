/**
 * E2E Test Authentication Helper
 * Provides self-contained auth for Playwright tests
 */

import { createClient, type Session } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env.local for local development
config({ path: '.env.local' });

interface TestUser {
  id: string;
  email: string;
  password: string;
  orgId?: string;
}

type SupabaseEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
};

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

function resolveSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error(
      'Supabase env missing: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are required',
    );
  }

  return { url: supabaseUrl, anonKey, serviceRoleKey };
}

function toBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function createCookieChunks(key: string, value: string, chunkSize = 3180) {
  let encodedValue = encodeURIComponent(value);

  if (encodedValue.length <= chunkSize) {
    return [{ name: key, value }];
  }

  const chunks: string[] = [];
  while (encodedValue.length > 0) {
    let encodedChunkHead = encodedValue.slice(0, chunkSize);
    const lastEscapePos = encodedChunkHead.lastIndexOf('%');

    if (lastEscapePos > chunkSize - 3) {
      encodedChunkHead = encodedChunkHead.slice(0, lastEscapePos);
    }

    let valueHead = '';
    while (encodedChunkHead.length > 0) {
      try {
        valueHead = decodeURIComponent(encodedChunkHead);
        break;
      } catch (error) {
        if (
          error instanceof URIError &&
          encodedChunkHead.at(-3) === '%' &&
          encodedChunkHead.length > 3
        ) {
          encodedChunkHead = encodedChunkHead.slice(
            0,
            encodedChunkHead.length - 3,
          );
        } else {
          throw error;
        }
      }
    }

    chunks.push(valueHead);
    encodedValue = encodedValue.slice(encodedChunkHead.length);
  }

  return chunks.map((chunk, index) => ({
    name: `${key}.${index}`,
    value: chunk,
  }));
}

function getStorageKey(supabaseUrl: string) {
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}

export async function createMagicLinkSession(email: string): Promise<Session> {
  const { url, anonKey, serviceRoleKey } = resolveSupabaseEnv();

  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error(`Failed to generate magic link: ${linkError?.message}`);
  }

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const { data: verifyData, error: verifyError } =
    await userClient.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token,
    });

  if (verifyError || !verifyData?.session) {
    throw new Error(`Failed to verify magic link: ${verifyError?.message}`);
  }

  return verifyData.session;
}

export async function setPlaywrightSession(
  context: { addCookies: (cookies: any[]) => Promise<void> },
  session: Session,
  appBaseUrl: string,
) {
  const { url } = resolveSupabaseEnv();
  const storageKey = getStorageKey(url);
  const serialized = JSON.stringify(session);
  const encoded = `base64-${toBase64Url(serialized)}`;
  const chunks = createCookieChunks(storageKey, encoded);
  const base = new URL(appBaseUrl);
  const cookieUrl = `${base.protocol}//${base.host}`;

  await context.addCookies(
    chunks.map((chunk) => ({
      name: chunk.name,
      value: chunk.value,
      url: cookieUrl,
      httpOnly: false,
      secure: base.protocol === 'https:',
      sameSite: 'Lax',
    })),
  );
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

  const nowIso = new Date().toISOString();
  // Backfill legacy orgs table for org_subscriptions.org_id FK
  try {
    await adminClient.from('orgs').upsert(
      {
        id: orgData.id,
        name: `E2E Test Org ${testId}`,
        created_by: userData.user.id,
        created_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'id' },
    );
  } catch (error) {
    console.warn('[E2E] Failed to backfill orgs table:', error);
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

  // Ensure MFA is enabled for privileged test users to satisfy enforcement
  try {
    await adminClient.from('user_security').upsert(
      {
        user_id: userData.user.id,
        two_factor_enabled: true,
        two_factor_enabled_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'user_id' },
    );
  } catch (error) {
    console.warn('[E2E] Failed to set MFA for test user:', error);
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
      plan_code: 'pro', // Legacy FK requires plan_code in some schemas
      status: 'trialing',
      trial_expires_at: trialEnd.toISOString(),
      current_period_end: trialEnd.toISOString(),
      updated_at: nowIso,
    });

  if (subscriptionError) {
    console.warn(
      '[E2E] Failed to create subscription:',
      subscriptionError.message,
    );
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
