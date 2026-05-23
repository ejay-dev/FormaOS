/**
 * E2E Test Authentication Helper
 * Provides self-contained auth for Playwright tests
 */

import fs from 'fs';
import path from 'path';
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

type AuthWriteAvailability = {
  available: boolean;
  reason: string | null;
};

const AUTH_BOOTSTRAP_TIMEOUT_MS = 5_000;

function isPlaceholderValue(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.startsWith('your-') ||
    normalized.includes('your-project') ||
    normalized.includes('example.com') ||
    normalized.startsWith('placeholder') ||
    normalized.startsWith('changeme') ||
    /^<.*>$/.test(normalized)
  );
}

function sanitizeEnvValue(value: string | undefined) {
  return (value ?? '').trim().replace(/^['"]|['"]$/g, '');
}

function isResolvableSupabaseUrl(value: string) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return !host.startsWith('your-') && !host.includes('your-project');
  } catch {
    return false;
  }
}

function toBootstrapErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message.includes('ENOTFOUND') ||
    message.includes("Unexpected token '<'") ||
    message.includes('Invalid API key') ||
    message.includes('invalid api key') ||
    message.includes('invalid jwt') ||
    message.includes('unauthorized') ||
    message.includes('upstream request timeout') ||
    message.includes('E2E_AUTH_SIGN_IN_TIMEOUT')
  ) {
    return (
      'E2E auth bootstrap unavailable: Supabase auth is timing out. ' +
      'Tests will be skipped until Supabase recovers.'
    );
  }
  return null;
}

function isTransientAuthProbeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('fetch failed') ||
    message.includes('TimeoutError') ||
    message.includes('timeout') ||
    message.includes('upstream connect error') ||
    message.includes('upstream request timeout') ||
    message.includes('ECONNRESET') ||
    message.includes('socket hang up')
  );
}

