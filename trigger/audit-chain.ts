import { schedules } from '@trigger.dev/sdk/v3';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyChainIntegrity } from '@/lib/audit/hash-utils';

// Weekly audit chain integrity verification
export const auditChainVerification = schedules.task({
  id: 'audit-chain-verification',
  cron: '0 4 * * 0', // 4 AM every Sunday
  run: async () => {
    const db = createSupabaseAdminClient();

    // Get all orgs with audit logs
    const { data: orgs } = await db
      .from('audit_log')
      .select('org_id')
      .order('org_id');

    const uniqueOrgs = [...new Set((orgs || []).map((o) => o.org_id))];
    const results: Array<{ orgId: string; valid: boolean; checked: number }> =
      [];

    for (const orgId of uniqueOrgs) {
      // Check last 1000 entries per org
      const { data: entries } = await db
        .from('audit_log')
        .select(
          'id, org_id, user_id, action, resource_type, resource_id, details, created_at, entry_hash, prev_hash',
        )
        .eq('org_id', orgId)
        .order('sequence_number', { ascending: true })
        .limit(1000);

      if (!entries || entries.length === 0) continue;

      const result = verifyChainIntegrity(entries);
      results.push({
        orgId,
        valid: result.valid,
        checked: result.totalChecked,
      });

      if (!result.valid) {
        // Log the integrity violation
        await db.from('audit_log').insert({
          org_id: orgId,
          action: 'chain_integrity_violation',
          resource_type: 'audit_chain',
          details: {
            broken_at_index: result.brokenAt,
            total_checked: result.totalChecked,
          },
        });
      }
    }

    return {
      orgsChecked: results.length,
      violations: results.filter((r) => !r.valid).length,
    };
  },
});

// Daily job to process audit export requests
export const auditExportProcessor = schedules.task({
  id: 'audit-export-processor',
  cron: '0 5 * * *', // 5 AM daily
  run: async () => {
    const db = createSupabaseAdminClient();

    const { data: pendingJobs } = await db
      .from('audit_export_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at')
      .limit(10);

    if (!pendingJobs || pendingJobs.length === 0) return { processed: 0 };

    let processed = 0;

    for (const job of pendingJobs) {
      await db
        .from('audit_export_jobs')
        .update({ status: 'processing' })
        .eq('id', job.id);

      try {
        // Fetch entries in date range
        const { data: entries } = await db
          .from('audit_log')
          .select('*')
          .eq('org_id', job.org_id)
          .gte('created_at', job.date_from)
          .lte('created_at', job.date_to + 'T23:59:59Z')
          .order('created_at');

        const exportData = JSON.stringify(entries || [], null, 2);
        const sizeBytes = Buffer.byteLength(exportData, 'utf8');

        // Store to Supabase Storage
        const fileName = `audit-exports/${job.org_id}/${job.id}.json`;
        await db.storage.from('exports').upload(fileName, exportData, {
          contentType: 'application/json',
        });

        const { data: urlData } = db.storage
          .from('exports')
          .getPublicUrl(fileName);

        await db
          .from('audit_export_jobs')
          .update({
            status: 'completed',
            file_url: urlData.publicUrl,
            file_size_bytes: sizeBytes,
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        processed++;
      } catch {
        await db
          .from('audit_export_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }
    }

    return { processed };
  },
});
