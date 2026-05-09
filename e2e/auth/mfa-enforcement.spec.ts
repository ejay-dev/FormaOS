/**
 * MFA Enforcement at Login (Blocker 1)
 *
 * Verifies that a 2FA-enabled user CANNOT reach `/app` with a
 * password-only sign-in. The session is held at `/auth/mfa-challenge`
 * until a valid TOTP code is submitted.
 *
 * Before the fix, password sign-in went straight to `bootstrapAndRedirect`
 * and landed on `/app/*` regardless of TOTP enrollment.
 */

import { test, expect } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as speakeasy from 'speakeasy';

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  test.skip(
    true,
    'Supabase env not configured — MFA enforcement spec needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
}

const PASSWORD = 'MfaE2E!Secure-Password-1';

let admin: SupabaseClient;
const createdUserIds: string[] = [];
const createdOrgIds: string[] = [];

test.describe.configure({ mode: 'serial' });

test.beforeAll(() => {
  admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
});

test.afterAll(async () => {
  // Best-effort cleanup. Test should not fail if cleanup partially fails.
  for (const orgId of createdOrgIds) {
    try {
      await admin.from('org_subscriptions').delete().eq('organization_id', orgId);
      await admin.from('org_members').delete().eq('organization_id', orgId);
      await admin.from('organizations').delete().eq('id', orgId);
    } catch {
      // ignore
    }
  }
  for (const userId of createdUserIds) {
    try {
      await admin.from('user_security').delete().eq('user_id', userId);
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // ignore
    }
  }
});

async function provisionMfaUser() {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `mfa-${id}@test.formaos.local`;

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { is_e2e_test: true, mfa_test: true },
    });
  if (createError || !created?.user) {
    throw new Error(`Failed to create MFA test user: ${createError?.message}`);
  }
  createdUserIds.push(created.user.id);

  // Provision an org so /app/* doesn't redirect to onboarding
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({
      name: `MFA Test Org ${id}`,
      industry: 'healthcare',
      team_size: '1-10',
      plan_key: 'pro',
      onboarding_completed: true,
    })
    .select('id')
    .single();
  if (orgError || !org?.id) {
    throw new Error(`Failed to create org: ${orgError?.message}`);
  }
  createdOrgIds.push(org.id);

  await admin.from('org_members').insert({
    user_id: created.user.id,
    organization_id: org.id,
    role: 'owner',
  });

  await admin.from('org_subscriptions').insert({
    organization_id: org.id,
    org_id: org.id,
    plan_key: 'pro',
    plan_code: 'pro',
    status: 'active',
    updated_at: new Date().toISOString(),
  });

  // Enable MFA for the user with a fresh, plaintext TOTP secret. The
  // app's lib/security.ts accepts plaintext secrets as a backwards-
  // compat affordance; we use that here so the test can compute valid
  // codes without sharing the encryption key.
  const totpSecret = speakeasy.generateSecret({
    name: `FormaOS (${email})`,
    issuer: 'FormaOS',
    length: 32,
  });

  await admin.from('user_security').upsert(
    {
      user_id: created.user.id,
      two_factor_enabled: true,
      two_factor_enabled_at: new Date().toISOString(),
      two_factor_secret: totpSecret.base32,
      backup_codes: [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  return { userId: created.user.id, email, totpBase32: totpSecret.base32 };
}

function totp(secretBase32: string): string {
  return speakeasy.totp({ secret: secretBase32, encoding: 'base32' });
}

test('password-only sign-in for an MFA-enabled user lands on the challenge, not /app', async ({
  page,
  context,
}) => {
  const user = await provisionMfaUser();

  // Ensure no session leaks from a previous test
  await context.clearCookies();

  await page.goto(`${APP_URL}/auth/signin`);

  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|continue|log in/i }).click();

  // The gate must redirect to the challenge page within a reasonable window.
  await expect
    .poll(() => new URL(page.url()).pathname, {
      timeout: 30_000,
      intervals: [500, 1000, 2000, 4000],
    })
    .toBe('/auth/mfa-challenge');

  await expect(
    page.getByRole('heading', { name: /two-step verification/i }),
  ).toBeVisible();
});

test('a wrong TOTP keeps the user on the challenge', async ({
  page,
  context,
}) => {
  const user = await provisionMfaUser();

  await context.clearCookies();

  await page.goto(`${APP_URL}/auth/signin`);
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|continue|log in/i }).click();

  await expect
    .poll(() => new URL(page.url()).pathname, {
      timeout: 30_000,
      intervals: [500, 1000, 2000],
    })
    .toBe('/auth/mfa-challenge');

  // Submit a wrong code — the verifier rejects "000000" against any random secret.
  await page.getByLabel(/verification code/i).fill('000000');
  await page.getByRole('button', { name: /verify and continue/i }).click();

  // Expect to remain on the challenge with an error message.
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
  expect(new URL(page.url()).pathname).toBe('/auth/mfa-challenge');
});

test('a correct TOTP clears the gate and lands on /app', async ({
  page,
  context,
}) => {
  const user = await provisionMfaUser();

  await context.clearCookies();

  await page.goto(`${APP_URL}/auth/signin`);
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole('button', { name: /sign in|continue|log in/i }).click();

  await expect
    .poll(() => new URL(page.url()).pathname, {
      timeout: 30_000,
      intervals: [500, 1000, 2000],
    })
    .toBe('/auth/mfa-challenge');

  const code = totp(user.totpBase32);
  await page.getByLabel(/verification code/i).fill(code);
  await page.getByRole('button', { name: /verify and continue/i }).click();

  await expect
    .poll(() => new URL(page.url()).pathname, {
      timeout: 30_000,
      intervals: [500, 1000, 2000, 4000],
    })
    .toMatch(/^\/app(\/|$)/);
});
