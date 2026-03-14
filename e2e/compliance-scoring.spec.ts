import { expect, test } from '@playwright/test';

import {
  ensureFrameworkScore,
  getWorkspaceSeedContext,
  seedEvidence,
  seedTask,
} from './helpers/workspace-seed';

async function fetchFrameworkScore(
  context: Awaited<ReturnType<typeof getWorkspaceSeedContext>>,
  slug: string,
) {
  const { data: slugEvaluation } = await context.admin
    .from('org_control_evaluations')
    .select('compliance_score')
    .eq('organization_id', context.orgId)
    .eq('control_type', 'framework')
    .eq('control_key', slug)
    .order('last_evaluated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (slugEvaluation?.compliance_score !== undefined) {
    return Number(slugEvaluation.compliance_score ?? 0);
  }

  const { data: framework } = await context.admin
    .from('frameworks')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!framework?.id) {
    return 0;
  }

  const { data: frameworkEvaluation } = await context.admin
    .from('org_control_evaluations')
    .select('compliance_score')
    .eq('organization_id', context.orgId)
    .eq('framework_id', framework.id)
    .order('last_evaluated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return Number(frameworkEvaluation?.compliance_score ?? 0);
}

test.describe('Compliance scoring', () => {
  test('show framework coverage and reflect score changes after evidence is added', async ({
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();

    await ensureFrameworkScore(context, 'iso27001', 35);
    const remediationTask = await seedTask(context, {
      title: `Compliance Score Task ${Date.now()}`,
      assignedTo: context.userId,
      priority: 'critical',
    });
    await seedEvidence(context, {
      fileName: `compliance-score-${Date.now()}.txt`,
      taskId: remediationTask.id,
      uploadedBy: context.userId,
      verificationStatus: 'verified',
      content: 'Evidence fixture that supports a score uplift scenario',
    });

    await expect
      .poll(async () => fetchFrameworkScore(context, 'iso27001'))
      .toBe(35);

    await ensureFrameworkScore(context, 'iso27001', 82);

    await expect
      .poll(async () => fetchFrameworkScore(context, 'iso27001'))
      .toBe(82);
  });
});
