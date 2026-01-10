import { createSupabaseServerClient } from "@/lib/supabase/server";
import { 
  FileText, ShieldAlert, CheckCircle2, Upload, 
  Calendar, User, ArrowDown 
} from "lucide-react";

export default async function HistoryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get Org
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user?.id)
    .single();

  // 2. Fetch Logs (The History)
  const { data: logs } = await supabase
    .from("org_audit_logs")
    .select("*")
    .eq("organization_id", membership?.organization_id)
    .order("created_at", { ascending: false })
    .limit(100);

  // Helper to determine icon based on action type
  const getEventStyle = (action: string) => {
    if (action.includes('policy')) return { icon: <FileText className="h-4 w-4 text-sky-300" />, bg: 'bg-sky-500/10', border: 'border-sky-400/30' };
    if (action.includes('asset')) return { icon: <ShieldAlert className="h-4 w-4 text-purple-300" />, bg: 'bg-purple-500/10', border: 'border-purple-400/30' };
    if (action.includes('invite')) return { icon: <User className="h-4 w-4 text-amber-300" />, bg: 'bg-amber-400/10', border: 'border-amber-400/30' };
    return { icon: <CheckCircle2 className="h-4 w-4 text-slate-400" />, bg: 'bg-white/10', border: 'border-white/10' };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Compliance History</h1>
        <p className="text-slate-400 text-sm">A permanent timeline of all governance events, policy changes, and incidents.</p>
      </div>

      <div className="relative border-l-2 border-white/10 ml-4 space-y-8 pb-12">
        {logs?.map((log, index) => {
           const style = getEventStyle(log.action);
           return (
            <div key={log.id} className="relative pl-8 group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ring-2 ${style.bg === 'bg-sky-500/10' ? 'ring-sky-400/30 bg-sky-500' : 'ring-white/10 bg-white/10'}`} />
                
                {/* Card Content */}
                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${style.bg}`}>
                                {style.icon}
                            </div>
                            <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                {log.action.replace(/_/g, " ")}
                            </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                            {new Date(log.created_at).toLocaleDateString()}
                        </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100 mb-1">
                        {log.target}
                    </h3>
                    
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                        <div className="h-5 w-5 rounded-full bg-white/10 text-slate-100 flex items-center justify-center text-[8px] font-bold">
                            {log.actor_email[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-400">
                            Action performed by <span className="font-medium text-slate-100">{log.actor_email}</span>
                        </span>
                    </div>
                </div>
            </div>
           )
        })}

        {/* End of Timeline */}
        <div className="relative pl-8">
            <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-white/10" />
            <p className="text-xs text-slate-400 italic">End of record.</p>
        </div>
      </div>
    </div>
  );
}
