import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck, FileText, User, Calendar } from "lucide-react";
import { requirePermission } from "@/app/app/actions/rbac";
import PrintPackButton from "@/components/audit/print-pack-button";

export default async function AuditExportPage({ params }: { params: { userId: string } }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin");
  const permissionCtx = await requirePermission("VIEW_AUDIT_LOGS");

  // 1. Fetch Target Personnel Data
  // We use maybeSingle() to prevent crashing if the user doesn't exist
  const { data: staffMember, error } = await supabase
    .from("org_members")
    .select(`
        *,
        org_credentials (*),
        org_audit_logs!actor_id (*)
    `)
    .eq("organization_id", permissionCtx.orgId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (error || !staffMember) {
      console.error("Export Error:", error);
      return notFound();
  }

  // Safe extraction of arrays
  const credentials = staffMember.org_credentials || [];
  // Sort logs by date desc
  const logs = (staffMember.org_audit_logs || []).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="p-12 md:p-20 bg-white/5 min-h-screen text-slate-100 print:p-0 animate-in slide-in-from-bottom-4 duration-700">
        
        {/* Compliance Header */}
        <header className="border-b-4 border-white/10 pb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Compliance Pack</h1>
                <div className="flex items-center gap-3 text-slate-400">
                    <User className="h-4 w-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">
                        ID: {params.userId}
                    </p>
                </div>
            </div>
            <div className="text-right space-y-2">
                <div className="inline-flex items-center gap-2 bg-emerald-400/10 text-emerald-200 px-4 py-1.5 rounded-full">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Audit Verified</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Generated: {new Date().toLocaleDateString()}
                </p>
            </div>
        </header>

        {/* Evidence Vault Section */}
        <section className="mt-16 space-y-8">
            <div className="flex items-center gap-3 mb-8">
                <FileText className="h-5 w-5 text-slate-400" />
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Verified Evidence Vault</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {credentials.length === 0 ? (
                    <div className="col-span-2 p-8 border-2 border-dashed border-white/10 rounded-2xl text-center text-slate-400 text-sm font-bold">
                        No verified documents on file.
                    </div>
                ) : credentials.map((doc: any) => (
                    <div key={doc.id} className="border border-white/10 p-8 rounded-[2rem] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <h3 className="font-black uppercase tracking-widest text-sm text-slate-100">{doc.document_type}</h3>
                            <div className="flex items-center gap-4 mt-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Issued: {doc.issue_date || 'N/A'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                    Expires: {doc.expiry_date || 'Continuous'}
                                </p>
                            </div>
                        </div>
                        <div className="h-10 w-10 bg-emerald-400/10 rounded-xl flex items-center justify-center text-emerald-300 border border-emerald-400/30">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Individual Audit Trail */}
        <section className="mt-20 pt-12 border-t border-white/10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Personnel Activity Log</h2>
            <div className="space-y-0">
                {logs.length === 0 ? (
                    <p className="text-sm font-bold text-slate-400 italic">No activity recorded for this user.</p>
                ) : logs.slice(0, 15).map((log: any) => (
                    <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-white/10 hover:bg-white/5 px-4 -mx-4 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-white/10" />
                            <span className="text-xs font-black uppercase tracking-wide text-slate-100">
                                {log.action.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 mt-1 md:mt-0">
                            {new Date(log.created_at).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </section>
        
        {/* Print Footer */}
        <div className="mt-20 pt-8 border-t-2 border-white/10 flex justify-between items-center print:hidden">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                FormaOS Governance Engine
            </p>
            <PrintPackButton />
        </div>
    </div>
  );
}