/** Race a promise against a timeout, rejecting with a recognisable error. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`E2E_AUTH_SIGN_IN_TIMEOUT after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

export class E2EAuthBootstrapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'E2EAuthBootstrapError';
  }
}

export function isE2EAuthBootstrapError(
  error: unknown,
): error is E2EAuthBootstrapError {
  return error instanceof E2EAuthBootstrapError;
}

// Test user state (module-level for cleanup)
let createdTestUser: TestUser | null = null;
const E2E_CACHE_DIR = path.join(process.cwd(), 'test-results');
const E2E_AUTH_CACHE_PATH = path.join(E2E_CACHE_DIR, 'e2e-auth-user.json');
const E2E_SESSION_CACHE_PATH = path.join(
  E2E_CACHE_DIR,
  'e2e-session-cache.json',
);
let cachedAuthWriteAvailability: AuthWriteAvailability | null = null;

function loadCachedTestUser(): TestUser | null {
  try {
    if (!fs.existsSync(E2E_AUTH_CACHE_PATH)) {
      return null;
    }

    const parsed = JSON.parse(
      fs.readFileSync(E2E_AUTH_CACHE_PATH, 'utf8'),
    ) as TestUser;

    if (!parsed?.id || !parsed?.email || !parsed?.password) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function persistCachedTestUser(user: TestUser) {
  fs.mkdirSync(E2E_CACHE_DIR, { recursive: true });
  fs.writeFileSync(E2E_AUTH_CACHE_PATH, JSON.stringify(user, null, 2));
}

function clearCachedTestUser() {
  try {
    if (fs.existsSync(E2E_AUTH_CACHE_PATH)) {
      fs.unlinkSync(E2E_AUTH_CACHE_PATH);
    }
  } catch (error) {
    console.warn('[E2E] Failed to clear cached auth user:', error);
  }
}

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

  if (createdTestUser) {
    return {
      email: createdTestUser.email,
      password: createdTestUser.password,
    };
  }

  const cachedTestUser = loadCachedTestUser();
  if (cachedTestUser) {
    createdTestUser =
      (await ensureCachedTestUserProvisioned(cachedTestUser)) ?? null;
    if (!createdTestUser) {
      clearCachedTestUser();
      const testUser = await createTemporaryTestUser();
      return {
        email: testUser.email,
        password: testUser.password,
      };
    }
    return {
      email: createdTestUser.email,
      password: createdTestUser.password,
    };
  }

  // Create temporary test user
  const testUser = await createTemporaryTestUser();
  return {
    email: testUser.email,
    password: testUser.password,
  };
}

async function ensureCachedTestUserProvisioned(
  user: TestUser,
): Promise<TestUser | null> {
  let env: SupabaseEnv;
  try {
    env = resolveSupabaseEnv();
  } catch {
    return user;
  }

  const adminClient = createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: authUser, error: authUserError } = await withTimeout(
    adminClient.auth.admin.getUserById(user.id),
    12_000,
  ).catch(() => ({
    data: null,
    error: new Error('E2E_AUTH_SIGN_IN_TIMEOUT after 12000ms'),
  }));
  if (authUserError || !authUser?.user) {
    return null;
  }

  const { data: memberships, error: membershipError } = await adminClient
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id);

  if (membershipError) {
    console.warn(
      '[E2E] Failed to inspect cached user memberships:',
      membershipError.message,
    );
    return user;
  }

  const orgIds = Array.from(
    new Set(
      (memberships ?? [])
        .map((membership) => membership.organization_id)
        .filter((orgId): orgId is string => typeof orgId === 'string'),
    ),
  );

  if (orgIds.length === 0) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const trialEnd = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  for (const orgId of orgIds) {
    await adminClient
      .from('organizations')
      .update({
        industry: 'healthcare',
        team_size: '1-10',
        plan_key: 'pro',
        frameworks: ['soc2'],
        onboarding_completed: true,
        updated_at: nowIso,
      })
      .eq('id', orgId);

    {
      // Mirror to legacy `orgs` table — error must propagate, not warn-
      // and-continue, or qa:deep's check-orgs-sync.mjs fails on the next
      // run (v3-010 / v4-001).
      const { error: legacyOrgsError } = await adminClient.from('orgs').upsert(
        {
          id: orgId,
          name: `E2E Test Org ${user.email.split('@')[0]}`,
          created_by: user.id,
          created_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'id' },
      );
      if (legacyOrgsError) {
        throw new Error(
          `legacy_orgs_mirror_failed: ${legacyOrgsError.message}`,
        );
      }
    }

    await adminClient.from('org_frameworks').upsert(
      {
        organization_id: orgId,
        framework_slug: 'soc2',
        enabled_at: nowIso,
      },
      { onConflict: 'organization_id,framework_slug' },
    );

    await adminClient.from('org_onboarding_status').upsert(
      {
        organization_id: orgId,
        current_step: 7,
        completed_steps: [1, 2, 3, 4, 5, 6, 7],
        completed_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'organization_id' },
    );

    const subscriptionPatch = {
      status: 'trialing',
      trial_expires_at: trialEnd,
      current_period_end: trialEnd,
      updated_at: nowIso,
    };

    const { data: subscription } = await adminClient
      .from('org_subscriptions')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .maybeSingle();

    if (subscription?.id) {
      await adminClient
        .from('org_subscriptions')
        .update(subscriptionPatch)
        .eq('id', subscription.id);
    } else {
      await adminClient.from('org_subscriptions').insert({
        organization_id: orgId,
        org_id: orgId,
        plan_key: 'pro',
        plan_code: 'pro',
        ...subscriptionPatch,
      });
    }
  }

  await adminClient.from('user_security').upsert(
    {
      user_id: user.id,
      two_factor_enabled: true,
      two_factor_enabled_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'user_id' },
  );

  const repairedUser = { ...user, orgId: orgIds[0] };
  persistCachedTestUser(repairedUser);
  return repairedUser;
}

function resolveSupabaseEnv(): SupabaseEnv {
  const supabaseUrl = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceRoleKey = sanitizeEnvValue(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new E2EAuthBootstrapError(
      'Supabase env missing: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are required',
    );
  }

  if (
    isPlaceholderValue(supabaseUrl) ||
    isPlaceholderValue(anonKey) ||
    isPlaceholderValue(serviceRoleKey) ||
    !isResolvableSupabaseUrl(supabaseUrl)
  ) {
    throw new E2EAuthBootstrapError(
      'Supabase env is configured with placeholder values. Provide real Supabase credentials or set E2E_TEST_EMAIL/E2E_TEST_PASSWORD.',
    );
  }

  return { url: supabaseUrl, anonKey, serviceRoleKey };
}

export async function getSupabaseAuthWriteAvailability(): Promise<AuthWriteAvailability> {
  if (cachedAuthWriteAvailability) {
    return cachedAuthWriteAvailability;
  }

  try {
    const { url, anonKey } = resolveSupabaseEnv();
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({
        email: `auth-probe-${Date.now()}@test.formaos.local`,
        password: 'invalid-password',
      }),
      signal: AbortSignal.timeout(AUTH_BOOTSTRAP_TIMEOUT_MS),
    });

    if ([400, 401, 422, 429].includes(response.status)) {
      cachedAuthWriteAvailability = {
        available: true,
        reason: null,
      };
      return cachedAuthWriteAvailability;
    }

    // 504 / 5xx from the probe — treat as transient so we try sign-in
    // (the actual sign-in has its own withTimeout guard)
    if (response.status >= 500) {
      return { available: true, reason: null };
    }

    const responseText = await response.text().catch(() => '');
    cachedAuthWriteAvailability = {
      available: false,
      reason: `Supabase Auth returned ${response.status}${responseText ? `: ${responseText.slice(0, 120)}` : ''}`,
    };
    return cachedAuthWriteAvailability;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isTransientAuthProbeError(error)) {
      return {
        available: true,
        reason: `Supabase Auth probe was transiently unavailable: ${message}`,
      };
    }

    cachedAuthWriteAvailability = {
      available: false,
      reason: `Supabase Auth write endpoints are unavailable: ${message}`,
    };
    return cachedAuthWriteAvailability;
  }
}

async function assertSupabaseAuthWriteAvailability() {
  const availability = await getSupabaseAuthWriteAvailability();
  if (!availability.available) {
    throw new E2EAuthBootstrapError(
      availability.reason ??
        'Supabase Auth write endpoints are unavailable for E2E bootstrap.',
    );
  }
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

/**
 * Decode the `session_id` claim from a Supabase access token without
 * verifying the signature — Supabase already issued and signed it.
 * Returns null on malformed input.
 */
function extractSessionIdFromAccessToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as { session_id?: unknown };
    return typeof payload.session_id === 'string' ? payload.session_id : null;
  } catch {
    return null;
  }
}

/**
 * Mark an E2E session as MFA-passed so the layout-level gate admits
 * the test user. The MFA enforcement is real in production: tests
 * opt in by recording the session_id of the cookies they install.
 */
async function markE2eSessionMfaPassed(
  session: Session,
  env: SupabaseEnv,
): Promise<void> {
  if (!session.user?.id || !session.access_token) return;
  const sessionId = extractSessionIdFromAccessToken(session.access_token);
  if (!sessionId) return;

  const adminClient = createClient(env.url, env.serviceRoleKey, {
    auth: { persistSession: false },
  });
  const nowIso = new Date().toISOString();
  await adminClient.from('user_security').upsert(
    {
      user_id: session.user.id,
      mfa_passed_session_id: sessionId,
      mfa_passed_at: nowIso,
      mfa_failed_attempts: 0,
      updated_at: nowIso,
    },
    { onConflict: 'user_id' },
  );
}

export async function createMagicLinkSession(email: string): Promise<Session> {
  const { url, anonKey, serviceRoleKey } = resolveSupabaseEnv();
  try {
    await assertSupabaseAuthWriteAvailability();
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
  } catch (error) {
    const bootstrapMessage = toBootstrapErrorMessage(error);
    if (bootstrapMessage) {
      throw new E2EAuthBootstrapError(bootstrapMessage);
    }
    throw error;
  }
}

export async function createPasswordSession(
  email: string,
  password: string,
): Promise<Session> {
  const { url, anonKey } = resolveSupabaseEnv();
  try {
    // Fast-path: use session pre-warmed by global-setup if still fresh enough
    try {
      const cached = JSON.parse(
        fs.readFileSync(E2E_SESSION_CACHE_PATH, 'utf8'),
      ) as Session;
      if (
        cached?.access_token &&
        (cached.expires_at ?? 0) * 1000 > Date.now() + 5 * 60 * 1000
      ) {
        return cached;
      }
    } catch {
      // No cache or stale — fall through to live sign-in
    }

    await assertSupabaseAuthWriteAvailability();
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    let data:
      | Awaited<ReturnType<typeof userClient.auth.signInWithPassword>>['data']
      | null = null;
    let error:
      | Awaited<ReturnType<typeof userClient.auth.signInWithPassword>>['error']
      | null = null;

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const response = await withTimeout(
        userClient.auth.signInWithPassword({ email, password }),
        12_000,
      );

      data = response.data;
      error = response.error;

      if (!error && data.session) {
        break;
      }

      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
      }
    }

    if (error || !data?.session) {
      throw new Error(`Failed to create password session: ${error?.message}`);
    }

    return data.session;
  } catch (error) {
    const bootstrapMessage = toBootstrapErrorMessage(error);
    if (bootstrapMessage) {
      throw new E2EAuthBootstrapError(bootstrapMessage);
    }
    throw error;
  }
}

