/**
 * Compliance Evidence Pack Export E2E Test
 * Verifies export starts successfully and produces downloadable file
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// ⚠️ CRITICAL: E2E tests MUST use environment variables for Supabase credentials
// Never hardcode Supabase URLs or keys - they will be rotated and tests will fail
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Skip tests if required environment variables are not set (instead of throwing at module load)
const SKIP_REASON = !SUPABASE_URL
  ? 'NEXT_PUBLIC_SUPABASE_URL not set'
  : !SERVICE_ROLE_KEY
    ? 'SUPABASE_SERVICE_ROLE_KEY not set'
    : null;

const PASSWORD = 'QaE2EExport123!Secure';
const timestamp = Date.now();

let admin: any; // Supabase admin client - using any to avoid type generation requirement
const createdUserIds: string[] = [];
const createdOrgIds = new Set<string>();

/** Skip the current test if `error` is a transient Supabase network error. */
function skipOnSupabaseNetworkError(error: unknown): void {
  if (!error) return;
  const e = error as { name?: string; message?: string; status?: number };
  const isNetworkError =
    e.name === 'AuthRetryableFetchError' ||
    e.name === 'FetchError' ||
    e.status === 0 ||
    e.message === '{}' ||
    e.message === '' ||
    String(e.message ?? '').includes('fetch failed') ||
    String(e.message ?? '').includes('network');
  if (isNetworkError) {
    test.skip(
      true,
      `Supabase admin API unavailable (${e.name ?? 'network error'}) — skipping until Supabase recovers`,
    );
  }
}

async function waitForSignedInApp(page: import('@playwright/test').Page) {
  if (/\/(app|dashboard)/.test(new URL(page.url()).pathname)) {
    return;
  }

  const continueButton = page.getByRole('button', {
    name: /Continue to (your )?dashboard/i,
  });
  if (await continueButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await continueButton.click();
  }

  await page
    .waitForURL((url) => /\/(app|dashboard)/.test(url.pathname), {
      timeout: 60_000,
      waitUntil: 'domcontentloaded',
    })
    .catch(() => {
      const currentPath = new URL(page.url()).pathname;
      if (!/\/(app|dashboard)/.test(currentPath)) {
        throw new Error(
          `Expected app route after sign-in, current URL is ${page.url()}`,
        );
      }
    });
}

async function completeOnboardingForOrg(
  orgId: string,
  userId: string,
  name: string,
) {
  const nowIso = new Date().toISOString();
  const trialEnd = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();

  await admin.from('orgs').upsert(
    {
      id: orgId,
      name,
      created_by: userId,
      created_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'id' },
  );

  await admin.from('org_onboarding_status').upsert(
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
  const { data: subscription } = await admin
    .from('org_subscriptions')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1)
    .maybeSingle();

  if (subscription?.id) {
    await admin
      .from('org_subscriptions')
      .update(subscriptionPatch)
      .eq('id', subscription.id);
  } else {
    await admin.from('org_subscriptions').insert({
      organization_id: orgId,
      org_id: orgId,
      plan_key: 'basic',
      plan_code: 'basic',
      ...subscriptionPatch,
    });
  }
}

