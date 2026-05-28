import { test, expect, type Page } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { buildHostedAuthConfirmLink } from '../lib/auth/hosted-auth-link';

const APP_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// ⚠️ CRITICAL: E2E tests MUST use environment variables for Supabase credentials
// Never hardcode Supabase URLs or keys - they will be rotated and tests will fail
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Support both SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SERVICE_ROLE (for backward compatibility)
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

// Skip the entire spec when Supabase env is absent — typically a CI run
// without the test-Supabase secrets scoped. Locally and on Vercel the
// envs ARE present and the spec runs as normal. Throwing at import time
// killed the whole test process before Playwright could mark this spec
// as skipped, which made every PR show a red E2E job even though the
// rest of the test suite would have run fine.
const SUPABASE_ENV_AVAILABLE = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
if (!SUPABASE_ENV_AVAILABLE) {
  test.skip(
    true,
    'Supabase env not configured — auth-invariant spec needs ' +
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Set ' +
      'them as repository secrets to run this spec in CI.',
  );
}

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

const PASSWORD = 'QaE2EAuth123!Secure';
const timestamp = Date.now();

let admin: SupabaseClient;
const createdUserIds: string[] = [];
const createdOrgIds = new Set<string>();

const FRAMEWORK_SELECTIONS = [
  { slug: 'iso27001', label: 'ISO 27001', code: 'ISO27001' },
  { slug: 'hipaa', label: 'HIPAA-style healthcare controls', code: 'HIPAA' },
  { slug: 'gdpr', label: 'GDPR', code: 'GDPR' },
  { slug: 'pci-dss', label: 'PCI DSS', code: 'PCIDSS' },
];

async function waitForAppOrOnboardingUrl(page: Page) {
  await expect
    .poll(
      () => {
        const path = new URL(page.url()).pathname;
        return /\/(app|onboarding)/.test(path);
      },
      { timeout: 60_000, intervals: [500, 1000, 2000] },
    )
    .toBe(true);
}

async function systemStateResponds(page: {
  request: { get: (url: string) => Promise<{ ok: () => boolean }> };
}) {
  try {
    return (await page.request.get('/api/system-state')).ok();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('ECONNRESET') ||
      message.includes('ERR_NETWORK_CHANGED') ||
      message.includes('ERR_CONNECTION_RESET')
    ) {
      return false;
    }
    throw error;
  }
}

async function waitForAppProvisioning(page: Page, userId: string) {
  let readyOrgId: string | null = null;

  await expect
    .poll(
      async () => {
        const response = await page.request.get('/api/system-state');
        if (!response.ok()) {
          return 'not-ready';
        }
        const state = (await response.json()) as {
          user?: { id?: string };
          organization?: { id?: string };
          entitlements?: { enabledModules?: unknown[] };
        };

        if (state.user?.id !== userId) {
          return 'wrong-user';
        }
        if (!state.organization?.id) {
          return 'missing-org';
        }
        if (!state.entitlements?.enabledModules?.length) {
          return 'missing-entitlements';
        }
        readyOrgId = state.organization.id;
        return 'ready';
      },
      { timeout: 60_000, intervals: [1000, 2000, 4000, 8000] },
    )
    .toBe('ready');

  if (readyOrgId) {
    createdOrgIds.add(readyOrgId);
  }
}

async function waitForFrameworkProvisioning(
  orgId: string,
  frameworkSlug: string,
  frameworkCode: string,
) {
  await expect
    .poll(
      async () => {
        const { data: enabled } = await admin
          .from('org_frameworks')
          .select('framework_slug')
          .eq('organization_id', orgId)
          .eq('framework_slug', frameworkSlug);

        const hasOrgFramework = (enabled ?? []).length > 0;

        const { data: evaluations } = await admin
          .from('org_control_evaluations')
          .select('details')
          .eq('organization_id', orgId);

        const matchingEvaluations = (evaluations ?? []).filter((row) => {
          const details = (row as any)?.details ?? {};
          return details.framework_code === frameworkCode;
        });

        const hasEvaluations = matchingEvaluations.length > 0;
        const hasSuggestions = matchingEvaluations.some((row) => {
          const details = (row as any)?.details ?? {};
          const evidenceTypes = Array.isArray(details.evidence_types)
            ? details.evidence_types
            : [];
          const automationTriggers = Array.isArray(details.automation_triggers)
            ? details.automation_triggers
            : [];
          return evidenceTypes.length > 0 || automationTriggers.length > 0;
        });

        return hasOrgFramework && hasEvaluations && hasSuggestions;
      },
      { timeout: 120000, intervals: [1000, 2000, 4000, 8000, 16000] },
    )
    .toBe(true);
}

