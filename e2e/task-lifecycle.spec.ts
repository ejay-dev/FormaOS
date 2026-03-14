import { expect, test } from '@playwright/test';

import {
  completeTaskWithAudit,
  getWorkspaceSeedContext,
  seedEvidence,
  seedTask,
} from './helpers/workspace-seed';

test.describe('Task lifecycle', () => {
  test('create task, attach evidence, complete it, and verify audit history', async ({
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();

    const taskTitle = `E2E Task Lifecycle ${Date.now()}`;

    const createdTask = await seedTask(context, {
      title: taskTitle,
      assignedTo: context.userId,
      priority: 'high',
    });

    await seedEvidence(context, {
      fileName: `task-lifecycle-${Date.now()}.txt`,
      taskId: createdTask.id,
      uploadedBy: context.userId,
      verificationStatus: 'pending',
      content: 'Task lifecycle evidence fixture',
    });

    await expect
      .poll(async () => {
        const { count } = await context.admin
          .from('org_evidence')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', context.orgId)
          .eq('task_id', createdTask.id);
        return count ?? 0;
      })
      .toBeGreaterThan(0);

    await completeTaskWithAudit(context, createdTask.id);

    await expect
      .poll(async () => {
        const { data } = await context.admin
          .from('org_audit_logs')
          .select('id')
          .eq('organization_id', context.orgId)
          .eq('action', 'TASK_COMPLETED')
          .eq('target', `task:${createdTask.id}`)
          .maybeSingle();
        return Boolean(data?.id);
      })
      .toBe(true);
  });
});
