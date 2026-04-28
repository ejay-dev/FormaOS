import { expect, test, type Download, type Page } from '@playwright/test';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
  seedEvidence,
  seedIncident,
  seedStaffCredential,
} from './helpers/workspace-seed';

async function enableReportExports(context: Awaited<ReturnType<typeof getWorkspaceSeedContext>>) {
  const now = new Date().toISOString();

  const { data: subscription } = await context.admin
    .from('org_subscriptions')
    .select('id')
    .eq('organization_id', context.orgId)
    .maybeSingle();

  if (subscription?.id) {
    await context.admin
      .from('org_subscriptions')
      .update({ plan_key: 'pro', status: 'active', updated_at: now })
      .eq('id', subscription.id);
  } else {
    await context.admin.from('org_subscriptions').insert({
      organization_id: context.orgId,
      plan_key: 'pro',
      status: 'active',
      created_at: now,
      updated_at: now,
    });
  }

  for (const featureKey of ['audit_export', 'framework_evaluations']) {
    const { data: existing } = await context.admin
      .from('org_entitlements')
      .select('id')
      .eq('organization_id', context.orgId)
      .eq('feature_key', featureKey)
      .maybeSingle();

    if (existing?.id) {
      await context.admin
        .from('org_entitlements')
        .update({ enabled: true, updated_at: now })
        .eq('id', existing.id);
    } else {
      await context.admin.from('org_entitlements').insert({
        organization_id: context.orgId,
        feature_key: featureKey,
        enabled: true,
        created_at: now,
        updated_at: now,
      });
    }
  }
}

async function assertNonEmptyDownload(download: Download) {
  const path = await download.path();
  expect(path).toBeTruthy();
  const stat = await fs.stat(path!);
  expect(stat.size).toBeGreaterThan(20);
  expect(download.suggestedFilename()).toMatch(/\.(csv|pdf|json|html|md|ndjson)$/);
}

function installDownloadGuards(page: Page) {
  const failures: string[] = [];
  page.on('response', (response) => {
    const url = response.url();
    if (
      response.status() === 404 &&
      (url.includes('/api/') || url.includes('/app/'))
    ) {
      failures.push(`404 response: ${url}`);
    }
  });
  page.on('pageerror', (error) => failures.push(error.message));
  return failures;
}

