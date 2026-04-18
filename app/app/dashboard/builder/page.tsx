import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getUserDashboard } from '@/lib/dashboard/dashboard-engine';
import { DashboardGrid } from '@/components/dashboard/dashboard-grid';
import { LayoutDashboard, Settings } from 'lucide-react';

export const metadata = { title: 'Dashboard | FormaOS' };

export default async function DashboardBuilderPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();
  const layout = await getUserDashboard(state.organization.id, state.user.id);

  // Fetch live data for each widget
  const widgetData: Record<string, Record<string, unknown>> = {};

  // Compliance score
  const { count: totalControls } = await db
    .from('org_controls')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', state.organization.id);
  const { count: compliantControls } = await db
    .from('org_controls')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', state.organization.id)
    .eq('status', 'compliant');
  widgetData.compliance_score = {
    score: totalControls
      ? Math.round(((compliantControls || 0) / totalControls) * 100)
      : 0,
  };

  // Task summary
  const { data: tasks } = await db
    .from('org_tasks')
    .select('status')
    .eq('org_id', state.organization.id);
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
    .eq('org_id', state.organization.id)
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
    .eq('org_id', state.organization.id)
    .gte('created_at', thirtyDaysAgo.toISOString());
  const { count: totalEvidence } = await db
    .from('org_evidence')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', state.organization.id);
  widgetData.evidence_freshness = {
    count: freshEvidence || 0,
    total: totalEvidence || 0,
  };

  // Open incidents
  const { count: openIncidents } = await db
    .from('org_incidents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', state.organization.id)
    .in('status', ['open', 'investigating']);
  widgetData.incidents_open = { count: openIncidents || 0 };

  // My tasks
  const { count: myTaskCount } = await db
    .from('org_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', state.organization.id)
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