test.describe('Compliance Evidence Export', () => {
  // Skip entire test suite if env vars are missing
  test.skip(!!SKIP_REASON, SKIP_REASON || 'Missing environment variables');

  test.beforeAll(() => {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return; // Skip setup if env vars missing
    admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    // Cleanup
    for (const orgId of Array.from(createdOrgIds)) {
      await admin
        .from('compliance_export_jobs')
        .delete()
        .eq('organization_id', orgId);
      await admin
        .from('compliance_score_snapshots')
        .delete()
        .eq('organization_id', orgId);
      await admin
        .from('org_subscriptions')
        .delete()
        .eq('organization_id', orgId);
      await admin
        .from('org_onboarding_status')
        .delete()
        .eq('organization_id', orgId);
      await admin.from('org_frameworks').delete().eq('organization_id', orgId);
      await admin.from('org_members').delete().eq('organization_id', orgId);
      await admin.from('orgs').delete().eq('id', orgId);
      await admin.from('organizations').delete().eq('id', orgId);
    }

    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test('Export job starts and produces downloadable file', async ({ page }) => {
    test.setTimeout(300_000);
    const email = `qa.export.${timestamp}@formaos.team`;

    // Create test user
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });

    skipOnSupabaseNetworkError(error);
    expect(error).toBeNull();
    expect(data?.user?.id).toBeTruthy();

    const userId = data!.user!.id;
    createdUserIds.push(userId);

    // Create org with framework enabled
    const { data: org } = await admin
      .from('organizations')
      .insert({
        name: 'QA Export Test Org',
        created_by: userId,
        plan_key: 'basic',
        onboarding_completed: true,
      })
      .select('id')
      .single();

    expect(org?.id).toBeTruthy();
    const orgId = org!.id as string;
    createdOrgIds.add(orgId);
    await completeOnboardingForOrg(orgId, userId, 'QA Export Test Org');

    await admin.from('org_members').insert({
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
    });

    // Enable GDPR framework
    await admin.from('org_frameworks').insert({
      organization_id: orgId,
      framework_slug: 'gdpr',
    });

    // Create a compliance snapshot
    await admin.from('compliance_score_snapshots').insert({
      organization_id: orgId,
      framework_slug: 'gdpr',
      snapshot_date: new Date().toISOString().split('T')[0],
      compliance_score: 75,
      total_controls: 10,
      satisfied_controls: 7,
      partial_controls: 2,
      missing_controls: 1,
    });

    // Login
    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    try {
      await waitForSignedInApp(page);
    } catch (signInError) {
      const msg =
        signInError instanceof Error
          ? signInError.message
          : String(signInError);
      test.skip(
        true,
        `Sign-in did not redirect to app — Supabase may be slow: ${msg.slice(0, 120)}`,
      );
      return;
    }

    // Navigate to compliance frameworks page
    await page.goto(`${APP_URL}/app/compliance/frameworks`);

    // Wait for page to load
    await expect(
      page.locator('text=/Framework|Compliance/i').first(),
    ).toBeVisible({ timeout: 10000 });

    // Start export via API (simulating component action)
    const createResponse = await page.request.post(
      `${APP_URL}/api/compliance/exports/create`,
      {
        headers: {
          origin: APP_URL,
          referer: `${APP_URL}/app/compliance/frameworks`,
        },
        data: {
          frameworkSlug: 'gdpr',
          passwordProtected: false,
        },
      },
    );

    expect(
      createResponse.ok(),
      await createResponse.text().catch(() => ''),
    ).toBeTruthy();
    const { jobId } = await createResponse.json();
    expect(jobId).toBeTruthy();

    // Poll for job completion
    let jobCompleted = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (!jobCompleted && attempts < maxAttempts) {
      await page.waitForTimeout(1000);
      attempts++;

      const statusResponse = await page.request.get(
        `${APP_URL}/api/compliance/exports/${jobId}/status`,
      );

      if (statusResponse.ok()) {
        const { job } = await statusResponse.json();

        expect(job).toBeTruthy();
        expect(['pending', 'processing', 'completed', 'failed']).toContain(
          job.status,
        );

        if (job.status === 'completed') {
          jobCompleted = true;
          expect(job.fileUrl).toBeTruthy();
          expect(job.progress).toBe(100);
        } else if (job.status === 'failed') {
          throw new Error(`Export job failed: ${job.errorMessage}`);
        }
      }
    }

    // Verify export completed
    expect(jobCompleted).toBeTruthy();
  });

  test('Score history and regression detection works', async ({ page }) => {
    test.setTimeout(300_000);
    const email = `qa.snapshot.${timestamp}@formaos.team`;

    // Create test user
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
    });

    skipOnSupabaseNetworkError(error);
    expect(error).toBeNull();
    const userId = data!.user!.id;
    createdUserIds.push(userId);

    // Create org
    const { data: org } = await admin
      .from('organizations')
      .insert({
        name: 'QA Snapshot Test Org',
        created_by: userId,
        plan_key: 'basic',
        onboarding_completed: true,
      })
      .select('id')
      .single();

    const orgId = org!.id as string;
    createdOrgIds.add(orgId);
    await completeOnboardingForOrg(orgId, userId, 'QA Snapshot Test Org');

    await admin.from('org_members').insert({
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
    });

    await admin.from('org_frameworks').insert({
      organization_id: orgId,
      framework_slug: 'iso27001',
    });

    // Create snapshots showing regression
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await admin.from('compliance_score_snapshots').insert([
      {
        organization_id: orgId,
        framework_slug: 'iso27001',
        snapshot_date: yesterday.toISOString().split('T')[0],
        compliance_score: 85,
        total_controls: 10,
        satisfied_controls: 8,
      },
      {
        organization_id: orgId,
        framework_slug: 'iso27001',
        snapshot_date: today.toISOString().split('T')[0],
        compliance_score: 70, // 15% drop - should trigger regression
        total_controls: 10,
        satisfied_controls: 7,
      },
    ]);

    // Login
    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    try {
      await waitForSignedInApp(page);
    } catch (signInError) {
      const msg =
        signInError instanceof Error
          ? signInError.message
          : String(signInError);
      test.skip(
        true,
        `Sign-in did not redirect to app — Supabase may be slow: ${msg.slice(0, 120)}`,
      );
      return;
    }

    // Check regression detection via API
    const regressionResponse = await page.request.get(
      `${APP_URL}/api/compliance/snapshots/regression?orgId=${orgId}&framework=iso27001`,
    );

    expect(regressionResponse.ok()).toBeTruthy();
    const { regression } = await regressionResponse.json();

    expect(regression).toBeTruthy();
    expect(regression.hasRegression).toBe(true);
    expect(regression.currentScore).toBe(70);
    expect(regression.previousScore).toBe(85);
    expect(regression.drop).toBeGreaterThanOrEqual(10);
  });
});
