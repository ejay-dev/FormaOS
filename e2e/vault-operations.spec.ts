import { expect, test } from '@playwright/test';

import {
  getWorkspaceSeedContext,
  seedEvidence,
  seedTask,
  seedVersionedArtifact,
} from './helpers/workspace-seed';

test.describe('Vault operations', () => {
  test('show a versioned artifact, download it, and retain the audit trail', async ({
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'Runs once on chromium');

    const context = await getWorkspaceSeedContext();

    const artifactName = `vault-versioned-${Date.now()}.txt`;
    const task = await seedTask(context, {
      title: `Vault Version Task ${Date.now()}`,
      assignedTo: context.userId,
      priority: 'high',
    });
    const evidence = await seedEvidence(context, {
      fileName: artifactName,
      taskId: task.id,
      uploadedBy: context.userId,
      verificationStatus: 'verified',
      content: 'Vault artifact for versioned download test',
    });
    const versioned = await seedVersionedArtifact(
      context,
      evidence.id,
      artifactName,
    );

    const downloadResult = await context.admin.storage
      .from('evidence')
      .download(versioned.latestPath);
    expect(downloadResult.error).toBeNull();
    expect(await downloadResult.data?.text()).toContain('version-two');

    await expect
      .poll(async () => {
        const { data } = await context.admin
          .from('file_metadata')
          .select('total_versions')
          .eq('id', versioned.fileMetadataId)
          .maybeSingle();
        return data?.total_versions ?? 0;
      })
      .toBe(2);

    await expect
      .poll(async () => {
        const { data } = await context.admin
          .from('org_audit_logs')
          .select('id')
          .eq('organization_id', context.orgId)
          .eq('action', 'EVIDENCE_VERSIONED')
          .eq('target', `evidence:${evidence.id}`)
          .maybeSingle();
        return Boolean(data?.id);
      })
      .toBe(true);
  });
});
