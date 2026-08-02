import { expect, test } from '@playwright/test';

import {
  authenticateWorkspacePage,
  ensureFrameworkScore,
  ensureTeamPlanAccess,
  getWorkspaceSeedContext,
  seedEvidence,
  seedTask,
} from './helpers/workspace-seed';

function isoDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function fetchEvaluation(
  context: Awaited<ReturnType<typeof getWorkspaceSeedContext>>,
  controlKey: string,
) {
  const { data } = await context.admin
    .from('org_control_evaluations')
    .select('control_key, status, last_evaluated_at')
    .eq('organization_id', context.orgId)
    .eq('control_key', controlKey)
    .order('last_evaluated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { status?: string } | null)?.status ?? null;
}

test.describe('Compliance scoring', () => {
  // 2026-08-02: the previous test called `ensureFrameworkScore(context,
  // 'iso27001', 35)` — a service-role write of the score row — seeded a task
  // and evidence that fed into nothing, then polled the same row and
  // asserted it equalled 35, then wrote 82 and asserted 82. The seeded
  // evidence had no causal relationship to the asserted value, so a total
  // failure of the scoring engine still produced a green test.
  //
  // The engine that actually derives control state from org data is
  // `evaluateOrgComplianceCore` (lib/compliance/evaluate-org-compliance.ts),
  // reached from /app/reports via `evaluateOrgCompliance`. This test now
  // seeds inputs, renders the page that runs the engine, and asserts the
  // rows the engine produced for exactly those inputs.
  test('derives control evaluations from seeded tasks and evidence', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');
    test.setTimeout(240_000);

    const context = await getWorkspaceSeedContext();
    // /app/reports only streams ComplianceScoreSection (the component that
    // invokes the evaluator) for owners/admins with an active plan, so make
    // that precondition explicit rather than incidental.
    await ensureTeamPlanAccess(context);
    await ensureFrameworkScore(context, 'iso27001', 35);

    const unique = Date.now();
    const overdueTask = await seedTask(context, {
      title: `Compliance Score Task ${unique}`,
      assignedTo: context.userId,
      priority: 'critical',
      status: 'pending',
      dueDate: isoDateOffset(-2),
    });
    const evidence = await seedEvidence(context, {
      fileName: `compliance-score-${unique}.txt`,
      taskId: overdueTask.id as string,
      uploadedBy: context.userId,
      verificationStatus: 'verified',
      content: 'Evidence fixture that supports a score uplift scenario',
    });

    // evaluate-org-compliance reads `org_evidence.status` (not
    // verification_status — see the note in the report), and treats
    // 'approved'/'verified' as compliant. Set the column the engine actually
    // reads so this test asserts the documented rule, not the drift.
    const { error: evidenceStatusError } = await context.admin
      .from('org_evidence')
      .update({ status: 'verified' })
      .eq('organization_id', context.orgId)
      .eq('id', evidence.id as string);
    expect(evidenceStatusError).toBeNull();

    try {
      await authenticateWorkspacePage(page, context.email);
      await page.goto('/app/reports', { waitUntil: 'domcontentloaded' });

      // The evaluator runs inside ComplianceScoreSection; its heading is the
      // signal that the section streamed rather than erroring out.
      await expect(page.getByText('Reports Center').first()).toBeVisible({
        timeout: 30_000,
      });
      await expect(
        page.getByRole('heading', { name: 'ISO 27001 Compliance' }),
      ).toBeVisible({ timeout: 60_000 });

      // Verified evidence must be scored compliant …
      await expect
        .poll(
          async () => fetchEvaluation(context, `evidence:${evidence.id}`),
          { timeout: 60_000 },
        )
        .toBe('compliant');

      // … and an open task past its due date must be scored non_compliant.
      await expect
        .poll(
          async () => fetchEvaluation(context, `task:${overdueTask.id}`),
          { timeout: 60_000 },
        )
        .toBe('non_compliant');
    } finally {
      await context.admin
        .from('org_control_evaluations')
        .delete()
        .eq('organization_id', context.orgId)
        .in('control_key', [
          `evidence:${evidence.id}`,
          `task:${overdueTask.id}`,
        ]);
      await context.admin
        .from('org_evidence')
        .delete()
        .eq('organization_id', context.orgId)
        .eq('id', evidence.id as string);
      await context.admin
        .from('org_tasks')
        .delete()
        .eq('organization_id', context.orgId)
        .eq('id', overdueTask.id as string);
    }
  });
});
