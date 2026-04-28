import { expect, test } from '@playwright/test';
import { randomUUID } from 'crypto';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
  seedIncident,
} from './helpers/workspace-seed';

function isSchemaMissing(error: unknown, table: string) {
  const value = error as { code?: string; message?: string } | null;
  const message = value?.message ?? '';
  return (
    value?.code === 'PGRST205' ||
    message.includes(table) ||
    message.includes('Could not find the') ||
    message.includes('schema cache')
  );
}

async function expectCapaStatus(
  context: Awaited<ReturnType<typeof getWorkspaceSeedContext>>,
  capaId: string,
  status: string,
) {
  await expect
    .poll(async () => {
      const { data } = await context.admin
        .from('org_capa_items')
        .select('status')
        .eq('organization_id', context.orgId)
        .eq('id', capaId)
        .maybeSingle();
      return (data as { status?: string } | null)?.status;
    })
    .toBe(status);
}

test.describe('CAPA lifecycle workflow', () => {
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
  });

  test('creates, progresses, verifies, closes, attaches evidence, and persists', async ({
    page,
  }) => {
    const context = await getWorkspaceSeedContext();
    const { error: schemaError } = await context.admin
      .from('org_capa_items')
      .select(
        'id, severity, owner_id, source_type, source_id, root_cause, corrective_action, preventive_action, verification_notes',
      )
      .eq('organization_id', context.orgId)
      .limit(1);

    test.skip(
      Boolean(schemaError && isSchemaMissing(schemaError, 'org_capa_items')),
      'CAPA lifecycle schema is not applied in this environment',
    );

    const unique = randomUUID().slice(0, 8);
    const title = `CAPA flow ${unique}`;
    const incident = await seedIncident(context, {
      severity: 'high',
      description: `Incident requiring CAPA ${unique}`,
      followUpRequired: true,
    });
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    let capaId: string | null = null;

    try {
      await authenticateWorkspacePage(page, context.email);
      await page.goto(`/app/incidents/${incident.id}`, {
        waitUntil: 'domcontentloaded',
      });
      await page.getByRole('link', { name: 'Create CAPA' }).click();
      await page.waitForURL('**/app/capa/new**');

      await page.locator('input[name="title"]').fill(title);
      await page
        .locator('textarea[name="description"]')
        .fill('Phase-one CAPA workflow validation.');
      await page.locator('select[name="type"]').selectOption('corrective');
      await page.locator('select[name="severity"]').selectOption('high');
      await page.locator('select[name="owner_id"]').selectOption(context.userId);
      await page.locator('input[name="due_date"]').fill(dueDate);
      await page.getByRole('button', { name: 'Create CAPA' }).click();
      await page.waitForURL((url) =>
        /^\/app\/capa\/[0-9a-f-]{36}$/i.test(url.pathname),
      );

      const created = await context.admin
        .from('org_capa_items')
        .select('id, status, owner_id, source_type, source_id')
        .eq('organization_id', context.orgId)
        .eq('title', title)
        .maybeSingle();
      capaId = (created.data as { id?: string } | null)?.id ?? null;
      expect(capaId).toBeTruthy();
      expect((created.data as { status?: string } | null)?.status).toBe('open');
      expect((created.data as { owner_id?: string } | null)?.owner_id).toBe(
        context.userId,
      );
      expect((created.data as { source_type?: string } | null)?.source_type).toBe(
        'incident',
      );
      expect((created.data as { source_id?: string } | null)?.source_id).toBe(
        incident.id,
      );

      await expect(page.locator('h1')).toContainText(title);
      await expect(page.getByRole('link', { name: 'Linked incident' })).toBeVisible();

      await page.locator('select[name="status"]').selectOption('investigating');
      await page.getByRole('button', { name: 'Move status' }).click();
      await expectCapaStatus(context, capaId!, 'investigating');

      await page
        .locator('textarea[name="root_cause"]')
        .fill('Supplier process drift caused the nonconformance.');
      await page.getByRole('button', { name: 'Save root cause' }).click();
      await expect
        .poll(async () => {
          const { data } = await context.admin
            .from('org_capa_items')
            .select('root_cause')
            .eq('id', capaId!)
            .maybeSingle();
          return (data as { root_cause?: string } | null)?.root_cause ?? '';
        })
        .toContain('Supplier process drift');

      await page.locator('select[name="status"]').selectOption('action_assigned');
      await page.getByRole('button', { name: 'Move status' }).click();
      await expectCapaStatus(context, capaId!, 'action_assigned');

      await page
        .locator('textarea[name="corrective_action"]')
        .fill('Retrain the affected team and update the work instruction.');
      await page.getByRole('button', { name: 'Save corrective action' }).click();
      await page
        .locator('textarea[name="preventive_action"]')
        .fill('Add a monthly control review and owner sign-off.');
      await page.getByRole('button', { name: 'Save preventive action' }).click();

      await page.locator('select[name="status"]').selectOption('verification');
      await page.getByRole('button', { name: 'Move status' }).click();
      await expectCapaStatus(context, capaId!, 'verification');

      await page
        .locator('textarea[name="verification_notes"]')
        .fill('Verified by reviewing the new work instruction and sample records.');
      await page.getByRole('button', { name: 'Save verification' }).click();
      await expect
        .poll(async () => {
          const { data } = await context.admin
            .from('org_capa_items')
            .select('verification_notes, verified_at')
            .eq('id', capaId!)
            .maybeSingle();
          return (data as { verification_notes?: string; verified_at?: string } | null)
            ?.verified_at
            ? 'verified'
            : '';
        })
        .toBe('verified');

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Close CAPA' }).click();
      await expectCapaStatus(context, capaId!, 'closed');

      await page.reload({ waitUntil: 'domcontentloaded' });
      await page
        .getByTestId('entity-evidence-file-input')
        .setInputFiles({
          name: `capa-evidence-${unique}.txt`,
          mimeType: 'text/plain',
          buffer: Buffer.from('CAPA evidence upload from E2E.'),
        });
      await expect(page.getByTestId('entity-evidence-item')).toContainText(
        `capa-evidence-${unique}.txt`,
      );

      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('h1')).toContainText(title);
      await expect(page.getByText('Closed', { exact: true }).first()).toBeVisible();
      await expect(page.locator('textarea[name="verification_notes"]')).toHaveValue(
        /Verified by reviewing/,
      );
      await expect(page.getByTestId('entity-evidence-item')).toContainText(
        `capa-evidence-${unique}.txt`,
      );
      await expect(page.locator('text=attached CAPA evidence')).toBeVisible();

      await page.getByRole('link', { name: 'Linked incident' }).click();
      await page.waitForURL(`**/app/incidents/${incident.id}`);
      await expect(page.locator('h1')).toContainText('Incident Detail');
    } finally {
      if (capaId) {
        const { data: evidenceRows } = await context.admin
          .from('org_evidence')
          .select('id, file_path')
          .eq('organization_id', context.orgId)
          .eq('entity_type', 'capa')
          .eq('entity_id', capaId);
        const filePaths = ((evidenceRows ?? []) as { file_path?: string | null }[])
          .map((row) => row.file_path)
          .filter((value): value is string => Boolean(value));
        if (filePaths.length > 0) {
          await context.admin.storage.from('evidence').remove(filePaths);
        }
        await context.admin
          .from('org_evidence')
          .delete()
          .eq('organization_id', context.orgId)
          .eq('entity_type', 'capa')
          .eq('entity_id', capaId);
        await context.admin
          .from('org_capa_items')
          .delete()
          .eq('organization_id', context.orgId)
          .eq('id', capaId);
      }
      await context.admin
        .from('org_incidents')
        .delete()
        .eq('organization_id', context.orgId)
        .eq('id', incident.id);
    }
  });
});
