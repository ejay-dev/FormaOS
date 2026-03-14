import { expect, test } from '@playwright/test';

import {
  createSecondaryUser,
  getWorkspaceSeedContext,
  seedEvidence,
  seedTask,
  verifyEvidenceWithAudit,
} from './helpers/workspace-seed';

test.describe('Evidence management', () => {
  test('review pending evidence and move it into the verified vault state', async ({
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();

    const uploader = await createSecondaryUser(context, {
      role: 'member',
      addMembership: true,
    });
    const task = await seedTask(context, {
      title: `Evidence Review Task ${Date.now()}`,
      assignedTo: uploader.userId,
      priority: 'high',
    });
    const evidence = await seedEvidence(context, {
      fileName: `evidence-review-${Date.now()}.txt`,
      taskId: task.id,
      uploadedBy: uploader.userId,
      verificationStatus: 'pending',
      content: 'Pending evidence fixture for approval workflow',
    });

    await verifyEvidenceWithAudit(
      context,
      evidence.id,
      'verified',
      context.userId,
      'E2E approval',
    );

    await expect
      .poll(async () => {
        const { data } = await context.admin
          .from('org_audit_logs')
          .select('id')
          .eq('organization_id', context.orgId)
          .eq('action', 'EVIDENCE_VERIFIED')
          .eq('target', `evidence:${evidence.id}`)
          .maybeSingle();
        return Boolean(data?.id);
      })
      .toBe(true);
  });
});
