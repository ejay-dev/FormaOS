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
      text.includes('Failed to load resource: the server responded with a status of 401') ||
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
      if (!message.includes('ERR_ABORTED') || attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(500 * (attempt + 1));
    }
  }
  throw lastError;
}

function isMissingTableError(error: unknown, table: string) {
  const value = error as { code?: string; message?: string } | null;
  return (
    value?.code === 'PGRST205' &&
    typeof value.message === 'string' &&
    value.message.includes(table)
  );
}

async function assertNoIntegrityFailures(failures: string[]) {
  expect(failures, failures.join('\n')).toEqual([]);
}

test.describe('Authenticated app action integrity', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
  });

  test('sidebar routes load without app 404s', async ({ page }) => {
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

    await expect(page.locator('h1')).toContainText(roleName);
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
    const response = await page.goto('/app/settings/roles/new', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator('h1')).toContainText('Create Custom Role');

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
        page.getByTestId('custom-reports-schema-disabled'),
      ).toBeDisabled();
      await expect(
        page.locator('text=Custom report storage is not enabled'),
      ).toBeVisible();
    } else {
      await page.goto(`/app/reports/custom/${report!.id}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator('h1')).toContainText(
        `Integrity Custom Report ${unique}`,
      );
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
    await expect(page.locator('h1')).toContainText('Progress Notes');

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
    const failures = installIntegrityGuards(page);
    const context = await getWorkspaceSeedContext();
    const title = `Integrity CAPA ${randomUUID().slice(0, 8)}`;
    const { error: schemaError } = await context.admin
      .from('org_capa_items')
      .select('id')
      .eq('organization_id', context.orgId)
      .limit(1);
    const capaSchemaMissing = isMissingTableError(
      schemaError,
      'org_capa_items',
    );

    await authenticateWorkspacePage(page, context.email);
    if (capaSchemaMissing) {
      await page.goto('/app/capa', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('capa-schema-disabled')).toBeDisabled();
      await expect(page.locator('text=CAPA storage is not enabled')).toBeVisible();
      await page.goto('/app/capa/new', { waitUntil: 'domcontentloaded' });
      await expect(page.getByTestId('capa-create-disabled')).toBeVisible();
      await assertNoIntegrityFailures(failures);
      return;
    }

    await page.goto('/app/capa/new', { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="title"]').fill(title);
    await page.locator('select[name="type"]').selectOption('preventive');
    await page.locator('select[name="priority"]').selectOption('high');
    await page.getByRole('button', { name: 'Create CAPA' }).click();
    await page.waitForURL('**/app/capa');
    await expect(page.getByRole('link', { name: title })).toBeVisible();

    const { data: capa } = await context.admin
      .from('org_capa_items')
      .select('id, type, priority, status')
      .eq('organization_id', context.orgId)
      .eq('title', title)
      .maybeSingle();
    expect(capa?.id).toBeTruthy();
    expect(capa?.type).toBe('preventive');
    expect(capa?.priority).toBe('high');
    expect(capa?.status).toBe('open');

    await page.getByRole('link', { name: title }).click();
    await page.waitForURL(`**/app/capa/${capa!.id}`);
    await expect(page.locator('h1')).toContainText(title);
    await page.locator('select[name="status"]').selectOption('in_progress');
    await page.getByRole('button', { name: 'Update status' }).click();
    await page.waitForURL(`**/app/capa/${capa!.id}`);

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
      .toBe('in_progress');

    await assertNoIntegrityFailures(failures);

    await context.admin
      .from('org_capa_items')
      .delete()
      .eq('organization_id', context.orgId)
      .eq('id', capa!.id);
  });
});
