import { schedules } from '@trigger.dev/sdk';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/** Daily: recalculate evidence freshness for all orgs */
export const evidenceFreshnessTask = schedules.task({
  id: 'evidence-freshness-daily',
  cron: '0 2 * * *', // Every day at 2 AM
  run: async () => {
    const db = createSupabaseAdminClient();

    const { data: orgs } = await db
      .from('organizations')
      .select('id')
      .eq('status', 'active');

    let totalUpdated = 0;

    for (const org of orgs ?? []) {
      const { data } = await db.rpc('update_evidence_freshness', {
        p_org_id: org.id,
      });
      totalUpdated += (data as number) ?? 0;

      // Check for expiring evidence and create notifications
      const { data: expiring } = await db
        .from('org_evidence')
        .select('id, title, valid_until, freshness_status')
        .eq('organization_id', org.id)
        .in('freshness_status', ['expiring_soon', 'expired']);

      if (expiring && expiring.length > 0) {
        // Create notifications for org admins
        const { data: admins } = await db
          .from('org_memberships')
          .select('user_id')
          .eq('organization_id', org.id)
          .in('role', ['owner', 'admin']);

        for (const admin of admins ?? []) {
          const expiringCount = expiring.filter(
            (e) => e.freshness_status === 'expiring_soon',
          ).length;
          const expiredCount = expiring.filter(
            (e) => e.freshness_status === 'expired',
          ).length;

          if (expiringCount > 0 || expiredCount > 0) {
            await db
              .from('org_notifications')
              .insert({
                organization_id: org.id,
                user_id: admin.user_id,
                type: 'evidence_freshness',
                title: 'Evidence Freshness Alert',
                message: `${expiredCount} expired, ${expiringCount} expiring soon`,
                metadata: { expiredCount, expiringCount },
              })
              .onConflict('id')
              .merge();
          }
        }
      }
    }

    console.log(
      `[evidence-freshness] Updated freshness for ${orgs?.length ?? 0} orgs, ${totalUpdated} changes`,
    );
  },
});
