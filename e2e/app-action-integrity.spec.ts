import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'crypto';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
  seedPolicy,
} from './helpers/workspace-seed';

const SIDEBAR_ROUTES = [
  '/app',
  '/app/compliance',
  '/app/policies',
  '/app/vault',
  '/app/participants',
  '/app/visits',
  '/app/progress-notes',
  '/app/incidents',
  '/app/staff-compliance',
  '/app/team',
  '/app/registers',
  '/app/forms',
  '/app/reports',
  '/app/executive',
  '/app/settings',
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
      const response = await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
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
    await expect(page.locator('h1')).toContainText('Edit Policy');
    await expect(page.locator('input[name="title"]')).toHaveValue(policy.title);

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

  test('primary CTAs resolve or are truthfully unavailable', async ({ page }) => {
    const failures = installIntegrityGuards(page);
    await authenticateWorkspacePage(page);

    await page.goto('/app/reports', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=Reports Center')).toBeVisible();

    const unsupportedExports = page.locator(
      '[data-testid="unsupported-report-export"]',
    );
    const unsupportedCount = await unsupportedExports.count();
    for (let i = 0; i < unsupportedCount; i += 1) {
      const item = unsupportedExports.nth(i);
      await expect(item).toContainText('Export coming soon');
      await expect(item).toBeDisabled();
    }

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
});
