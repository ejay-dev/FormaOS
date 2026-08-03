import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  AlertTriangle,
  Clock,
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
import { createTask, updateTaskStatus } from '@/app/app/actions/tasks';
import { hasPermission, normalizeRole } from '@/app/app/actions/rbac';
import { fetchSystemState } from '@/lib/system-state/server';
import { redirect } from 'next/navigation';
import { normalizeTaskPriority } from '@/lib/tasks/priority';
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';
import { SeverityBadge } from '@/components/care/severity-badge';
import { StatusBadge } from '@/components/compliance/StatusBadge';
import { TaskViewSwitcher } from '@/components/tasks/task-view-switcher';
import {
  isTaskOpen,
  normaliseTaskStatus,
  taskStatus,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from '@/components/tasks/task-status';

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  framework_slug: string | null;
  control_ref: string | null;
  evidence?: Array<{ count: number }> | null;
};

type TasksPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    priority?: string | string[];
    status?: string | string[];
    filter?: string | string[];
    error?: string | string[];
  }>;
};

// The row control redirects back here with a code rather than the raw error
// string: the reason is already logged server-side by actionError, and a
// message echoed out of the query string would let a crafted link put
// arbitrary text in front of a signed-in operator.
const STATUS_ERROR_CODE = 'status-update-failed';
const STATUS_ERROR_MESSAGE =
  'That task could not be updated. Your workspace may be read-only while a payment is outstanding, or the task may have been removed. Refresh and try again.';

function parseSingleValue(input: string | string[] | undefined): string {
  return Array.isArray(input) ? (input[0] ?? '') : (input ?? '');
}

