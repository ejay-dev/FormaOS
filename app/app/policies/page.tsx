import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, FileText, Search, Filter, ChevronRight, ShieldCheck, Clock } from "lucide-react";

type PolicyRow = {
  id: string;
  title: string;
  status: string;
  version: string | null;
  created_at: string;
};

export default async function PoliciesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Get Organization ID
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  const orgId = membership?.organization_id;

  // 2. Fetch Policies (Using the correct 'organization_id')
  const { data: policies } = await supabase
    .from("org_policies")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  const allPolicies: PolicyRow[] = policies || [];
  const publishedCount = allPolicies.filter((p) => p.status === "published").length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Policy Library</h1>
          <p className="text-slate-400 mt-1">Manage your organization's governance framework.</p>
        </div>
        <Link 
            href="/app/policies/new" 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.35)]"
        >
            <Plus className="h-4 w-4" />
            New Policy
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
             <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-300 flex items-center justify-center shadow-[0_0_18px_rgba(14,165,233,0.2)]">
                 <FileText className="h-5 w-5" />
             </div>
             <div>
                 <p className="text-2xl font-bold text-slate-100">{allPolicies.length}</p>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Policies</p>
             </div>
         </div>
         <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
             <div className="h-10 w-10 rounded-xl bg-emerald-400/10 text-emerald-300 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.2)]">
                 <ShieldCheck className="h-5 w-5" />
             </div>
             <div>
                 <p className="text-2xl font-bold text-slate-100">{publishedCount}</p>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active & Enforced</p>
             </div>
         </div>
         <div className="p-4 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
             <div className="h-10 w-10 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center shadow-[0_0_18px_rgba(245,158,11,0.2)]">
                 <Clock className="h-5 w-5" />
             </div>
             <div>
                 <p className="text-2xl font-bold text-slate-100">{allPolicies.length - publishedCount}</p>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Drafts / Review</p>
             </div>
         </div>
      </div>

      {/* Policies List */}
    <div className="bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] border border-white/10 rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden">
         {/* Simple Toolbar */}
         <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                    placeholder="Filter policies..." 
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-white/10 text-sm focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all bg-white/5 text-slate-100 placeholder:text-slate-500"
                />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-400 hover:bg-white/10">
                <Filter className="h-3 w-3" />
                Filter
            </button>
         </div>

         {/* The Table */}
         <div className="divide-y divide-white/10">
            {allPolicies.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-sm text-slate-400">No policies found. Create one or use an Industry Pack.</p>
                </div>
            ) : (
                allPolicies.map((policy) => (
                    <Link 
                        key={policy.id} 
                        href={`/app/policies/${policy.id}`}
                        className="group flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 text-slate-400 flex items-center justify-center group-hover:bg-white/5 group-hover:shadow-[0_0_18px_rgba(59,130,246,0.12)] transition-all">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                                    {policy.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-400">{policy.version || 'v0.1'}</span>
                                    <span className="h-1 w-1 rounded-full bg-white/20" />
                                    <span className="text-xs text-slate-400">Updated {new Date(policy.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                policy.status === 'published' 
                                    ? 'bg-emerald-400/15 text-emerald-200' 
                                    : 'bg-amber-400/15 text-amber-200'
                            }`}>
                                {policy.status}
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-300" />
                        </div>
                    </Link>
                ))
            )}
         </div>
      </div>
    </div>
  );
}
