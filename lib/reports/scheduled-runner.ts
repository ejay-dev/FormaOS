import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { scheduleReport } from '@/lib/reports/scheduler';

type ScheduledReportRow = {
  id: string;
  org_id: string;
  name: string;
  config: Record<string, unknown> | null;
  schedule: Record<string, unknown> | null;
  created_by: string | null;
};

type ScheduledReportResult = {
  reportId: string;
  orgId: string;
  status: 'generated' | 'skipped' | 'failed';
  generationId?: string;
  reason?: string;
};

function asSchedule(row: ScheduledReportRow) {
  const schedule = row.schedule ?? {};
  const frequency = String(schedule.frequency ?? 'weekly');
  const format = String(schedule.format ?? 'csv');
  const recipients = Array.isArray(schedule.recipients)
    ? schedule.recipients.map(String).filter(Boolean)
    : [];
  const hour = Number(schedule.hour ?? 8);
  const nextSendAt = String(schedule.next_send_at ?? '');

  if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
    return { ok: false as const, reason: 'invalid_frequency' };
  }
  if (!['pdf', 'csv', 'xlsx'].includes(format)) {
    return { ok: false as const, reason: 'invalid_format' };
  }

  return {
    ok: true as const,
    frequency: frequency as 'daily' | 'weekly' | 'monthly',
    format: format as 'pdf' | 'csv' | 'xlsx',
    recipients,
    hour: Number.isFinite(hour) ? Math.min(Math.max(hour, 0), 23) : 8,
    nextSendAt,
  };
}

function isDue(nextSendAt: string, now: Date) {
  if (!nextSendAt) return true;
  const dueAt = new Date(nextSendAt).getTime();
  return Number.isNaN(dueAt) || dueAt <= now.getTime();
}

export async function runDueScheduledReports({
  limit = 25,
  now = new Date(),
}: {
  limit?: number;
  now?: Date;
} = {}) {
  const db = createSupabaseAdminClient();
  const batch = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 25;
  const { data, error } = await db
    .from('org_saved_reports')
    .select('id, org_id, name, config, schedule, created_by')
    .eq('type', 'scheduled')
    .not('schedule', 'is', null)
    .order('created_at', { ascending: true })
    .limit(batch * 2);

  if (error) throw new Error(error.message);

  const results: ScheduledReportResult[] = [];
  const dueReports = ((data ?? []) as ScheduledReportRow[])
    .filter((row) => {
      const parsed = asSchedule(row);
      return parsed.ok && isDue(parsed.nextSendAt, now);
    })
    .slice(0, batch);

  for (const row of dueReports) {
    const parsed = asSchedule(row);
    if (!parsed.ok) {
      results.push({
        reportId: row.id,
        orgId: row.org_id,
        status: 'skipped',
        reason: parsed.reason,
      });
      continue;
    }

    try {
      const generatedAt = new Date().toISOString();
      const payload = {
        reportId: row.id,
        reportName: row.name,
        config: row.config ?? {},
        schedule: row.schedule ?? {},
        generatedAt,
        delivery: {
          recipients: parsed.recipients,
          format: parsed.format,
        },
      };
      const size = Buffer.byteLength(JSON.stringify(payload), 'utf8');
      const { data: generation, error: generationError } = await db
        .from('org_report_generations')
        .insert({
          report_id: row.id,
          org_id: row.org_id,
          generated_by: row.created_by,
          format: parsed.format,
          file_url: null,
          file_size_bytes: size,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .select('id')
        .single();

      if (generationError) throw new Error(generationError.message);

      await db
        .from('org_saved_reports')
        .update({ last_generated_at: generatedAt })
        .eq('id', row.id)
        .eq('org_id', row.org_id);

      await scheduleReport(db, row.id, row.org_id, {
        frequency: parsed.frequency,
        recipients: parsed.recipients,
        format: parsed.format,
        hour: parsed.hour,
      });

      results.push({
        reportId: row.id,
        orgId: row.org_id,
        status: 'generated',
        generationId: generation?.id as string | undefined,
      });
    } catch (error) {
      results.push({
        reportId: row.id,
        orgId: row.org_id,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  return {
    ok: true,
    checked: data?.length ?? 0,
    due: dueReports.length,
    generated: results.filter((result) => result.status === 'generated')
      .length,
    failed: results.filter((result) => result.status === 'failed').length,
    results,
  };
}