test.describe('Export and download integrity', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
  });

  test('report export links download files without placeholder template exports', async ({
    page,
  }) => {
    const failures = installDownloadGuards(page);
    const context = await getWorkspaceSeedContext();
    await enableReportExports(context);
    await authenticateWorkspacePage(page);

    await page.goto('/app/reports', { waitUntil: 'domcontentloaded' });

    const unsupportedExports = page.locator(
      '[data-testid="unsupported-report-export"]',
    );
    await expect(unsupportedExports).toHaveCount(0);

    const exportLinks = page.locator('[data-testid="report-export-link"]');
    await expect(exportLinks.first()).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportLinks.first().click(),
    ]);
    await assertNonEmptyDownload(download);

    expect(failures, failures.join('\n')).toEqual([]);
  });

  test('verified vault evidence exposes a working download action', async ({
    page,
  }) => {
    const failures = installDownloadGuards(page);
    const context = await getWorkspaceSeedContext();
    const fileName = `vault-download-${randomUUID().slice(0, 8)}.txt`;
    const evidence = await seedEvidence(context, {
      fileName,
      uploadedBy: context.userId,
      verificationStatus: 'verified',
      content: 'verified evidence download integrity fixture',
    });

    await authenticateWorkspacePage(page);
    await page.goto('/app/vault', { waitUntil: 'domcontentloaded' });

    const row = page.locator('tr', { hasText: fileName }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.locator('[data-testid="evidence-download-button"]')).toBeEnabled();

    const downloadPromise = page
      .waitForEvent('download', { timeout: 15_000 })
      .then((download) => ({ kind: 'download' as const, download }))
      .catch(() => null);
    const popupPromise = page
      .waitForEvent('popup', { timeout: 15_000 })
      .then(async (popup) => {
        await popup.waitForLoadState('domcontentloaded').catch(() => {});
        return { kind: 'popup' as const, url: popup.url() };
      })
      .catch(() => null);

    await row.locator('[data-testid="evidence-download-button"]').click();
    const outcome = await Promise.race([downloadPromise, popupPromise]);
    expect(outcome).toBeTruthy();

    if (outcome?.kind === 'download') {
      await assertNonEmptyDownload(outcome.download);
    } else if (outcome?.kind === 'popup') {
      const response = await page.request.get(outcome.url);
      expect(response.ok()).toBe(true);
      const body = await response.text();
      expect(body).toContain('verified evidence download integrity fixture');
    }

    expect(failures, failures.join('\n')).toEqual([]);

    if (evidence.file_path) {
      await context.admin.storage.from('evidence').remove([evidence.file_path]);
    }
    await context.admin
      .from('org_evidence')
      .delete()
      .eq('organization_id', context.orgId)
      .eq('id', evidence.id);
  });

  test('form submissions export downloads a CSV with headers and submitted data', async ({
    page,
  }) => {
    const failures = installDownloadGuards(page);
    const context = await getWorkspaceSeedContext();
    const unique = randomUUID().slice(0, 8);
    const formTitle = `Integrity Intake ${unique}`;

    const { data: form, error: formError } = await context.admin
      .from('org_forms')
      .insert({
        org_id: context.orgId,
        title: formTitle,
        description: 'E2E export integrity form',
        slug: `integrity-intake-${unique}`,
        status: 'published',
        fields: [
          {
            id: 'resident_name',
            type: 'text',
            label: 'Resident Name',
            order: 0,
          },
          {
            id: 'risk_level',
            type: 'select',
            label: 'Risk Level',
            order: 1,
          },
        ],
        settings: {},
        created_by: context.userId,
      })
      .select('id')
      .single();
    expect(formError).toBeFalsy();

    const { error: submissionError } = await context.admin
      .from('org_form_submissions')
      .insert({
        form_id: form!.id,
        org_id: context.orgId,
        respondent_name: 'Ada Integrity',
        respondent_email: 'ada.integrity@example.com',
        data: {
          resident_name: 'Ada Integrity',
          risk_level: 'medium',
        },
        metadata: {},
        status: 'submitted',
      });
    expect(submissionError).toBeFalsy();

    await authenticateWorkspacePage(page);
    await page.goto(`/app/forms/${form!.id}/submissions`, {
      waitUntil: 'domcontentloaded',
    });

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: /export csv/i }).click(),
    ]);
    await assertNonEmptyDownload(download);

    const path = await download.path();
    const csv = await fs.readFile(path!, 'utf8');
    expect(csv).toContain('submission_id,submitted_at,status');
    expect(csv).toContain('Resident Name');
    expect(csv).toContain('Ada Integrity');
    expect(csv).toContain('medium');

    await expect(
      page.locator('text=Analytics coming soon'),
    ).toBeVisible();
    expect(failures, failures.join('\n')).toEqual([]);

    await context.admin
      .from('org_form_submissions')
      .delete()
      .eq('org_id', context.orgId)
      .eq('form_id', form!.id);
    await context.admin
      .from('org_forms')
      .delete()
      .eq('org_id', context.orgId)
      .eq('id', form!.id);
  });

  test('incident and staff credential exports return non-empty files', async ({
    page,
  }) => {
    const failures = installDownloadGuards(page);
    const context = await getWorkspaceSeedContext();
    const unique = randomUUID().slice(0, 8);

    const incident = await seedIncident(context, {
      description: `Export integrity incident ${unique}`,
      severity: 'low',
      status: 'open',
    });
    const credential = await seedStaffCredential(context, {
      credentialName: `Export Integrity Credential ${unique}`,
      status: 'verified',
    });

    await authenticateWorkspacePage(page, context.email);

    for (const endpoint of [
      '/api/incidents/export',
      '/api/staff-credentials/export',
    ]) {
      const response = await page.request.get(endpoint);
      expect(response.status(), `${endpoint} status`).toBe(200);
      const body = await response.text();
      expect(body.length, `${endpoint} should not be empty`).toBeGreaterThan(20);
      expect(
        response.headers()['content-disposition'] ?? '',
        `${endpoint} should be a download`,
      ).toMatch(/attachment/);
    }

    expect(failures, failures.join('\n')).toEqual([]);

    await context.admin
      .from('org_incidents')
      .delete()
      .eq('organization_id', context.orgId)
      .eq('id', incident.id);
    await context.admin
      .from('org_staff_credentials')
      .delete()
      .eq('organization_id', context.orgId)
      .eq('id', credential.id);
  });
});
