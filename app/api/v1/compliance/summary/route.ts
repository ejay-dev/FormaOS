import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/compliance/summary');

const DAY_MS = 86_400_000;

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rate.resetAt },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const orgId = membership?.organization_id as string | undefined;
    if (!orgId) {
      return NextResponse.json({
        total: 0,
        overdue: 0,
        dueSoon: 0,
        completed: 0,
        completionPercentage: 0,
        obligations: [],
        deadlines: [],
      });
    }

    const { data: tasks, error } = await supabase
      .from('org_tasks')
      .select('id, title, status, priority, due_date, created_at')
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error }, 'failed to load tasks');
      return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
    }

    const now = Date.now();
    const weekFromNow = now + 7 * DAY_MS;

    const rows = tasks ?? [];
    let overdue = 0;
    let dueSoon = 0;
    let completed = 0;
    for (const t of rows) {
      const status = (t.status as string) || 'pending';
      const due = t.due_date ? new Date(t.due_date as string).getTime() : null;
      if (status === 'completed') {
        completed++;
        continue;
      }
      if (due !== null) {
        if (due < now) overdue++;
        else if (due <= weekFromNow) dueSoon++;
      }
    }

    const total = rows.length;
    // Audit compliance-002 (2026-05-22): the dashboard hero card renders
    // `completionPercentage` as the "Posture %" with a "Buyer-ready /
    // Approaching / Needs attention" label. Previously this was
    // `completed / total` of org_tasks — i.e. raw task throughput — which
    // had zero relationship to control evaluations or framework readiness
    // (a tenant with 100/100 tasks done but 0/249 controls satisfied
    // displayed "Buyer-ready 100%"). Replace with the org's latest
    // compliance_score_snapshot, aggregated across all enabled frameworks.
    // Fall back to 0 when no snapshot exists yet — keeping it honest
    // beats inventing a number.
    const taskCompletionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    let completionPercentage = 0;
    try {
      const { data: snapshots } = await supabase
        .from('compliance_score_snapshots')
        .select('framework_slug, compliance_score, snapshot_date')
        .eq('organization_id', orgId)
        .order('snapshot_date', { ascending: false })
        .limit(50);
      if (snapshots && snapshots.length > 0) {
        // For each framework, take the most-recent snapshot; average across
        // frameworks to get the org-level posture. `limit(50)` is a safety
        // cap; a real org has a handful of frameworks.
        const latestByFramework = new Map<string, number>();
        for (const s of snapshots) {
          const slug = (s.framework_slug as string) || 'unknown';
          if (!latestByFramework.has(slug)) {
            latestByFramework.set(
              slug,
              Number((s as { compliance_score?: number }).compliance_score ?? 0),
            );
          }
        }
        if (latestByFramework.size > 0) {
          const sum = Array.from(latestByFramework.values()).reduce(
            (acc, n) => acc + n,
            0,
          );
          completionPercentage = Math.round(sum / latestByFramework.size);
        }
      }
    } catch (snapErr) {
      log.warn({ err: snapErr }, 'compliance_score_snapshots lookup failed');
      completionPercentage = 0;
    }

    const obligations = rows.slice(0, 25).map((t) => ({
      id: t.id as string,
      title: (t.title as string) || 'Untitled',
      framework: 'Internal',
      frameworkCode: 'INT',
      owner: null,
      dueDate: (t.due_date as string) || '',
      status:
        t.status === 'completed'
          ? 'completed'
          : t.due_date && new Date(t.due_date as string).getTime() < now
            ? 'overdue'
            : t.due_date &&
                new Date(t.due_date as string).getTime() <= weekFromNow
              ? 'due_soon'
              : 'on_track',
      evidenceCount: 0,
      controlKey: '',
    }));

    const deadlines = rows
      .filter((t) => t.due_date && t.status !== 'completed')
      .sort(
        (a, b) =>
          new Date(a.due_date as string).getTime() -
          new Date(b.due_date as string).getTime(),
      )
      .slice(0, 10)
      .map((t) => {
        const due = new Date(t.due_date as string).getTime();
        const urgency =
          due < now ? 'red' : due <= weekFromNow ? 'amber' : 'green';
        return {
          id: t.id as string,
          title: t.title as string,
          dueDate: t.due_date as string,
          type: 'obligation' as const,
          urgency,
        };
      });

    return NextResponse.json({
      total,
      overdue,
      dueSoon,
      completed,
      // completionPercentage now reflects compliance posture (control
      // evaluations averaged across enabled frameworks). The original
      // task-throughput value is still exposed as `taskCompletionRate`
      // for surfaces that genuinely want operational throughput.
      completionPercentage,
      taskCompletionRate,
      obligations,
      deadlines,
    });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