// 'open' stays accepted because links written before the three views shared
// one vocabulary still point at it.
const STATUS_FILTER_VALUES = new Set<string>([
  'all',
  ...TASK_STATUSES,
  'open',
]);

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
  const statusFilter =
    STATUS_FILTER_VALUES.has(statusFilterRaw) && statusFilterRaw !== 'all'
      ? normaliseTaskStatus(statusFilterRaw)
      : 'all';
  const filterKey = parseSingleValue(resolvedSearchParams.filter)
    .trim()
    .toLowerCase();
  const statusErrorShown =
    parseSingleValue(resolvedSearchParams.error).trim() === STATUS_ERROR_CODE;

  const systemState = await fetchSystemState();
  if (!systemState) {
    redirect('/workspace-recovery?from=tasks-page');
  }

  const supabase = await createSupabaseServerClient();
  const orgId = systemState.organization.id;

  // Same permission updateTaskStatus enforces, so the row control is only
  // offered to people it can actually work for. Everything the role cannot
  // predict — the billing read-only gate, a deleted task — still lands in the
  // alert above the table.
  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', systemState.user.id)
    .eq('organization_id', orgId)
    .maybeSingle();
  const canEditTasks = hasPermission(
    normalizeRole(membership?.role ?? null),
    'EDIT_CONTROLS',
  );

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
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const userEmailLower = (systemState.user.email ?? '').toLowerCase();
  const userId = systemState.user.id ?? '';

  const filteredTasks = allTasks.filter((task) => {
    const normalizedPriority = normalizeTaskPriority(task.priority);
    const normalizedStatus = normaliseTaskStatus(task.status);

    const matchesPriority =
      priorityFilter === 'all' || normalizedPriority === priorityFilter;
    const matchesStatus =
      statusFilter === 'all' || normalizedStatus === statusFilter;

    if (!matchesPriority || !matchesStatus) {
      return false;
    }

    if (filterKey === 'assigned_to_me') {
      const assignee = (task.assigned_to ?? '').toLowerCase();
      if (!assignee) return false;
      if (assignee !== userEmailLower && assignee !== userId.toLowerCase()) {
        return false;
      }
    } else if (filterKey === 'overdue') {
      if (!isTaskOpen(task.status)) return false;
      if (!task.due_date) return false;
      if (Date.parse(task.due_date) >= now) return false;
    } else if (filterKey === 'due_soon' || filterKey === 'this-week') {
      if (!isTaskOpen(task.status)) return false;
      if (!task.due_date) return false;
      const dueMs = Date.parse(task.due_date);
      if (dueMs < now || dueMs > now + weekMs) return false;
    } else if (filterKey === 'expiring') {
      // Retained for forward-compat; tasks don't have expiry windows.
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = `${task.title} ${task.description ?? ''}`.toLowerCase();
    return haystack.includes(query);
  });

  const completed = allTasks.filter(
    (t) => normaliseTaskStatus(t.status) === 'completed',
  );
  const overdue = allTasks.filter(
    (t) => isTaskOpen(t.status) && t.due_date && Date.parse(t.due_date) < now,
  ).length;
  const critical = allTasks.filter(
    (t) =>
      isTaskOpen(t.status) &&
      normalizeTaskPriority(t.priority) === 'critical',
  ).length;
  const hasFilters = Boolean(
    query || priorityFilter !== 'all' || statusFilter !== 'all',
  );

  // Filters live in the URL, so both redirects have to carry them back or the
  // operator loses their place on top of losing the change.
  const filterParams = new URLSearchParams();
  if (queryRaw) filterParams.set('q', queryRaw);
  if (priorityFilter !== 'all') filterParams.set('priority', priorityFilter);
  if (statusFilter !== 'all') filterParams.set('status', statusFilter);
  if (filterKey) filterParams.set('filter', filterKey);
  const clearedQuery = filterParams.toString();
  const statusClearedHref = clearedQuery
    ? `/app/tasks?${clearedQuery}`
    : '/app/tasks';
  filterParams.set('error', STATUS_ERROR_CODE);
  const statusFailureHref = `/app/tasks?${filterParams.toString()}`;

  const heroMetrics: PageHeroMetric[] = [
    { label: 'Total', value: allTasks.length, sub: 'tasks' },
    {
      label: 'Completed',
      value: completed.length,
      sub: allTasks.length > 0 ? `of ${allTasks.length}` : 'none yet',
      tone: 'success',
    },
    {
      label: 'Overdue',
      value: overdue,
      sub: overdue > 0 ? 'past due' : 'on cadence',
      tone: overdue > 0 ? 'danger' : 'neutral',
    },
    {
      label: 'Critical',
      value: critical,
      sub: critical > 0 ? 'open' : 'none open',
      tone: critical > 0 ? 'warning' : 'neutral',
    },
  ];

  return (
    <div className="flex flex-col h-full" data-tour="tasks-header">
      <OnboardingBanner stepId="review-task" />

      <PageHero
        title="Tasks"
        subtitle="Compliance actions and care follow-ups, with the evidence attached to each one."
        metrics={heroMetrics}
        actions={
          <>
            <TaskViewSwitcher current="list" />
            <details className="group relative">
              <summary className="list-none cursor-pointer inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90">
                <Plus className="h-3.5 w-3.5" />
                Add
              </summary>
              <div className="absolute right-0 mt-2 bg-card border border-border rounded-lg p-4 shadow-lg w-80 z-20">
                <form
                  action={async (fd: FormData) => {
                    'use server';
                    await createTask(fd);
                  }}
                  className="space-y-3"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="task-title"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Title
                    </label>
                    <input
                      id="task-title"
                      name="title"
                      required
                      placeholder="e.g. Verify staff credential renewal"
                      className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="task-priority"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Priority
                      </label>
                      <select
                        id="task-priority"
                        name="priority"
                        defaultValue="medium"
                        className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="task-due-date"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Due date
                      </label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="task-due-date"
                          type="date"
                          name="dueDate"
                          className="w-full rounded-md border border-border bg-background pl-8 pr-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="task-recurrence-days"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Recurrence (days)
                    </label>
                    <div className="relative">
                      <RefreshCcw className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="task-recurrence-days"
                        type="number"
                        name="recurrenceDays"
                        min={0}
                        placeholder="0"
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
          </>
        }
      />

      <div className="page-content space-y-4">
        {statusErrorShown ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            <AlertTriangle
              className="mt-px h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            {STATUS_ERROR_MESSAGE}
          </p>
        ) : null}

        {/* Filters */}
        <form
          method="get"
          className="flex flex-col sm:flex-row items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={queryRaw}
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="w-full pl-9 pr-3 h-9 text-sm rounded-md border border-border bg-background"
              enterKeyHint="search"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
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
            <option value="low">Low</option>
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            aria-label="Filter by status"
            className="h-9 rounded-md border border-border bg-background px-2 text-xs"
          >
            <option value="all">All status</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            ))}
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
                  <th className="px-4 py-3 text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-sm font-medium">Task</th>
                  <th className="px-4 py-3 text-sm font-medium">Priority</th>
                  <th className="px-4 py-3 text-sm font-medium">Evidence</th>
                  <th className="px-4 py-3 text-sm font-medium">Due date</th>
                  {canEditTasks ? (
                    <th className="px-4 py-3 text-sm font-medium text-right">
                      Actions
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="group hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <StatusBadge {...taskStatus(task.status)} />
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
                      <SeverityBadge
                        level={normalizeTaskPriority(task.priority)}
                        size="sm"
                      />
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

                    {canEditTasks ? (
                      <td className="px-4 py-3 text-right">
                        <form
                          action={async () => {
                            'use server';
                            // updateTaskStatus resolves with
                            // { success: false, error } instead of throwing,
                            // so an unread result turns a refused write into a
                            // page that re-renders unchanged and says nothing.
                            const result = await updateTaskStatus(
                              task.id,
                              isTaskOpen(task.status) ? 'completed' : 'pending',
                            );
                            if (!result.success) {
                              redirect(statusFailureHref);
                            }
                            // The code stays in the URL until something
                            // succeeds, so clear it rather than leaving a stale
                            // alert over a change that worked.
                            if (statusErrorShown) {
                              redirect(statusClearedHref);
                            }
                          }}
                        >
                          <button
                            type="submit"
                            className="inline-flex min-h-[32px] items-center rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/30 hover:text-foreground"
                          >
                            {isTaskOpen(task.status)
                              ? 'Mark complete'
                              : 'Reopen'}
                            <span className="sr-only"> {task.title}</span>
                          </button>
                        </form>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {allTasks.length === 0
                  ? 'No tasks yet.'
                  : 'No tasks match the current filters.'}
              </p>
              {allTasks.length === 0 ? (
                <Link
                  href="/app"
                  className="text-xs text-primary hover:underline mt-2"
                >
                  Choose an industry pack to generate your first tasks
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
