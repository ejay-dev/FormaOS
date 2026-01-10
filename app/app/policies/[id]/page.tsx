import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { 
  ChevronLeft, 
  Save, 
  ShieldCheck, 
  FileEdit,
  History 
} from "lucide-react";
import Link from "next/link";
import { updatePolicy } from "@/app/app/actions/policies";
import { ArtifactSidebar } from "@/components/policies/artifact-sidebar"; 

export default async function PolicyDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const policyId = resolvedParams?.id ?? "";
  if (!policyId) return notFound();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.organization_id) return notFound();

  // 1. Fetch Policy + Context (org-scoped)
  const { data: policy } = await supabase
    .from("org_policies")
    .select(`
      *,
      evidence:org_evidence(*) 
    `)
    .eq("id", policyId)
    .eq("organization_id", membership.organization_id)
    .single();

  if (!policy) notFound();

  // 2. Fetch Vault browser items (for the sidebar)
  const { data: vaultItems } = await supabase
    .from("org_evidence")
    .select("*")
    .eq("organization_id", membership.organization_id);

  const isAdmin = membership?.role === 'admin';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link href="/app/policies" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-100 transition-all group">
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Policy Library
        </Link>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <History className="h-3 w-3" />
                <span>Last modified: {new Date(policy.last_updated_at || policy.created_at).toLocaleDateString()}</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-400/10 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-400/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Template
            </div>
        </div>
      </div>

      {/* Main Form Surface */}
      {/* Main Form Surface */}
          <form 
            action={async (formData) => {
              "use server";
              await updatePolicy(formData);
            }}
          >
        {/* CRITICAL: The Server Action needs the ID to function. 
            We pass it securely as a hidden field. 
        */}
        <input type="hidden" name="policyId" value={policy.id} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT: Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-[800px]">
               <div className="p-8 border-b border-white/10 bg-white/5">
                  <input 
                    name="title"
                    defaultValue={policy.title}
                    disabled={!isAdmin}
                    placeholder="Policy Title..."
                    className="w-full bg-transparent text-3xl font-black text-slate-100 outline-none placeholder:text-slate-400 tracking-tight disabled:opacity-50"
                  />
               </div>
               <div className="p-8 flex-1">
                  <textarea 
                    name="content"
                    defaultValue={policy.content}
                    disabled={!isAdmin}
                    placeholder="# Write your policy content here..."
                    className="w-full h-full bg-transparent text-sm leading-relaxed text-slate-400 outline-none resize-none font-mono disabled:opacity-50"
                  />
               </div>
            </div>
          </div>

          {/* RIGHT: Configuration & Artifacts */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Artifact Browser (Imported Component) */}
            <ArtifactSidebar 
                policyId={policy.id} 
                linkedArtifacts={policy.evidence || []} 
                allVaultItems={vaultItems || []} 
                readOnly={!isAdmin}
            />

            {/* Document Controls */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-sm space-y-8 sticky top-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                        Lifecycle Stage
                    </label>
                    <div className="relative">
                        <select 
                            name="status" // Ensure our Server Action handles 'status' update if intended
                            defaultValue={policy.status}
                            disabled={!isAdmin}
                            className="w-full p-4 rounded-2xl border border-white/10 text-xs font-black bg-white/10 cursor-pointer outline-none focus:bg-white/5 focus:ring-2 focus:ring-sky-500/20 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="draft">Drafting Mode</option>
                            <option value="review">Under Review</option>
                            <option value="published">Active & Enforced</option>
                            <option value="archived">Archived</option>
                        </select>
                        <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex flex-col gap-4 py-6 border-y border-white/10">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-slate-400">Version</span>
                        <span className="text-slate-100 bg-white/10 px-2 py-1 rounded-lg">
                            {policy.version || 'v1.0'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-slate-400">Governance ID</span>
                        <span className="font-mono text-slate-400">
                            POL-{policy.id.slice(0, 4).toUpperCase()}
                        </span>
                    </div>
                </div>

                {isAdmin ? (
                    <button 
                        type="submit" 
                        className="w-full bg-white/10 text-slate-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all shadow-xl active:scale-95 group"
                    >
                        <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Commit Changes
                    </button>
                ) : (
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black text-slate-400 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Read Only Mode
                    </div>
                )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
