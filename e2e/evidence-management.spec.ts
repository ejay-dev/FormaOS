import { expect, test } from '@playwright/test';

import {
  authenticateWorkspacePage,
  createSecondaryUser,
  getWorkspaceSeedContext,
  seedEvidence,
  seedTask,
} from './helpers/workspace-seed';

test.describe('Evidence management', () => {
  test('review pending evidence and move it into the verified vault state', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();

    const uploader = await createSecondaryUser(context, {
      role: 'member',
      addMembership: true,
    });
    const stamp = Date.now();
    const fileName = `evidence-review-${stamp}.txt`;
    const task = await seedTask(context, {
      title: `Evidence Review Task ${stamp}`,
      assignedTo: uploader.userId,
      priority: 'high',
    });
    // Uploaded by a *different* user so the approver doesn't trip the
    // segregation-of-duties guard in verifyEvidence().
    const evidence = await seedEvidence(context, {
      fileName,
      taskId: task.id,
      uploadedBy: uploader.userId,
      verificationStatus: 'pending',
      content: 'Pending evidence fixture for approval workflow',
    });

    // This test used to call the verifyEvidenceWithAudit fixture — which
    // performs the UPDATE and the audit INSERT itself with the service-role
    // client — and then asserted the fixture's own row existed. No product
    // code ran, so a regression in the approval server action could not fail
    // it. Drive the real vault Verify form instead: form action →
    // app/app/actions/evidence.ts::verifyEvidence → logAuditEvent.
    await authenticateWorkspacePage(page, context.email);
    await page.goto(`/app/vault?q=${encodeURIComponent(fileName)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45_000,
    });
    await expect(
      page.getByRole('heading', { name: 'Evidence Vault' }),
    ).toBeVisible({ timeout: 20_000 });

    const pendingRow = page.locator('tr', { hasText: fileName });
    await expect(pendingRow).toHaveCount(1, { timeout: 20_000 });
    // verifyEvidence rejects a blank reason, so the form must carry one.
    await pendingRow.locator('input[name="reason"]').fill('E2E approval');
    await pendingRow.getByRole('button', { name: /verify/i }).click();

    // 1) The artifact is flipped to verified and stamped with the approver —
    //    not the uploader.
    await expect
      .poll(
        async () => {
          const { data } = await context.admin
            .from('org_evidence')
            .select('verification_status, verified_by')
            .eq('id', evidence.id)
            .eq('organization_id', context.orgId)
            .maybeSingle();
          return `${data?.verification_status ?? 'none'}:${data?.verified_by ?? 'none'}`;
        },
        {
          message: 'Expected the vault Verify action to persist the approval',
          timeout: 30_000,
        },
      )
      .toBe(`verified:${context.userId}`);

    // 2) The approval must leave an audit trail. verifyEvidence calls
    //    logAuditEvent with actionType EVIDENCE_APPROVED and the typed entity
    //    columns (org_audit_logs in production has no metadata/actor_id
    //    column — insertOrgAuditLog strips those — so filter on the columns
    //    that actually exist).
    await expect
      .poll(
        async () => {
          const { data } = await context.admin
            .from('org_audit_logs')
            .select('id')
            .eq('organization_id', context.orgId)
            .eq('action', 'EVIDENCE_APPROVED')
            .eq('entity_type', 'evidence')
            .eq('entity_id', evidence.id)
            .limit(1);
          return data?.length ?? 0;
        },
        {
          message:
            'Expected an EVIDENCE_APPROVED audit log entry for the approved artifact',
          timeout: 30_000,
        },
      )
      .toBeGreaterThan(0);

    // 3) The vault itself reflects the new state: the artifact is no longer
    //    offered for review (no reason input / Verify button on its row).
    await page.reload({ waitUntil: 'domcontentloaded' });
    const settledRow = page.locator('tr', { hasText: fileName });
    await expect(settledRow).toHaveCount(1, { timeout: 20_000 });
    await expect(settledRow.locator('input[name="reason"]')).toHaveCount(0);
  });
});
