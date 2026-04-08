import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Calendar,
  RefreshCcw,
  Link2,
} from 'lucide-react';
import Link from 'next/link';
import { EvidenceButton } from '@/components/tasks/evidence-button';
import { createTask } from '@/app/app/actions/tasks';
import { fetchSystemState } from '@/lib/system-state/server';
import { redirect } from 'next/navigation';
import { normalizeTaskPriority, taskPriorityLabel } from '@/lib/tasks/priority';

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  framework_slug: string | null;
  control_ref: string | null;
  evidence?: Array<{ count: number }> | null;
};

type TasksPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    priority?: string | string[];
    status?: string | string[];
  }>;
};

function parseSingleValue(input: string | string[] | undefined): string {
  return Array.isArray(input) ? (input[0] ?? '') : (input ?? '');
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const queryRaw = parseSingleValue(resolvedSearchParams.q).trim();
  const query = queryRaw.toLowerCase();
  const priorityFilterRaw = parseSingleValue(resolvedSearchParams.priority)
    .trim()
    .toLowerCase();
  const statusFilterRaw = parseSingleValue(resolvedSearchParams.status)
    .trim()
    .toLowerCase();
  const priorityFilter = ['all', 'critical', 'high', 'medium', 'low'].includes(
    priorityFilterRaw,
  )
    ? priorityFilterRaw
    : 'all';
  const statusFilter = ['all', 'open', 'in_progress', 'completed'].includes(
    statusFilterRaw,
  )
    ? statusFilterRaw
    : 'all';

  const systemState = await fetchSystemState();
  if (!systemState) {
    redirect('/workspace-recovery?from=tasks-page');
  }

  const supabase = await createSupabaseServerClient();
  const orgId = systemState.organization.id;

  // 2. Fetch Tasks with Live Evidence Counts
  const { data: tasks } = await supabase
    .from('org_tasks')
    .select(
      `
      *,
      evidence:org_evidence(count)
    `,
    )
    .eq('organization_id', orgId)
    .order('status', { ascending: false })
    .order('due_date', { ascending: true });

  const allTasks: TaskRow[] = tasks || [];
  const filteredTasks = allTasks.filter((task) => {
    const normalizedPriority = normalizeTaskPriority(task.priority);
    const normalizedStatus = (task.status ?? '').toLowerCase();

    const matchesPriority =
      priorityFilter === 'all' || normalizedPriority === priorityFilter;
    const matchesStatus =
      statusFilter === 'all' || normalizedStatus === statusFilter;

    if (!matchesPriority || !matchesStatus) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase();
    return haystack.includes(query);
  });

  const completed = allTasks.filter((t) => t.status === 'completed');
  const hasFilters = Boolean(
    query || priorityFilter !== 'all' || statusFilter !== 'all',
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="page-header" data-tour="tasks-header">
        <div>
          <h1 className="page-title">Compliance Roadmap</h1>
          <p className="page-description">
            Execute mandatory controls and link evidence artifacts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {completed.length}/{allTasks.length} verified
          </span>
          <details className="group relative">
            <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add
            </summary>
            <div className="absolute right-0 mt-2 bg-card border border-border rounded-lg p-4 shadow-lg w-80 z-20">
              <form action={createTask} className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="field-216"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Title
                  </label>
                  <input
                    id="field-216"
                    name="title"
                    required
                    placeholder="e.g. Verify staff credential renewal"
                    className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="grid gap-3 grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="field-215"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Priority
                    </label>
                    <select
                      id="field-215"
                      name="priority"
                      defaultValue="medium"
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="field-214"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Due date
                    </label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="date"
                        name="dueDate"
                        aria-label="Due date"
                        className="w-full rounded-md border border-border bg-background pl-8 pr-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="field-213"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Recurrence (days)
                  </label>
                  <div className="relative">
                    <RefreshCcw className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      name="recurrenceDays"
                      min={0}
                      placeholder="0"
                      aria-label="Recurrence days"
                      className="w-full rounded-md border border-border bg-background pl-8 pr-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <button className="w-full rounded-md bg-primary text-primary-foreground text-sm font-medium py-1.5 hover:bg-primary/90 transition-colors">
                  Save
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>

      <div className="page-content space-y-4">
        {/* Filters */}
        <form
          method="get"
          className="flex flex-col sm:flex-row items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              name="q"
              defaultValue={queryRaw}
              placeholder="Search controls..."
              aria-label="Search tasks"
              className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-border bg-background"
            />
          </div>
          <select
            name="priority"
            defaultValue={priorityFilter}
            aria-label="Filter by priority"
            className="h-9 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="all">All priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            aria-label="Filter by status"
            className="h-9 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="all">All status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <button
            type="submit"
            className="h-9 px-3 rounded-md border border-border text-xs font-medium hover:bg-accent/30 transition-colors"
          >
            <Filter className="h-3.5 w-3.5 inline mr-1" />
            Apply
          </button>
          {hasFilters ? (
            <Link
              href="/app/tasks"
              className="h-9 px-3 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
            >
              Clear
            </Link>
          ) : null}
        </form>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="w-full overflow-x-auto overscroll-x-contain">
            <table className="min-w-[760px] w-full text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium w-12">Status</th>
                  <th className="px-4 py-3 text-sm font-medium">
                    Control / Requirement
                  </th>
                  <th className="px-4 py-3 text-sm font-medium">Priority</th>
                  <th className="px-4 py-3 text-sm font-medium">Evidence</th>
                  <th className="px-4 py-3 text-sm font-medium">Due Date</th>
                  <th className="px-4 py-3 text-sm font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">
                        {task.title}
                      </p>
                      {(task.framework_slug || task.control_ref) && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground/70 font-medium">
                          <Link2 className="h-2.5 w-2.5 shrink-0" />
                          {[
                            task.framework_slug?.toUpperCase(),
                            task.control_ref,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-xs">
                        {task.description}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`status-pill ${
                          normalizeTaskPriority(task.priority) === 'critical'
                            ? 'status-pill-red'
                            : normalizeTaskPriority(task.priority) === 'high'
                              ? 'status-pill-amber'
                              : 'status-pill-blue'
                        }`}
                      >
                        {taskPriorityLabel(task.priority)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {(() => {
                        const evidenceCount = task.evidence?.[0]?.count ?? 0;
                        return evidenceCount > 0 ? (
                          <span className="status-pill status-pill-green">
                            <ShieldCheck className="h-3 w-3" />
                            {evidenceCount}
                          </span>
                        ) : (
                          <EvidenceButton
                            taskId={task.id}
                            taskTitle={task.title}
                          />
                        );
                      })()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : '-'}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {allTasks.length === 0
                  ? 'Your compliance roadmap is currently empty.'
                  : 'No requirements match the current filters.'}
              </p>
              {allTasks.length === 0 ? (
                <Link
                  href="/app"
                  className="text-xs text-primary hover:underline mt-2"
                >
                  Select an Industry Pack to begin
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
