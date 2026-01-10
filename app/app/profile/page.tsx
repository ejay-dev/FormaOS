import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { 
  User, 
  Calendar, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  Clock,
  Building
} from "lucide-react";

export default async function EmployeeProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch individual profile metadata and organization name
  const { data: profile } = await supabase
    .from("org_members")
    .select("*, organizations(name, domain, registration_number)")
    .eq("user_id", user?.id)
    .single();

  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("full_name, phone, avatar_path")
    .eq("user_id", user?.id)
    .maybeSingle();

  if (!profile) return null;

  const avatarPath = userProfile?.avatar_path ?? null;
  const avatarSigned = avatarPath
    ? await supabase.storage.from("user-avatars").createSignedUrl(avatarPath, 60 * 60 * 12)
    : { data: null };
  const avatarUrl = avatarSigned?.data?.signedUrl ?? null;

  const statusColors = {
    active: "bg-emerald-400/10 text-emerald-700 border-emerald-400/30",
    at_risk: "bg-amber-400/10 text-amber-300 border-amber-400/30",
    non_compliant: "bg-rose-500/10 text-red-700 border-rose-400/30",
  };

  return (
    <div className="max-w-5xl space-y-10 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-[2rem] bg-white/10 text-slate-100 flex items-center justify-center shadow-2xl">
            <User className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">Personal Profile</h1>
            <div className="flex items-center gap-2 mt-1">
                <Building className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-sm font-bold text-slate-400 tracking-tight">{profile.organizations.name}</p>
            </div>
          </div>
        </div>
        <div className={`px-6 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm ${statusColors[profile.compliance_status as keyof typeof statusColors] || statusColors.active}`}>
          {profile.compliance_status === 'active' ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          System Status: {profile.compliance_status || 'Active'}
        </div>
      </header>

      <ProfileEditor
        userId={user?.id ?? ""}
        orgId={profile.organization_id}
        role={profile.role}
        userEmail={user?.email ?? ""}
        orgName={profile.organizations.name}
        orgDomain={profile.organizations.domain ?? null}
        orgRegistrationNumber={profile.organizations.registration_number ?? null}
        profile={userProfile ?? null}
        avatarUrl={avatarUrl}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Governance Card */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 shadow-sm space-y-10">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Organizational Record</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-slate-400">
                        <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Department</span>
                        <span className="text-sm font-black text-slate-100">{profile.department || "Unassigned Operations"}</span>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-slate-400">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Start Date</span>
                        <span className="text-sm font-black text-slate-100">
                            {profile.start_date ? new Date(profile.start_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : "Pending Verification"}
                        </span>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-slate-400">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Access Tier</span>
                        <span className="text-sm font-black text-slate-100 capitalize tracking-tight">{profile.role} Permissions</span>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-slate-400">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employee ID</span>
                        <span className="text-sm font-mono font-bold text-slate-100">USR-{profile.user_id.slice(0, 8).toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Phase 2 Teaser: Quick Summary */}
        <div className="bg-white/10 rounded-[2.5rem] p-10 text-slate-100 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Credential Integrity</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
                All professional licenses and identity documents are securely managed by the organization's central vault.
            </p>
            <div className="pt-8 border-t border-white/10 space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Document Status</span>
                    <span className="text-emerald-500">Audit Ready</span>
                 </div>
                 <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 w-[100%]" />
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}
