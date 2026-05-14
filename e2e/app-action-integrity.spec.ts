import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'crypto';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
  seedParticipant,
  seedPolicy,
} from './helpers/workspace-seed';

const SIDEBAR_ROUTES = [
  '/app',
  '/app/dashboard',
  '/app/compliance',
  '/app/policies',
  '/app/vault',
  '/app/participants',
  '/app/care-plans',
  '/app/visits',
  '/app/progress-notes',
  '/app/incidents',
  '/app/staff-compliance',
  '/app/team',
  '/app/registers',
  '/app/forms',
  '/app/reports',
  '/app/reports/custom',
  '/app/executive',
  '/app/settings',
  '/app/settings/roles',
  '/app/settings/ai',
  '/app/billing',
  '/app/workflows',
  '/app/audit-trail',
  '/app/capa',
];

function installIntegrityGuards(page: Page) {
  const failures: string[] = [];

  page.on('pageerror', (error) => {
    failures.push(`pageerror: ${error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (
      text.includes('favicon') ||
      text.includes('ResizeObserver loop') ||
      text.includes('Failed to fetch completion counts') ||
      text.includes('[ProductTour] Failed to load state') ||
      text.includes('[Executive Dashboard] Failed to fetch data') ||
      text.includes('Error fetching registers:') ||
      text.includes('Error during WebSocket handshake') ||
      text.includes('Failed to load resource: net::ERR_NETWORK_CHANGED') ||
      text.includes('Failed to load resource: the server responded with a status of 401') ||
      text.includes('Failed to load resource: the server responded with a status of 403') ||
      text.includes('Failed to load resource: the server responded with a status of 429') ||
      text.includes('Failed to load resource: the server responded with a status of 400') ||
      text.includes('Failed to load resource: the server responded with a status of 500')
    ) {
      return;
    }
    failures.push(`console error: ${text}`);
  });

  page.on('response', (response) => {
    const url = response.url();
    const status = response.status();
    if (
      status === 404 &&
      (url.includes('/app') || url.includes('/api/')) &&
      !url.includes('/_next/')
    ) {
      failures.push(`404 response: ${url}`);
    }
  });

  return failures;
}

async function gotoAppRoute(page: Page, route: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable =
        message.includes('ERR_ABORTED') ||
        message.includes('ERR_NETWORK_CHANGED') ||
        message.includes('Timeout') ||
        message.includes('net::ERR_CONNECTION_RESET');
      if (!retryable || attempt === 2) {
        throw error;
      }
      await page.goto('about:blank', { timeout: 5_000 }).catch(() => {});
      await page.waitForTimeout(500 * (attempt + 1));
    }
  }
  throw lastError;
}

function isMissingTableError(error: unknown, table: string) {
  const value = error as { code?: string; message?: string } | null;
  const message = value?.message ?? '';
  return (
    value?.code === 'PGRST205' ||
    message.includes(table) ||
    message.includes('Could not find the') ||
    message.includes('schema cache')
  );
}

async function assertNoIntegrityFailures(failures: string[]) {
  expect(failures, failures.join('\n')).toEqual([]);
}

// Skip the entire suite when Supabase env is absent — typical CI runs
// without test-Supabase secrets. Without this guard, getWorkspaceSeedContext
// throws E2EAuthBootstrapError at the first beforeEach and the gate goes red
// even though there is nothing to test.
const HAS_WORKSPACE_SEED_ENV = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

test.describe('Authenticated app action integrity', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
    test.skip(
      !HAS_WORKSPACE_SEED_ENV,
      'Supabase workspace-seed env not configured — set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY to run this gate.',
    );
  });

  test('sidebar routes load without app 404s', async ({ page }, testInfo) => {
    testInfo.setTimeout(600_000);
    const failures = installIntegrityGuards(page);
    await authenticateWorkspacePage(page);

    for (const route of SIDEBAR_ROUTES) {
      const response = await gotoAppRoute(page, route);
      const body = (await page.locator('body').textContent()) ?? '';

      expect(
        response?.status() ?? 0,
        `${route} returned an unexpected status`,
      ).toBeLessThan(500);
      expect(body).not.toContain('This page could not be found');
      expect(body).not.toContain("FormaOS couldn't load");
    }

    await assertNoIntegrityFailures(failures);
  });

  test('policy versions and edit routes load for org-scoped policies', async ({
    page,
  }) => {
    const failures = installIntegrityGuards(page);
    const context = await getWorkspaceSeedContext();
    const policy = await seedPolicy(context, {
      title: `Integrity Policy ${randomUUID().slice(0, 8)}`,
      content: 'Policy content created for app action integrity testing.',
      status: 'draft',
    });

    await context.admin.from('policy_versions').insert({
      org_id: context.orgId,
      policy_id: policy.id,
      version_number: 1,
      title: policy.title,
      content: policy.content ?? '',
      change_summary: 'Initial E2E version',
      status: 'draft',
      created_by: context.userId,
    });

    await authenticateWorkspacePage(page);

    await page.goto(`/app/policies/${policy.id}/versions`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(
      page.getByRole('heading', { name: policy.title as string }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Version History' }),
    ).toBeVisible();

    await page.goto(`/app/policies/${policy.id}/edit`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.locator('h1').first()).toContainText('Edit Policy');
    await expect(page.locator('input[name="title"]').first()).toHaveValue(
      policy.title,
    );

    await assertNoIntegrityFailures(failures);

    await context.admin
      .from('policy_versions')
      .delete()
      .eq('org_id', context.orgId)
      .eq('policy_id', policy.id);
    await context.admin
      .from('org_policies')
      .delete()
      .eq('organization_id', context.orgId)
      .eq('id', policy.id);
  });

  test('custom role detail route loads as a truthful read-only surface', async ({
    page,
  }) => {
    const failures = installIntegrityGuards(page);
    const context = await getWorkspaceSeedContext();
    const roleName = `Integrity Role ${randomUUID().slice(0, 8)}`;
    const { data: role, error } = await context.admin
      .from('custom_roles')
      .insert({
        org_id: context.orgId,
        name: roleName,
        base_role: 'viewer',
        permissions: {
          reports: { read: true, export: false },
          policies: { read: true, write: false },
        },
      })
      .select('id')
      .single();

    expect(error).toBeFalsy();
    expect(role?.id).toBeTruthy();

    await authenticateWorkspacePage(page);
    await page.goto(`/app/settings/roles/${role!.id}`, {
      waitUntil: 'domcontentloaded',
    });

    // 2026-05-15: switched from `.locator('h1').toContainText()` to
    // role-based locator. The /app shell renders the onboarding-wizard
    // overlay h1 ("Welcome, ...") alongside the page h1 for users
    // whose `onboarding_complete` flag is false — including the
    // service-role-bootstrapped E2E test user. Strict-mode `locator('h1')`
    // errored on "2 elements" before the text check ran. Role-based
    // matching with an explicit name is precise enough to disambiguate.
    await expect(
      page.getByRole('heading', { level: 1, name: roleName }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Permissions' }),
    ).toBeVisible();
    await expect(page.locator('text=Editing not available yet')).toBeVisible();
    await assertNoIntegrityFailures(failures);

    await context.admin
      .from('custom_roles')
      .delete()
      .eq('org_id', context.orgId)
      .eq('id', role!.id);
  });

  test('primary CTAs resolve without placeholder export clutter', async ({ page }) => {
    const failures = installIntegrityGuards(page);
    await authenticateWorkspacePage(page);

    await page.goto('/app/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Reports Center')).toBeVisible();

    const unsupportedExports = page.locator(
      '[data-testid="unsupported-report-export"]',
    );
    await expect(unsupportedExports).toHaveCount(0);

    await page.goto('/app/settings/roles', { waitUntil: 'domcontentloaded' });
    const newRole = page.locator('a[href="/app/settings/roles/new"]').first();
    await expect(newRole).toBeVisible();
    const response = await gotoAppRoute(page, '/app/settings/roles/new');
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(
      page.getByRole('heading', { name: 'Create Custom Role' }),
    ).toBeVisible();

    await assertNoIntegrityFailures(failures);
  });

  test('row detail links discovered by the crawler resolve end to end', async ({
    page,
  }) => {
    const failures = installIntegrityGuards(page);
    const context = await getWorkspaceSeedContext();
    const unique = randomUUID().slice(0, 8);

    const { data: report, error: reportError } = await context.admin
      .from('org_saved_reports')
      .insert({
        org_id: context.orgId,
        name: `Integrity Custom Report ${unique}`,
        description: 'Custom report detail route regression fixture.',
        type: 'custom',
        config: { dataset: 'controls', filters: {}, columns: [] },
        created_by: context.userId,
      })
      .select('id')
      .single();
    const customReportsSchemaMissing = isMissingTableError(
      reportError,
      'org_saved_reports',
    );
    if (!customReportsSchemaMissing) {
      expect(reportError).toBeFalsy();
    }

    const participant = await seedParticipant(context, {
      fullName: `Integrity Care Client ${unique}`,
      externalId: `ACT-${unique}`,
      careStatus: 'active',
      riskLevel: 'low',
    });
    const now = new Date().toISOString();
    const { data: carePlan, error: carePlanError } = await context.admin
      .from('org_care_plans')
      .insert({
        organization_id: context.orgId,
        client_id: participant.id,
        plan_type: 'support',
        title: `Integrity Care Plan ${unique}`,
        description: 'Care plan backlink regression fixture.',
        start_date: now.slice(0, 10),
        status: 'draft',
        goals: [],
        supports: [],
        created_by: context.userId,
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();
    expect(carePlanError).toBeFalsy();

    await authenticateWorkspacePage(page, context.email);

    if (customReportsSchemaMissing) {
      await page.goto('/app/reports/custom', {
        waitUntil: 'domcontentloaded',
      });
      await expect(
        page.getByTestId('custom-reports-schema-disabled').first(),
      ).toBeDisabled();
      await expect(
        page
          .locator('#main-content')
          .getByText('Custom report storage is not enabled')
          .first(),
      ).toBeVisible();
    } else {
      await page.goto(`/app/reports/custom/${report!.id}`, {
        waitUntil: 'domcontentloaded',
      });
      // Role-based locator: see note at the roles-page assertion above.
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: `Integrity Custom Report ${unique}`,
        }),
      ).toBeVisible();
      await expect(
        page.getByTestId('custom-report-generation-disabled'),
      ).toBeDisabled();
      await expect(
        page.locator('text=In-app generation and scheduling are not enabled'),
      ).toBeVisible();
    }

    await page.goto(`/app/care-plans/${carePlan!.id}`, {
      waitUntil: 'domcontentloaded',
    });
    await page
      .getByTestId('care-plan-progress-notes')
      .getByRole('link', { name: 'View all' })
      .click();
    await page.waitForURL('**/app/progress-notes');
    // Role-based locator: see note at the roles-page assertion above.
    await expect(
      page.getByRole('heading', { level: 1, name: 'Progress Notes' }),
    ).toBeVisible();

    await assertNoIntegrityFailures(failures);

    await context.admin
      .from('org_care_plans')
      .delete()
      .eq('organization_id', context.orgId)
      .eq('id', carePlan!.id);
    await context.admin
      .from('org_patients')
      .delete()
      .eq('organization_id', context.orgId)
      .eq('id', participant.id);
    if (!customReportsSchemaMissing) {
      await context.admin
        .from('org_saved_reports')
        .delete()
        .eq('org_id', context.orgId)
        .eq('id', report!.id);
    }
  });

  test('CAPA create form persists and opens the detail workflow', async ({
    page,
  }) => {
    test.setTimeout(240_000);

    const failures = installIntegrityGuards(page);
    const context = await getWorkspaceSeedContext();
    const title = `Integrity CAPA ${randomUUID().slice(0, 8)}`;
    const { error: schemaError } = await context.admin
      .from('org_capa_items')
      .select(
        'id, severity, owner_id, source_type, source_id, root_cause, corrective_action, preventive_action, verification_notes',
      )
      .eq('organization_id', context.orgId)
      .limit(1);
    const capaSchemaMissing = isMissingTableError(
      schemaError,
      'org_capa_items',
    );

    await authenticateWorkspacePage(page, context.email);
    if (capaSchemaMissing) {
      await page.goto('/app/capa', { waitUntil: 'commit' });
      await expect(page.getByTestId('capa-schema-disabled')).toBeDisabled();
      await expect(page.locator('text=CAPA storage is not enabled')).toBeVisible();
      await page.goto('/app/capa/new', { waitUntil: 'commit' });
      await expect(page.getByTestId('capa-create-disabled')).toBeVisible();
      await assertNoIntegrityFailures(failures);
      return;
    }

    await page.goto('/app/capa/new', { waitUntil: 'commit' });
    const createCapaForm = page.locator('main');
    await createCapaForm.locator('input[name="title"]:visible').fill(title);
    await createCapaForm
      .locator('select[name="type"]:visible')
      .selectOption('preventive');
    await createCapaForm
      .locator('select[name="severity"]:visible')
      .selectOption('high');
    await page.getByRole('button', { name: 'Create CAPA' }).click();
    await page.waitForURL(
      (url) => /^\/app\/capa\/[0-9a-f-]{36}$/i.test(url.pathname),
      { waitUntil: 'commit' },
    );

    const { data: capa } = await context.admin
      .from('org_capa_items')
      .select('id, type, severity, status')
      .eq('organization_id', context.orgId)
      .eq('title', title)
      .maybeSingle();
    expect(capa?.id).toBeTruthy();
    expect(capa?.type).toBe('preventive');
    expect(capa?.severity).toBe('high');
    expect(capa?.status).toBe('open');

    await expect(page.getByText(title).first()).toBeVisible({ timeout: 30_000 });
    await page
      .locator('main select[name="status"]:visible')
      .selectOption('investigating');
    await page.getByRole('button', { name: 'Move status' }).click();
    await page.waitForURL(`**/app/capa/${capa!.id}`, { waitUntil: 'commit' });

    await expect
      .poll(async () => {
        const { data } = await context.admin
          .from('org_capa_items')
          .select('status')
          .eq('organization_id', context.orgId)
          .eq('id', capa!.id)
          .maybeSingle();
        return data?.status;
      })
      .toBe('investigating');

    await assertNoIntegrityFailures(failures);

    await context.admin
      .from('org_capa_items')
      .delete()
      .eq('organization_id', context.orgId)
      .eq('id', capa!.id);
  });
});
