import { schedules } from '@trigger.dev/sdk';
import {
  generateDigest,
  getNextDigestSchedule,
  sendDigest,
} from '@/lib/notifications/digest';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { NotificationDigestFrequency } from '@/lib/notifications/types';

async function processDigestFrequency(frequency: NotificationDigestFrequency) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('notification_digest_queue')
    .select('user_id')
    .eq('status', 'pending')
    .eq('frequency', frequency)
    .lte('scheduled_for', new Date().toISOString());

  if (error) {
    throw new Error(error.message);
  }

  const userIds: string[] = Array.from(
    new Set(
      (data ?? [])
        .map((row: any) => row.user_id)
        .filter((value: unknown): value is string => typeof value === 'string'),
    ),
  );

  let processed = 0;
  for (const userId of userIds) {
    const digest = await generateDigest(userId, frequency);
    if (!digest) continue;
    await sendDigest(userId, digest);
    processed += 1;
  }

  return processed;
}

export const notificationDigestTask = schedules.task({
  id: 'notification-digest',
  cron: '0 * * * *',
  run: async () => {
    const processed = {
      hourly: await processDigestFrequency('hourly'),
      daily: await processDigestFrequency('daily'),
      weekly: await processDigestFrequency('weekly'),
    };

    return {
      ok: true,
      processed,
      nextRunHints: {
        hourly: getNextDigestSchedule('hourly'),
        daily: getNextDigestSchedule('daily'),
        weekly: getNextDigestSchedule('weekly'),
      },
    };
  },
});
