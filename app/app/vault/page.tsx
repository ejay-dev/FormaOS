import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ShieldCheck,
  FileText,
  Search,
  FileUp,
  HardDrive,
  Trash2,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  Download,
  Eye,
} from "lucide-react";
import { verifyEvidence } from "@/app/app/actions/evidence";

function getFileName(item: any) {
  return item?.file_name || item?.title || item?.name || "Untitled";
}

function getFileType(item: any) {
  return item?.file_type || item?.mime_type || "file";
}

function getFileSizeKB(item: any) {
  const bytes = Number(item?.file_size) || 0;
  return (bytes / 1024).toFixed(0);
}

export default async function VaultPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-xl font-bold text-slate-100">Please sign in</h1>
      </div>
    );
  }

  // 1) Fetch Context
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return (
      <div className="p-12 text-center">
        <h1 className="text-xl font-bold text-slate-100">Access Denied</h1>
        <p className="text-slate-400">No active organization membership found.</p>
      </div>
    );
  }

  const isAuditor = ["admin", "manager"].includes(membership.role);

  // 2) Fetch All Evidence (upgrade adds joins)
  const { data: artifacts } = await supabase
    .from("org_evidence")
    .select(
      `
      *,
      task:task_id (title),
      policy:policy_id (title)
    `
    )
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  const allArtifacts = artifacts || [];

  // Storage calc (current feature)
  const totalSize =
    allArtifacts.reduce((acc: number, curr: any) => acc + (Number(curr.file_size) || 0), 0) || 0;
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

  // Split (upgrade feature)
  const pending = allArtifacts.filter((a: any) => a.verification_status === "pending");
  const verified = allArtifacts.filter((a: any) => a.verification_status === "verified");

  return (
    <div className="space-y-10 pb-24">
      {/* Header with Storage Meter (current) + Total count (upgrade) */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-100 tracking-tight">Evidence Vault</h1>
          <p className="text-slate-400 mt-2 font-medium tracking-tight">
            Encrypted repository for compliance artifacts. Review, verify, and archive evidence.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold text-slate-400">
            <Filter className="h-4 w-4" />
            <span>{allArtifacts.length} Total Artifacts</span>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-300 flex items-center justify-center shadow-[0_0_18px_rgba(168,85,247,0.2)]">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vault Usage</p>
              <p className="text-sm font-bold text-slate-100">{sizeInMB} MB / 500 MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar (current) */}
      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search artifacts by name or type..."
            className="w-full pl-10 pr-4 py-2 text-sm outline-none bg-transparent"
          />
        </div>
        <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.35)]">
          <FileUp className="h-4 w-4" />
          Upload Artifact
        </button>
      </div>

      {/* PENDING REVIEW SECTION (upgrade) */}
      {pending.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-amber-300">
            <Clock className="h-5 w-5" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">
              Pending Review ({pending.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pending.map((item: any) => (
              <div
                key={item.id}
                className="bg-amber-400/10 border border-amber-400/30 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)] hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)] transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400/80" />

                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-amber-400/10 rounded-xl flex items-center justify-center text-amber-300">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 bg-amber-400/10 px-2 py-1 rounded-lg">
                    Needs Action
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 truncate pr-4">{getFileName(item)}</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6 truncate">
                  Linked to: {item.task?.title || item.policy?.title || "General Upload"}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {getFileType(item)} • {getFileSizeKB(item)} KB
                  </p>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>

                {/* Action Bar */}
                <div className="flex items-center gap-3 mt-4">
                  <button
                    type="button"
                    className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>

                  {isAuditor && (
                    <form
                      action={async (formData) => {
                        "use server";
                        const reason = (formData.get("reason") as string) || "";
                        await verifyEvidence(item.id, "verified", reason);
                      }}
                      className="flex-1"
                    >
                      <input
                        name="reason"
                        placeholder="Reason required"
                        className="mb-3 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-200 placeholder:text-slate-500"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full py-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 text-white hover:brightness-110 text-xs font-bold transition-all shadow-[0_10px_30px_rgba(16,185,129,0.35)] active:scale-95"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Verify
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VERIFIED SECTION (upgrade) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
          <h2 className="text-xs font-black uppercase tracking-[0.2em]">
            Secured Assets ({verified.length})
          </h2>
        </div>

        <div className="bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] border border-white/10 rounded-[2.5rem] shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden">
          {verified.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm font-bold">
              No verified evidence yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-6">Artifact</th>
                    <th className="px-8 py-6">Context</th>
                    <th className="px-8 py-6">Verification</th>
                    <th className="px-8 py-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {verified.map((item: any) => (
                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-emerald-300" />
                          <span className="text-xs font-bold text-slate-100">
                            {getFileName(item)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">
                          {getFileType(item)} • {getFileSizeKB(item)} KB
                        </p>
                      </td>

                      <td className="px-8 py-4 text-xs text-slate-400">
                        {item.task?.title || item.policy?.title || "—"}
                      </td>

                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-emerald-400/10 flex items-center justify-center text-emerald-300">
                            <ShieldCheck className="h-3 w-3" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-100">Verified</span>
                            <span className="text-[9px] font-mono text-slate-400">
                              {item.verified_at
                                ? new Date(item.verified_at).toLocaleDateString()
                                : (item.created_at ? new Date(item.created_at).toLocaleDateString() : "—")}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-4 text-right">
                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            className="p-2 hover:bg-rose-500/10 text-rose-300 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 hover:bg-white/10 text-slate-400 rounded-lg transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Empty state (current) if literally nothing exists */}
      {allArtifacts.length === 0 && (
        <div className="py-20 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center bg-white/5">
          <div className="h-16 w-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-4 shadow-sm">
            <FileUp className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Vault is Empty</h3>
          <p className="text-sm text-slate-400 mt-1">
            Upload your first compliance artifact to begin.
          </p>
        </div>
      )}
    </div>
  );
}
