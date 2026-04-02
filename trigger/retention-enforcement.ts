import { schedules } from '@trigger.dev/sdk/v3';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Daily job to process retention policy expirations
export const retentionEnforcement = schedules.task({
  id: 'retention-enforcement',
  cron: '0 2 * * *', // 2 AM daily
  run: async () => {
    const db = createSupabaseAdminClient();

    // Get all active retention policies
    const { data: policies } = await db
      .from('retention_policies')
      .select('*')
      .eq('is_active', true);

    if (!policies || policies.length === 0) return { processed: 0 };

    let actioned = 0;

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retention_period_days);
      const cutoff = cutoffDate.toISOString();

      // Find documents past retention in each category
      // For evidence documents
      if (policy.document_category === 'evidence') {
        const { data: expired } = await db
          .from('org_evidence')
          .select('id, org_id')
          .eq('org_id', policy.org_id)
          .lte('created_at', cutoff)
          .limit(100);

        if (!expired) continue;

        for (const doc of expired) {
          // Check legal hold
          const { count: holdCount } = await db
            .from('legal_hold_documents')
            .select('*', { count: 'exact', head: true })
            .eq('document_id', doc.id)
            .eq('org_id', doc.org_id);

          if (holdCount && holdCount > 0) continue; // Skip — under legal hold

          // Log the action
          await db.from('document_lifecycle_log').insert({
            org_id: doc.org_id,
            document_type: 'evidence',
            document_id: doc.id,
            action:
              policy.action_on_expiry === 'delete' ? 'deleted' : 'archived',
            metadata: {
              retention_policy_id: policy.id,
              retention_period_days: policy.retention_period_days,
            },
          });

          if (policy.action_on_expiry === 'archive') {
            await db
              .from('org_evidence')
              .update({ status: 'archived' })
              .eq('id', doc.id);
          }

          actioned++;
        }
      }
    }

    return { processed: actioned };
  },
});
