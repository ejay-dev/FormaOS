import { createSupabaseServerClient } from "@/lib/supabase/server";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  MoreVertical,
  ShieldCheck,
  Search,
  Filter,
  Plus
} from "lucide-react";
import Link from "next/link";
import { EvidenceButton } from "@/components/tasks/evidence-button";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  evidence?: Array<{ count: number }> | null;
};

export default async function TasksPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Get Organization context
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  const orgId = membership?.organization_id;

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
  const completed = allTasks.filter((t) => t.status === "completed");

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Dynamic Roadmap Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Compliance Roadmap</h1>
          <p className="text-slate-400 mt-1">Execute mandatory controls and link evidence artifacts.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {completed.length} / {allTasks.length} Controls Verified
            </div>
            <button className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-[0_10px_30px_rgba(59,130,246,0.35)]">
                <Plus className="h-4 w-4" />
                Add Requirement
            </button>
        </div>
      </div>

      {/* 2. Control Filters */}
      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
                placeholder="Search by control name or ID..." 
                className="w-full pl-10 pr-4 py-2 text-sm outline-none bg-transparent text-slate-100 placeholder:text-slate-500"
            />
         </div>
         <div className="h-6 w-px bg-white/10" />
         <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-white/10 rounded-lg transition-colors">
            <Filter className="h-4 w-4" />
            Priority: All
         </button>
      </div>

      {/* 3. The Roadmap Master Table */}
      <div className="bg-gradient-to-br from-[#0B1220] via-[#0E1526] to-[#0A101C] border border-white/10 rounded-3xl shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Control / Requirement</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Evidence Vault</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {allTasks.map((task) => (
              <tr key={task.id} className="group hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
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
                
                <td className="px-6 py-4">
                   <p className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors cursor-default">
                        {task.title}
                    </p>
                   <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">{task.description}</p>
                </td>

                <td className="px-6 py-4">
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                       task.priority === 'critical' ? 'bg-rose-500/15 text-rose-200' : 
                       task.priority === 'high' ? 'bg-amber-400/15 text-amber-200' : 
                       'bg-sky-500/15 text-sky-200'
                   }`}>
                       {task.priority || 'standard'}
                   </span>
                </td>

                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        {(() => {
                          const evidenceCount = task.evidence?.[0]?.count ?? 0;
                          return evidenceCount > 0 ? (
                            <div className="flex items-center gap-1.5 text-emerald-200 bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/30">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-black">{evidenceCount} FILES</span>
                            </div>
                          ) : (
                            <EvidenceButton taskId={task.id} taskTitle={task.title} />
                          );
                        })()}
                    </div>
                </td>

                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Deadline'}
                   </div>
                </td>

                <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* ✅ FINAL CORRECTED EMPTY STATE BLOCK */}
        {allTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center p-24 text-center">
                <p className="text-sm text-slate-400 italic">
                    Your compliance roadmap is currently empty.
                </p>
                <div className="mt-2">
                  <Link href="/app" className="text-xs font-bold text-sky-300 underline">
                      Select an Industry Pack to begin
                  </Link>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
