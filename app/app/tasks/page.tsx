import { createSupabaseServerClient } from "@/lib/supabase/server";
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
} from "lucide-react";
import Link from "next/link";
import { EvidenceButton } from "@/components/tasks/evidence-button";
import { createTask } from "@/app/app/actions/tasks";
import { fetchSystemState } from "@/lib/system-state/server";
import { redirect } from "next/navigation";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
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
  return Array.isArray(input) ? input[0] ?? "" : input ?? "";
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const queryRaw = parseSingleValue(resolvedSearchParams.q).trim();
  const query = queryRaw.toLowerCase();
  const priorityFilterRaw = parseSingleValue(resolvedSearchParams.priority).trim().toLowerCase();
  const statusFilterRaw = parseSingleValue(resolvedSearchParams.status).trim().toLowerCase();
  const priorityFilter = ["all", "critical", "high", "standard"].includes(priorityFilterRaw)
    ? priorityFilterRaw
    : "all";
  const statusFilter = ["all", "open", "in_progress", "completed"].includes(statusFilterRaw)
    ? statusFilterRaw
    : "all";

  const systemState = await fetchSystemState();
  if (!systemState) {
    redirect("/workspace-recovery?from=tasks-page");
  }

  const supabase = await createSupabaseServerClient();
  const orgId = systemState.organization.id;

  // 2. Fetch Tasks with Live Evidence Counts
  const { data: tasks } = await supabase
    .from("org_tasks")
    .select(`
      *,
      evidence:org_evidence(count)
    `)
    .eq("organization_id", orgId)
    .order("status", { ascending: false })
    .order("due_date", { ascending: true });

  const allTasks: TaskRow[] = tasks || [];
  const filteredTasks = allTasks.filter((task) => {
    const normalizedPriority = (task.priority ?? "standard").toLowerCase();
    const normalizedStatus = (task.status ?? "").toLowerCase();

    const matchesPriority =
      priorityFilter === "all" || normalizedPriority === priorityFilter;
    const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;

    if (!matchesPriority || !matchesStatus) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
    return haystack.includes(query);
  });

  const completed = allTasks.filter((t) => t.status === "completed");
  const hasFilters = Boolean(query || priorityFilter !== "all" || statusFilter !== "all");

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Dynamic Roadmap Header */}
      <div
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        data-tour="tasks-header"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Compliance Roadmap</h1>
          <p className="text-slate-400 mt-1">Execute mandatory controls and link evidence artifacts.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
                {completed.length} / {allTasks.length} Controls Verified
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 uppercase tracking-widest text-center sm:text-left">
                {filteredTasks.length} Showing{hasFilters ? " (Filtered)" : ""}
            </div>
            <details className="group">
              <summary className="list-none cursor-pointer bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_10px_30px_rgba(59,130,246,0.35)]">
                <Plus className="h-4 w-4" />
                Add Requirement
              </summary>
              <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)] w-full sm:min-w-[320px]">
                <form action={createTask} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Requirement title
                    </label>
                    <input
                      name="title"
                      required
                      placeholder="e.g. Verify staff credential renewal"
                      className="w-full rounded-xl border border-white/10 bg-[hsl(var(--card))] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-white/20"
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Priority
                      </label>
                      <select
                        name="priority"
                        defaultValue="standard"
                        className="w-full rounded-xl border border-white/10 bg-[hsl(var(--card))] px-4 py-2.5 text-sm text-slate-100 focus:outline-white/20"
                      >
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="standard">Standard</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Due date (optional)
                      </label>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          name="dueDate"
                          className="w-full rounded-xl border border-white/10 bg-[hsl(var(--card))] pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-white/20"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Recurrence (days, optional)
                    </label>
                    <div className="relative">
                      <RefreshCcw className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        name="recurrenceDays"
                        min={0}
                        placeholder="0"
                        className="w-full rounded-xl border border-white/10 bg-[hsl(var(--card))] pl-9 pr-4 py-2.5 text-sm text-slate-100 focus:outline-white/20"
                      />
                    </div>
                  </div>
                  <button className="w-full rounded-xl bg-sky-500/90 hover:bg-sky-400 text-slate-950 text-sm font-bold py-2.5 transition-all">
                    Save Requirement
                  </button>
                </form>
              </div>
            </details>
        </div>
      </div>

      {/* 2. Control Filters */}
      <div className="bg-white/5 p-2 rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <form method="get" className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
              name="q"
              defaultValue={queryRaw}
              placeholder="Search by control name or description..."
              className="w-full pl-10 pr-4 py-2 text-sm outline-none bg-transparent text-slate-100 placeholder:text-slate-500"
            />
          </div>
          <select
            name="priority"
            defaultValue={priorityFilter}
            className="h-10 w-full sm:w-auto rounded-xl border border-white/10 bg-white/10 px-3 text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            <option value="all">Priority: All</option>
            <option value="critical">Priority: Critical</option>
            <option value="high">Priority: High</option>
            <option value="standard">Priority: Standard</option>
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            className="h-10 w-full sm:w-auto rounded-xl border border-white/10 bg-white/10 px-3 text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            <option value="all">Status: All</option>
            <option value="open">Status: Open</option>
            <option value="in_progress">Status: In Progress</option>
            <option value="completed">Status: Completed</option>
          </select>
          <button
            type="submit"
            className="h-10 w-full sm:w-auto px-4 rounded-xl bg-white/10 text-xs font-semibold uppercase tracking-wider text-slate-100 hover:bg-white/20 transition-colors"
          >
            <Filter className="h-3.5 w-3.5 inline mr-2" />
            Apply
          </button>
          {hasFilters ? (
            <Link
              href="/app/tasks"
              className="h-10 w-full sm:w-auto px-4 rounded-xl border border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:bg-white/10 transition-colors inline-flex items-center justify-center"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      {/* 3. The Roadmap Master Table */}
      <div className="bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] border border-white/10 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="w-full overflow-x-auto overscroll-x-contain">
        <table className="min-w-[760px] sm:min-w-[860px] w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-xs font-bold uppercase text-slate-400 tracking-widest">
              <th className="px-4 sm:px-6 py-4">Status</th>
              <th className="px-4 sm:px-6 py-4">Control / Requirement</th>
              <th className="px-4 sm:px-6 py-4">Priority</th>
              <th className="px-4 sm:px-6 py-4">Evidence Vault</th>
              <th className="px-4 sm:px-6 py-4">Due Date</th>
              <th className="px-4 sm:px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-4 sm:px-6 py-4">
                  {task.status === 'completed' ? (
                    <div className="h-8 w-8 rounded-full bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                        <Circle className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                </td>
                
                <td className="px-4 sm:px-6 py-4">
                   <p className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors cursor-default">
                        {task.title}
                    </p>
                   <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{task.description}</p>
                </td>

                <td className="px-4 sm:px-6 py-4">
                   <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-tighter ${
                       task.priority === 'critical' ? 'bg-rose-500/15 text-rose-200' : 
                       task.priority === 'high' ? 'bg-amber-400/15 text-amber-200' : 
                       'bg-sky-500/15 text-sky-200'
                   }`}>
                       {task.priority || 'standard'}
                   </span>
                </td>

                <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2">
                        {(() => {
                          const evidenceCount = task.evidence?.[0]?.count ?? 0;
                          return evidenceCount > 0 ? (
                            <div className="flex items-center gap-1.5 text-emerald-200 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/30">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span className="text-xs font-black">{evidenceCount} FILES</span>
                            </div>
                          ) : (
                            <EvidenceButton taskId={task.id} taskTitle={task.title} />
                          );
                        })()}
                    </div>
                </td>

                <td className="px-4 sm:px-6 py-4">
                   <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Deadline'}
                   </div>
                </td>

                <td className="px-4 sm:px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        {/* ✅ FINAL CORRECTED EMPTY STATE BLOCK */}
        {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center p-24 text-center">
                <p className="text-sm text-slate-400 italic">
                    {allTasks.length === 0
                      ? "Your compliance roadmap is currently empty."
                      : "No requirements match the current filters."}
                </p>
                {allTasks.length === 0 ? (
                  <div className="mt-2">
                    <Link href="/app" className="text-xs font-bold text-sky-300 underline">
                        Select an Industry Pack to begin
                    </Link>
                  </div>
                ) : null}
            </div>
        )}
      </div>
    </div>
  );
}
