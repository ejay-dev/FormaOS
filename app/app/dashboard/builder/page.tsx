import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserDashboard } from '@/lib/dashboard/dashboard-engine';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { LayoutDashboard, Settings } from 'lucide-react';

export const metadata = { title: 'Dashboard | FormaOS' };

export default async function DashboardBuilderPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const db = await createSupabaseServerClient();
  const layout = await getUserDashboard(state.organization.id, state.user.id);

  // Fetch live data for each widget
  const widgetData: Record<string, Record<string, unknown>> = {};

  // Audit product-003 (2026-05-22): every widget on this page rendered 0
  // because (a) org_controls was a missing relation (resolved by view in
  // migration 20260624_005) and (b) org_tasks / org_evidence / org_incidents
  // are keyed on `organization_id` not `org_id`. With the column fix and
  // the new public.org_controls view, the widgets read real numbers.
  const orgId = state.organization.id;

  // Compliance score — public.org_controls is now a real view aliasing
  // org_control_evaluations + framework_controls + frameworks.
  const { count: totalControls } = await db
    .from('org_controls')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);
  // Audit v2-regress-005 (2026-05-22): match the status synonyms the
  // evaluator pipeline can emit ('compliant' | 'satisfied' | 'met') so the
  // widget doesn't undercount. (The former lib/compliance/unified-score.ts —
  // a third, unused scoring formula — was removed in audit H3; the canonical
  // score is the persisted evaluator-overlay path surfaced via the snapshot.)
  const { count: compliantControls } = await db
    .from('org_controls')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['compliant', 'satisfied', 'met']);
  widgetData.compliance_score = {
    score: totalControls
      ? Math.round(((compliantControls || 0) / totalControls) * 100)
      : 0,
  };

  // Task summary
  const { data: tasks } = await db
    .from('org_tasks')
    .select('status')
    .eq('organization_id', orgId);
  const taskStatuses: Record<string, number> = {
    to_do: 0,
    in_progress: 0,
    done: 0,
    overdue: 0,
  };
  for (const t of tasks || []) {
    if (taskStatuses[t.status] !== undefined) taskStatuses[t.status]++;
  }
  const { count: overdueCount } = await db
    .from('org_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .lt('due_date', new Date().toISOString())
    .neq('status', 'done');
  taskStatuses.overdue = overdueCount || 0;
  widgetData.task_summary = { statuses: taskStatuses };
  widgetData.overdue_tasks = { count: overdueCount || 0 };

  // Evidence freshness
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: freshEvidence } = await db
    .from('org_evidence')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', thirtyDaysAgo.toISOString());
  const { count: totalEvidence } = await db
    .from('org_evidence')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);
  widgetData.evidence_freshness = {
    count: freshEvidence || 0,
    total: totalEvidence || 0,
  };

  // Open incidents
  const { count: openIncidents } = await db
    .from('org_incidents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['open', 'investigating']);
  widgetData.incidents_open = { count: openIncidents || 0 };

  // My tasks
  const { count: myTaskCount } = await db
    .from('org_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('assigned_to', state.user.id)
    .neq('status', 'done');
  widgetData.my_tasks = { count: myTaskCount || 0 };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" /> {layout.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personalized compliance dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/app/settings"
            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-border rounded hover:bg-muted"
          >
            <Settings className="h-4 w-4" /> Settings
          </a>
        </div>
      </div>

      <DashboardGrid widgets={layout.widgets} widgetData={widgetData} />
    </div>
  );
}
