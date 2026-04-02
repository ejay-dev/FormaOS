/**
 * Report Scheduler - Configure and execute scheduled report delivery
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  hour?: number; // 0-23
  timezone?: string;
  recipients: string[];
  format: 'pdf' | 'csv' | 'xlsx';
}

export async function scheduleReport(
  db: SupabaseClient,
  reportId: string,
  orgId: string,
  config: ScheduleConfig,
) {
  const nextSendAt = calculateNextSendAt(config);

  const { data, error } = await db
    .from('org_saved_reports')
    .update({
      type: 'scheduled',
      schedule: {
        frequency: config.frequency,
        day_of_week: config.dayOfWeek,
        day_of_month: config.dayOfMonth,
        hour: config.hour ?? 8,
        timezone: config.timezone ?? 'UTC',
        recipients: config.recipients,
        format: config.format,
        next_send_at: nextSendAt.toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('org_id', orgId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function unscheduleReport(
  db: SupabaseClient,
  reportId: string,
  orgId: string,
) {
  const { error } = await db
    .from('org_saved_reports')
    .update({
      type: 'custom',
      schedule: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('org_id', orgId);

  if (error) throw new Error(error.message);
}

export async function getNextScheduled(db: SupabaseClient, orgId: string) {
  const { data } = await db
    .from('org_saved_reports')
    .select('id, name, schedule')
    .eq('org_id', orgId)
    .eq('type', 'scheduled')
    .not('schedule', 'is', null)
    .order('created_at', { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    nextSendAt: (r.schedule as Record<string, string>)?.next_send_at,
    frequency: (r.schedule as Record<string, string>)?.frequency,
    recipients: (r.schedule as Record<string, string[]>)?.recipients ?? [],
  }));
}

function calculateNextSendAt(config: ScheduleConfig): Date {
  const now = new Date();
  const hour = config.hour ?? 8;

  if (config.frequency === 'daily') {
    const next = new Date(now);
    next.setHours(hour, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  if (config.frequency === 'weekly') {
    const dayOfWeek = config.dayOfWeek ?? 1; // Monday
    const next = new Date(now);
    next.setHours(hour, 0, 0, 0);
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntil);
    return next;
  }

  // monthly
  const dayOfMonth = config.dayOfMonth ?? 1;
  const next = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    dayOfMonth,
    hour,
  );
  return next;
}