export async function setPlaywrightSession(
  context: {
    addCookies: (cookies: any[]) => Promise<void>;
    clearCookies?: () => Promise<void>;
  },
  session: Session,
  appBaseUrl: string,
) {
  const env = resolveSupabaseEnv();
  const { url } = env;
  // Test users have two_factor_enabled=true (see _createTemporaryTestUserImpl
  // and ensureCachedTestUserProvisioned). Without recording the session as
  // MFA-passed, every /app/* request would bounce to /auth/mfa-challenge.
  try {
    await markE2eSessionMfaPassed(session, env);
  } catch (error) {
    console.warn('[E2E] Failed to mark session MFA-passed:', error);
  }
  const storageKey = getStorageKey(url);
  const serialized = JSON.stringify(session);
  const encoded = `base64-${toBase64Url(serialized)}`;
  const chunks = createCookieChunks(storageKey, encoded);
  const base = new URL(appBaseUrl);
  const cookieUrl = `${base.protocol}//${base.host}`;

  // A Playwright context can be reused across tests in the deep suite. Supabase
  // auth sessions are chunked cookies, so adding a new session on top of an old
  // one can leave stale chunks behind and silently authenticate as the previous
  // E2E workspace. Start clean before installing the intended session.
  await context.clearCookies?.();

  await context.addCookies([
    ...chunks.map((chunk) => ({
      name: chunk.name,
      value: chunk.value,
      url: cookieUrl,
      httpOnly: false,
      secure: base.protocol === 'https:',
      sameSite: 'Lax',
    })),
    {
      name: 'fos_e2e',
      value: '1',
      url: cookieUrl,
      httpOnly: true,
      secure: base.protocol === 'https:',
      sameSite: 'Lax',
    },
    {
      name: 'formaos_cookie_consent',
      value: 'accepted',
      url: cookieUrl,
      httpOnly: false,
      secure: base.protocol === 'https:',
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Create a temporary test user via Supabase Admin API
 */
async function createTemporaryTestUser(): Promise<TestUser> {
  if (createdTestUser) {
    return createdTestUser;
  }

  // Cap the entire user-creation flow to 30s so a slow Supabase never
  // blocks the full test suite for minutes.
  try {
    return await withTimeout(_createTemporaryTestUserImpl(), 30_000);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('E2E_AUTH_SIGN_IN_TIMEOUT')) {
      throw new E2EAuthBootstrapError(
        'E2E auth bootstrap unavailable: Supabase admin API timed out creating test user.',
      );
    }
    throw error;
  }
}

async function _createTemporaryTestUserImpl(): Promise<TestUser> {
  if (createdTestUser) {
    return createdTestUser;
  }

  const { url: supabaseUrl, serviceRoleKey } = resolveSupabaseEnv();

  try {
    await assertSupabaseAuthWriteAvailability();
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let testId = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let email = `${testId}@test.formaos.local`;
    let password = `TestPass${testId}!`;

    // Create user with admin API (auto-confirms email)
    let userData:
      | Awaited<ReturnType<typeof adminClient.auth.admin.createUser>>['data']
      | null = null;
    let userError:
      | Awaited<ReturnType<typeof adminClient.auth.admin.createUser>>['error']
      | null = null;

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      if (attempt > 1) {
        testId = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        email = `${testId}@test.formaos.local`;
        password = `TestPass${testId}!`;
      }

      const response = await withTimeout(
        adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm for testing
          user_metadata: {
            is_e2e_test: true,
            created_at: new Date().toISOString(),
          },
        }),
        15_000,
      );

      userData = response.data;
      userError = response.error;

      if (!userError && userData?.user) {
        break;
      }

      if (attempt < 6) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
      }
    }

    if (userError || !userData.user) {
      const message = userError?.message ?? 'unknown_error';
      if (
        message.toLowerCase().includes('invalid api key') ||
        message.toLowerCase().includes('invalid jwt') ||
        message.toLowerCase().includes('unauthorized')
      ) {
        throw new E2EAuthBootstrapError(
          'E2E auth bootstrap unavailable: set E2E_TEST_EMAIL/E2E_TEST_PASSWORD or a valid SUPABASE_SERVICE_ROLE_KEY.',
        );
      }
      throw new Error(`Failed to create test user: ${message}`);
    }

    // Create test organization
    let orgData: { id: string } | null = null;
    let orgError: { message: string } | null = null;

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const response = await adminClient
        .from('organizations')
        .insert({
          name: `E2E Test Org ${testId}`,
          industry: 'healthcare',
          team_size: '1-10',
          plan_key: 'pro',
          frameworks: ['soc2'],
          onboarding_completed: true, // Skip onboarding for tests
        })
        .select('id')
        .single();

      orgData = response.data;
      orgError = response.error;

      if (!orgError && orgData?.id) {
        break;
      }

      if (attempt < 6) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
      }
    }

    if (orgError || !orgData?.id) {
      // Cleanup user if org creation fails
      await adminClient.auth.admin.deleteUser(userData.user.id);
      throw new Error(
        `Failed to create test org: ${orgError?.message ?? 'unknown_error'}`,
      );
    }

    const nowIso = new Date().toISOString();
    // Mirror to legacy `orgs` table. Previously this was a try/catch
    // console.warn, but Supabase upserts return `{error}` rather than
    // throwing, so the warn never fired and the silent failure leaked
    // organizations-only orphans (v4-001 reverse direction). Propagate.
    const { error: legacyOrgsError } = await adminClient.from('orgs').upsert(
      {
        id: orgData.id,
        name: `E2E Test Org ${testId}`,
        created_by: userData.user.id,
        created_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'id' },
    );
    if (legacyOrgsError) {
      // Best-effort cleanup of the just-created organizations row before
      // surfacing the error, so the failure doesn't itself leak drift.
      await adminClient
        .from('organizations')
        .delete()
        .eq('id', orgData.id);
      await adminClient.auth.admin.deleteUser(userData.user.id);
      throw new Error(
        `Failed to mirror test org to legacy orgs: ${legacyOrgsError.message}`,
      );
    }

    // Add user as org owner
    let memberError: { message: string } | null = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const response = await adminClient.from('org_members').insert({
        user_id: userData.user.id,
        organization_id: orgData.id,
        role: 'owner',
      });

      memberError = response.error;
      if (!memberError) {
        break;
      }

      const message = memberError.message.toLowerCase();
      if (
        message.includes('statement timeout') ||
        message.includes('timeout')
      ) {
        const { data: existingMember } = await adminClient
          .from('org_members')
          .select('id')
          .eq('user_id', userData.user.id)
          .eq('organization_id', orgData.id)
          .maybeSingle();

        if (existingMember) {
          memberError = null;
          break;
        }
      }

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }

    if (memberError) {
      // Cleanup
      await adminClient.from('organizations').delete().eq('id', orgData.id);
      await adminClient.auth.admin.deleteUser(userData.user.id);
      throw new Error(`Failed to add user to org: ${memberError.message}`);
    }

    // Ensure onboarding framework prerequisites are present so auth callback
    // never routes this test user back into onboarding step loops.
    try {
      await adminClient.from('org_frameworks').upsert(
        {
          organization_id: orgData.id,
          framework_slug: 'soc2',
          enabled_at: nowIso,
        },
        { onConflict: 'organization_id,framework_slug' },
      );
    } catch (error) {
      console.warn('[E2E] Failed to seed org_frameworks:', error);
    }

    try {
      await adminClient.from('org_onboarding_status').upsert(
        {
          organization_id: orgData.id,
          current_step: 7,
          completed_steps: [1, 2, 3, 4, 5, 6, 7],
          completed_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'organization_id' },
      );
    } catch (error) {
      console.warn('[E2E] Failed to seed org_onboarding_status:', error);
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
    persistCachedTestUser(createdTestUser);

    return createdTestUser;
  } catch (error) {
    const bootstrapMessage = toBootstrapErrorMessage(error);
    if (bootstrapMessage) {
      throw new E2EAuthBootstrapError(bootstrapMessage);
    }
    throw error;
  }
}

/**
 * Cleanup temporary test user and org
 * Call this in globalTeardown or afterAll
 */
export async function cleanupTestUser(): Promise<void> {
  const forceCleanup = process.env.E2E_FORCE_TEST_USER_CLEANUP === '1';
  const isPlaywrightWorker =
    process.env.TEST_WORKER_INDEX !== undefined ||
    process.env.PLAYWRIGHT_WORKER_INDEX !== undefined;

  if (isPlaywrightWorker && !forceCleanup) {
    if (process.env.E2E_DEBUG === '1') {
      console.log('[E2E Cleanup] deferred until global teardown');
    }
    return;
  }

  if (!createdTestUser) {
    createdTestUser = loadCachedTestUser();
  }

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

      // Mirror delete to legacy `orgs` table — without this, every E2E
      // run leaks one orphan there and the v3-010 regression gate
      // (scripts/check-orgs-sync.mjs) starts failing on the next run.
      await adminClient
        .from('orgs')
        .delete()
        .eq('id', createdTestUser.orgId);
    }

    // Delete user
    await adminClient.auth.admin.deleteUser(createdTestUser.id);

    createdTestUser = null;
    clearCachedTestUser();
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