test.describe('Auth provisioning invariant', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  test.afterAll(async () => {
    for (const orgId of Array.from(createdOrgIds)) {
      await admin.from('org_tasks').delete().eq('organization_id', orgId);
      await admin.from('org_evidence').delete().eq('organization_id', orgId);
      await admin
        .from('org_entitlements')
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
      await admin.from('org_members').delete().eq('organization_id', orgId);
      // public.orgs dropped by migration 20260624051 (R2 Phase B).
      await admin.from('organizations').delete().eq('id', orgId);
    }

    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  test('Email signup lands in /app with trial entitlements', async ({
    page,
  }) => {
    test.setTimeout(240_000);

    const email = `qa.auth.email.${timestamp}@formaos.team`;

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

    await page.goto(`${APP_URL}/auth/signin`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await waitForAppOrOnboardingUrl(page);

    await expect
      .poll(async () => systemStateResponds(page), {
        timeout: 20000,
        intervals: [1000, 2000, 4000],
      })
      .toBe(true);

    const stateResponse = await page.request.get('/api/system-state');
    const state = (await stateResponse.json()) as {
      user?: { id?: string; email?: string };
    };
    expect(state.user?.id).toBe(userId);

    await waitForAppProvisioning(page, userId);
  });

  test('Google OAuth signup lands in /app with trial entitlements', async ({
    page,
  }) => {
    test.setTimeout(240_000);

    const email = `qa.auth.google.${timestamp}@formaos.team`;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    skipOnSupabaseNetworkError(error);
    expect(error).toBeNull();
    expect(data?.user?.id).toBeTruthy();
    const userId = data!.user!.id;
    createdUserIds.push(userId);

    try {
      await admin.auth.admin.updateUserById(userId, {
        app_metadata: { provider: 'google', providers: ['google'] },
      });
    } catch {
      // non-fatal if metadata update fails
    }

    const { data: linkData, error: linkError } = await (
      admin as any
    ).auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${APP_URL}/auth/callback`,
      },
    });

    expect(linkError).toBeNull();
    expect(linkData?.properties?.action_link).toBeTruthy();

    const hostedConfirmLink = buildHostedAuthConfirmLink({
      appBase: APP_URL,
      properties: linkData.properties,
      fallbackType: 'magiclink',
      fallbackRedirectTo: `${APP_URL}/auth/callback`,
    });

    expect(hostedConfirmLink).toBeTruthy();

    await page.goto(hostedConfirmLink!, { waitUntil: 'commit' });
    await waitForAppOrOnboardingUrl(page);

    await expect
      .poll(async () => systemStateResponds(page), {
        timeout: 20000,
        intervals: [1000, 2000, 4000],
      })
      .toBe(true);

    const googleStateResponse = await page.request.get('/api/system-state');
    const googleState = (await googleStateResponse.json()) as {
      user?: { id?: string; email?: string };
    };
    expect(googleState.user?.id).toBe(userId);

    await waitForAppProvisioning(page, userId);
  });

  test('Onboarding framework selection provisions controls', async ({
    page,
  }) => {
    test.setTimeout(300_000);

    for (const framework of FRAMEWORK_SELECTIONS) {
      const email = `qa.framework.${framework.slug}.${timestamp}@formaos.team`;
      const now = new Date().toISOString();

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

      const { data: org, error: orgError } = await admin
        .from('organizations')
        .insert({
          name: `QA ${framework.slug.toUpperCase()} Org`,
          created_by: userId,
          plan_key: 'basic',
          plan_selected_at: now,
          onboarding_completed: false,
          industry: 'technology',
          team_size: '1-10',
          frameworks: [],
        })
        .select('id')
        .single();

      expect(orgError).toBeNull();
      expect(org?.id).toBeTruthy();

      const orgId = org!.id as string;
      createdOrgIds.add(orgId);

      // Legacy `public.orgs` mirror removed: migration 20260624051
      // (R2 Phase B, commit 6126ab21) dropped the table after repointing
      // every dependent FK to organizations(id).

      await admin.from('org_members').insert({
        organization_id: orgId,
        user_id: userId,
        role: 'owner',
      });

      await admin.from('org_onboarding_status').upsert(
        {
          organization_id: orgId,
          current_step: 5,
          completed_steps: [1, 2, 3, 4],
          updated_at: now,
        },
        { onConflict: 'organization_id' },
      );

      await page.context().clearCookies();
      await page.goto(`${APP_URL}/auth/signin`);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', PASSWORD);
      await page.click('button[type="submit"]');
      await waitForAppOrOnboardingUrl(page);

      await page.goto(`${APP_URL}/onboarding?step=5`, {
        waitUntil: 'commit',
      });
      await expect(page.locator('text=/Compliance frameworks/i')).toBeVisible();
      await expect(
        page.getByText(framework.label, { exact: false }),
      ).toBeVisible();

      const checkbox = page.locator(
        `input[name="frameworks"][value="${framework.slug}"]`,
      );
      await checkbox.check();
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/onboarding\?step=6/, {
        timeout: 60_000,
        waitUntil: 'commit',
      });

      await waitForFrameworkProvisioning(orgId, framework.slug, framework.code);
    }
  });
});
