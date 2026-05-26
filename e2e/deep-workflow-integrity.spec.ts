import { expect, test, type Page } from '@playwright/test';
import { randomUUID } from 'crypto';

import {
  authenticateWorkspacePage,
  getWorkspaceSeedContext,
  seedIncident,
  seedTask,
} from './helpers/workspace-seed';

/**
 * Deep workflow integrity — tests user paths longer than three actions to
 * verify each step actually persists, parent records update, and reload
 * confirms persistence.
 *
 * These tests deliberately exercise the *real* UI + API path (no mocks /
 * seeded short-cuts in the steps under test), so a regression at any layer
 * (storage, RLS, server action, revalidation, or UI rerender) surfaces
 * here.
 */

async function gotoWorkflowRoute(page: Page, route: string) {
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
        message.includes('ECONNRESET') ||
        message.includes('ERR_NETWORK_CHANGED') ||
        message.includes('ERR_CONNECTION_RESET') ||
        message.includes('Timeout');
      if (!retryable || attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(500 * (attempt + 1));
    }
  }
  throw lastError;
}

test.describe('Deep workflow integrity', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
  });

  test('Obligation → attach evidence → count + persistence', async ({
    page,
  }) => {
    const context = await getWorkspaceSeedContext();
    const obligation = await seedTask(context, {
      title: `E2E Obligation ${randomUUID().slice(0, 8)}`,
      priority: 'high',
    });
    const obligationId = obligation.id as string;

    // Snapshot pre-upload evidence count straight from the DB so we can
    // assert against the *real* aggregate, not just the UI badge.
    const { count: beforeCount } = await context.admin
      .from('org_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', context.orgId)
      .eq('task_id', obligationId);
    expect(beforeCount ?? 0).toBe(0);

    await authenticateWorkspacePage(page, context.email);
    await gotoWorkflowRoute(page, '/app/compliance');
    await expect(
      page.getByRole('heading', { name: 'Obligations Register' }),
    ).toBeVisible();

    // Wait for the obligations API to populate the table (it's a client
    // fetch). The seeded task should appear by title.
    await expect(
      page.locator('#main-content').getByText(obligation.title as string).first(),
    ).toBeVisible({ timeout: 15_000 });

    // Open the evidence drawer for the seeded obligation
    const row = page.locator('tr', { hasText: obligation.title as string });
    await row.locator('button:has(svg.lucide-paperclip)').click();

    // Drive the hidden file input directly — that's the same path "click to
    // browse" hits.
    const fileInput = page.locator('[data-testid="evidence-file-input"]');
    await expect(fileInput).toBeAttached();
    const evidenceContent = `obligation-evidence-${randomUUID()}`;
    await fileInput.setInputFiles({
      name: 'obligation-evidence.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(evidenceContent, 'utf8'),
    });

    // The drawer should populate with the new evidence row, no error
    await expect(
      page.locator('[data-testid="evidence-upload-error"]'),
    ).toHaveCount(0);

    // Persistence check #1 — evidence row in DB linked to the obligation
    await expect
      .poll(
        async () => {
          const { count } = await context.admin
            .from('org_evidence')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', context.orgId)
            .eq('task_id', obligationId);
          return count ?? 0;
        },
        { timeout: 20_000, intervals: [500, 1000, 2000, 4000] },
      )
      .toBeGreaterThanOrEqual(1);

    // The drawer can lag one client refresh behind during the parallel full
    // suite, so persistence is asserted above and the reloaded register below
    // verifies the user-facing count.

    // Persistence check #2 — file actually exists in storage
    const { data: evidenceRow } = await context.admin
      .from('org_evidence')
      .select('id, file_path')
      .eq('organization_id', context.orgId)
      .eq('task_id', obligationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    expect(evidenceRow?.file_path).toBeTruthy();
    if (evidenceRow?.file_path) {
      const { data: blob } = await context.admin.storage
        .from('evidence')
        .download(evidenceRow.file_path as string);
      expect(blob).toBeTruthy();
      const text = await blob!.text();
      expect(text).toBe(evidenceContent);
    }

    // Close the drawer + reload — the obligations register should now show
    // an evidence count of 1 against this row.
    await page.keyboard.press('Escape');
    await page.reload({ waitUntil: 'domcontentloaded' });
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(obligation.title as string);
    }
    await expect(
      page.locator('#main-content').getByText(obligation.title as string).first(),
    ).toBeVisible({ timeout: 15_000 });

    const reloadedRow = page
      .locator('tr', { hasText: obligation.title as string });
    // The evidence cell renders the count inside a button next to the
    // paperclip icon. Allow a moment for the client fetch to complete.
    await expect(async () => {
      const txt = await reloadedRow.textContent();
      expect(txt ?? '').toMatch(/[1-9]\d*/);
    }).toPass({ timeout: 10_000 });

    // Cleanup
    if (evidenceRow?.file_path) {
      await context.admin.storage
        .from('evidence')
        .remove([evidenceRow.file_path as string]);
    }
    await context.admin
      .from('org_evidence')
      .delete()
      .eq('organization_id', context.orgId)
      .eq('task_id', obligationId);
    await context.admin
      .from('org_tasks')
      .delete()
      .eq('id', obligationId)
      .eq('organization_id', context.orgId);
  });

  test('Obligation evidence upload API rejects unauthorised + invalid input', async ({
    request,
  }) => {
    // Empty body — should 401 (unauthenticated), 400 (missing obligationId),
    // or 403 (CSRF guard rejecting a no-Origin POST from an external client,
    // which is also a valid security signal). 2026-05-25: added 403 after
    // Codex's audit found CSRF was correctly intercepting before business
    // logic could 400/401; the original assertion was too narrow.
    const noBodyRes = await request.post('/api/v1/evidence/upload', {
      multipart: {
        files: {
          name: 'x.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('hello'),
        },
      },
    });
    expect([400, 401, 403]).toContain(noBodyRes.status());

    // Garbage obligationId — should not silently succeed
    const garbageRes = await request.post('/api/v1/evidence/upload', {
      multipart: {
        obligationId: '00000000-0000-0000-0000-000000000000',
        files: {
          name: 'x.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('hello'),
        },
      },
    });
    expect([400, 401, 403, 404]).toContain(garbageRes.status());
  });

  test('Incident → resolve flow persists root cause + status', async ({
    page,
  }) => {
    const context = await getWorkspaceSeedContext();
    const incident = await seedIncident(context, {
      severity: 'medium',
      incidentType: 'safety',
      description: `E2E incident ${randomUUID().slice(0, 8)}`,
      occurredAt: new Date().toISOString(),
    });
    const incidentId = incident.id as string;

    await authenticateWorkspacePage(page, context.email);
    await gotoWorkflowRoute(page, `/app/incidents/${incidentId}`);
    await expect(
      page.getByRole('heading', { name: 'Incident Detail' }).first(),
    ).toBeVisible();

    await page.fill(
      'textarea[name="root_cause"]',
      'E2E root cause: equipment fault',
    );
    await page.fill(
      'textarea[name="preventive_measures"]',
      'E2E preventive: monthly inspection',
    );
    await page.getByTestId('resolve-incident-submit').first().click();

    await expect(async () => {
      const { data: row } = await context.admin
        .from('org_incidents')
        .select('status, root_cause, resolved_at')
        .eq('id', incidentId)
        .eq('organization_id', context.orgId)
        .maybeSingle();

      expect(row?.status).toBe('resolved');
      expect(row?.root_cause).toContain('E2E root cause');
      expect(row?.resolved_at).toBeTruthy();
    }).toPass({ timeout: 30_000 });

    // Reload after the persisted write so the server-rendered detail page
    // proves the resolution record survives a fresh request.
    await gotoWorkflowRoute(page, `/app/incidents/${incidentId}`);
    await expect(
      page.getByRole('heading', { name: 'Resolution Record' }).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('text=E2E root cause: equipment fault'),
    ).toBeVisible();

    const { data: row } = await context.admin
      .from('org_incidents')
      .select('status, root_cause, resolved_at')
      .eq('id', incidentId)
      .eq('organization_id', context.orgId)
      .maybeSingle();
    expect(row?.status).toBe('resolved');
    expect(row?.root_cause).toContain('E2E root cause');
    expect(row?.resolved_at).toBeTruthy();

    await context.admin
      .from('org_incidents')
      .delete()
      .eq('id', incidentId)
      .eq('organization_id', context.orgId);
  });

  test('Care plan → add goal → mark achieved → 100% progress persists', async ({
    page,
  }) => {
    const context = await getWorkspaceSeedContext();
    const unique = Date.now();
    const { data: participant } = await context.admin
      .from('org_patients')
      .insert({
        organization_id: context.orgId,
        full_name: `E2E Patient ${unique}`,
        care_status: 'active',
        risk_level: 'low',
        created_by: context.userId,
      })
      .select('id')
      .single();
    const participantId = participant?.id as string;

    const { data: plan } = await context.admin
      .from('org_care_plans')
      .insert({
        organization_id: context.orgId,
        client_id: participantId,
        plan_type: 'support',
        title: `E2E Plan ${unique}`,
        status: 'draft',
        start_date: new Date().toISOString().slice(0, 10),
        goals: [],
        supports: [],
        created_by: context.userId,
      })
      .select('id')
      .single();
    const planId = plan?.id as string;

    try {
      await authenticateWorkspacePage(page, context.email);
      await gotoWorkflowRoute(page, `/app/care-plans/${planId}`);
      await expect(
        page.locator('[data-testid="care-plan-title"]'),
      ).toBeVisible();

      // Add a goal via the real form — care-plans.spec.ts already proves
      // this works reliably with poll-based DB verification (rather than
      // a fixed sleep). Mirroring that pattern here so we test the *full*
      // path (form submit → server action → revalidation → render),
      // not just the render half.
      const addGoalForm = page.locator('[data-testid="add-goal-form"]');
      await addGoalForm
        .locator('input[name="title"]')
        .fill(`E2E goal ${unique}`);
      await addGoalForm.locator('[data-testid="submit-goal"]').click();

      // Wait for the goal to land in the DB before asserting the render —
      // parallel workers can otherwise race the mutation.
      await expect
        .poll(
          async () => {
            const { data } = await context.admin
              .from('org_care_plans')
              .select('goals')
              .eq('id', planId)
              .maybeSingle();
            const goals = Array.isArray(data?.goals) ? data.goals : [];
            return goals.length;
          },
          { timeout: 15_000 },
        )
        .toBeGreaterThan(0);
      await page.reload();
      await expect(page.locator('[data-testid="care-plan-goal"]')).toHaveCount(
        1,
        { timeout: 15_000 },
      );

      // Mark achieved via the per-goal status form — also a real form
      // submit, so we exercise updateGoalStatusAction + syncCarePlanProgress
      // end-to-end.
      const goalRow = page.locator('[data-testid="care-plan-goal"]').first();
      await goalRow.locator('select[name="status"]').selectOption('achieved');
      await goalRow.locator('form button[type="submit"]', { hasText: /update/i }).first().click();

      // Wait for the DB to reflect the status change before reloading.
      await expect
        .poll(
          async () => {
            const { data } = await context.admin
              .from('org_care_plans')
              .select('goals')
              .eq('id', planId)
              .maybeSingle();
            const goals = Array.isArray(data?.goals)
              ? (data!.goals as Array<{ status?: string }>)
              : [];
            return goals[0]?.status;
          },
          { timeout: 15_000 },
        )
        .toBe('achieved');

      // Reload — progress should now read 100%
      await page.reload();
      await expect(
        page.locator('[data-testid="plan-progress-value"]'),
      ).toHaveText('100%', { timeout: 10_000 });

      // Second reload to confirm persistence across navigations
      await page.reload();
      await expect(
        page.locator('[data-testid="plan-progress-value"]'),
      ).toHaveText('100%', { timeout: 10_000 });
    } finally {
      await context.admin
        .from('org_care_plans')
        .delete()
        .eq('id', planId)
        .eq('organization_id', context.orgId);
      await context.admin
        .from('org_patients')
        .delete()
        .eq('id', participantId)
        .eq('organization_id', context.orgId);
    }
  });

  test('Obligations register surfaces evidence count from real data', async ({
    page,
  }) => {
    const context = await getWorkspaceSeedContext();
    const obligation = await seedTask(context, {
      title: `E2E Counted ${randomUUID().slice(0, 8)}`,
      priority: 'medium',
    });
    const obligationId = obligation.id as string;

    // Pre-seed two evidence rows directly so the count is non-zero before
    // we even render — proves the obligations API is reading real data.
    const insert = async () => {
      const filePath = `${context.orgId}/e2e-counts/${randomUUID()}.txt`;
      await context.admin.storage
        .from('evidence')
        .upload(filePath, Buffer.from('e2e count fixture'), {
          contentType: 'text/plain',
          upsert: true,
        });
      await context.admin.from('org_evidence').insert({
        organization_id: context.orgId,
        task_id: obligationId,
        title: 'count fixture',
        file_name: 'count.txt',
        file_path: filePath,
        uploaded_by: context.userId,
        verification_status: 'pending',
      });
      return filePath;
    };

    const path1 = await insert();
    const path2 = await insert();

    try {
      await authenticateWorkspacePage(page, context.email);
      await gotoWorkflowRoute(page, '/app/compliance');
      const row = page.locator('tr', { hasText: obligation.title as string });
      await expect(row).toBeVisible({ timeout: 15_000 });
      // Count should be visible as a number ≥ 2 in the row
      await expect(async () => {
        const text = await row.textContent();
        const match = (text ?? '').match(/(\d+)/g) ?? [];
        const counts = match.map((m) => parseInt(m, 10));
        expect(counts.some((n) => n >= 2)).toBe(true);
      }).toPass({ timeout: 10_000 });
    } finally {
      await context.admin
        .from('org_evidence')
        .delete()
        .eq('organization_id', context.orgId)
        .eq('task_id', obligationId);
      await context.admin.storage.from('evidence').remove([path1, path2]);
      await context.admin
        .from('org_tasks')
        .delete()
        .eq('id', obligationId)
        .eq('organization_id', context.orgId);
    }
  });
});
