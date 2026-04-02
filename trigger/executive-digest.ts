import { schedules } from '@trigger.dev/sdk/v3';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateExecutiveDigest } from '@/lib/executive/digest-generator';

/**
 * Weekly executive digest — Monday 8:00 AM UTC.
 * Sends compliance summary email to configured executives.
 */
export const weeklyExecutiveDigestTask = schedules.task({
  id: 'executive-digest-weekly',
  cron: '0 8 * * 1', // Monday 8 AM
  run: async () => {
    const db = createSupabaseAdminClient();

    // Find orgs with weekly digest enabled
    const { data: configs } = await db
      .from('org_settings')
      .select('organization_id, value')
      .eq('key', 'executive_digest')
      .contains('value', { frequency: 'weekly', enabled: true } as never);

    if (!configs?.length) return { sent: 0 };

    let sent = 0;

    for (const config of configs) {
      try {
        const orgId = config.organization_id;
        const settings = config.value as { recipients?: string[] };
        const digest = await generateExecutiveDigest(orgId, 'weekly');

        // Send to each configured recipient
        for (const email of settings.recipients ?? []) {
          await db.from('email_queue').insert({
            to: email,
            subject: `${digest.orgName} — Weekly Compliance Digest (${digest.periodLabel})`,
            template: 'executive-digest',
            data: digest,
          });
        }

        sent++;
      } catch {
        // Continue with other orgs
      }
    }

    return { sent };
  },
});

/**
 * Monthly executive digest — 1st of month 8:00 AM UTC.
 */
export const monthlyExecutiveDigestTask = schedules.task({
  id: 'executive-digest-monthly',
  cron: '0 8 1 * *', // 1st of month 8 AM
  run: async () => {
    const db = createSupabaseAdminClient();

    const { data: configs } = await db
      .from('org_settings')
      .select('organization_id, value')
      .eq('key', 'executive_digest')
      .contains('value', { frequency: 'monthly', enabled: true } as never);

    if (!configs?.length) return { sent: 0 };

    let sent = 0;

    for (const config of configs) {
      try {
        const orgId = config.organization_id;
        const settings = config.value as { recipients?: string[] };
        const digest = await generateExecutiveDigest(orgId, 'monthly');

        for (const email of settings.recipients ?? []) {
          await db.from('email_queue').insert({
            to: email,
            subject: `${digest.orgName} — Monthly Compliance Digest (${digest.periodLabel})`,
            template: 'executive-digest',
            data: digest,
          });
        }

        sent++;
      } catch {
        // Continue
      }
    }

    return { sent };
  },
});
