import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InviteButton } from "@/components/team/invite-button"; // ✅ Using our new robust button
import { Users, Mail, Clock, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { hasPermission, normalizeRole } from "@/app/app/actions/rbac";

type EntitlementRow = {
  feature_key: string;
  enabled: boolean;
  limit_value: number | null;
};

type MemberRow = {
  id: string;
  user_id: string | null;
  role: string | null;
};

type InviteRow = {
  id: string;
  email: string;
  role: string;
};

async function revokeInvitation(formData: FormData) {
  "use server";

  const invitationId = String(formData.get("invitationId") || "");
  const organizationId = String(formData.get("organizationId") || "");

  if (!invitationId || !organizationId) {
    throw new Error("Missing invitation details");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();

  const roleKey = normalizeRole(membership?.role ?? null);
  if (!membership || !hasPermission(roleKey, "MANAGE_USERS")) {
    throw new Error("Insufficient permissions");
  }

  const { error } = await supabase
    .from("team_invitations")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
    })
    .eq("id", invitationId)
    .eq("organization_id", organizationId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to revoke invitation: ${error.message}`);
  }

  revalidatePath("/app/team");
}

export default async function TeamPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get Active Org
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user?.id)
    .single();

  const orgId = membership?.organization_id;

  // 2. Fetch Data Parallel
  const [
    { data: members },
    { data: invites },
    { data: subscription },
    { data: entitlements }
  ] = await Promise.all([
    supabase.from('org_members').select('id, user_id, role, created_at').eq('organization_id', orgId).order('created_at', { ascending: true }).limit(100),
    supabase.from('team_invitations').select('id, email, role, created_at').eq('organization_id', orgId).eq('status', 'pending').order('created_at', { ascending: false }).limit(50),
    supabase.from('org_subscriptions').select('status').eq('organization_id', orgId).maybeSingle(),
    supabase.from('org_entitlements').select('feature_key, enabled, limit_value').eq('organization_id', orgId)
  ]);

  const hasSubscription = subscription?.status === "active" || subscription?.status === "trialing";
  const entitlementRows: EntitlementRow[] = entitlements ?? [];
  const memberRows: MemberRow[] = members ?? [];
  const inviteRows: InviteRow[] = invites ?? [];
  const teamLimit =
    entitlementRows.find((e) => e.feature_key === "team_limit" && e.enabled)?.limit_value ?? null;
  const memberCount = memberRows.length;
  const inviteCount = inviteRows.length;
  const reachedLimit = teamLimit !== null && memberCount + inviteCount >= teamLimit;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Team Management</h1>
          <p className="text-slate-400 font-medium">Manage access, roles, and pending invitations.</p>
        </div>
        {/* The New Invite Button */}
        {orgId && <InviteButton orgId={orgId} disabled={!hasSubscription || reachedLimit} />}
      </div>

      {!hasSubscription ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
          Subscription required to invite additional team members.{" "}
          <Link href="/app/billing" className="underline">Upgrade plan</Link>
        </div>
      ) : null}

      {hasSubscription && reachedLimit ? (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
          Team limit reached ({memberCount + inviteCount}/{teamLimit}).{" "}
          <Link href="/app/billing" className="underline">Upgrade plan</Link>
        </div>
      ) : null}

      <div className="grid gap-6 sm:gap-8">
        {/* SECTION 1: Active Members */}
        <div className="bg-white/5 border border-white/10 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-white/10 flex items-center gap-2">
             <div className="h-8 w-8 rounded-full bg-sky-500/10 text-sky-300 flex items-center justify-center">
                <Users className="h-4 w-4" />
             </div>
             <h3 className="font-bold text-slate-100">Active Members</h3>
          </div>
          
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-[560px] sm:min-w-[640px] w-full text-left text-sm">
                <thead className="bg-white/10 text-slate-400 font-bold text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-4 sm:px-6 py-4">User</th>
                        <th className="px-4 sm:px-6 py-4">Role</th>
                        <th className="px-4 sm:px-6 py-4">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                {memberRows.map((member) => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-white/10 text-slate-100 flex items-center justify-center text-xs font-bold uppercase ring-2 ring-white shadow-sm">
                            {member.user_id?.slice(0, 2) || "??"}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-slate-100 text-xs">
                                {member.user_id}
                            </span>
                            <span className="text-xs text-slate-400">ID: {member.id.slice(0, 8)}...</span>
                        </div>
                        </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-100 text-xs font-bold uppercase tracking-wider shadow-sm">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        {member.role || 'MEMBER'}
                        </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                        <span className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                        </span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: Pending Invites (Conditional) */}
        {inviteRows.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-white/10 flex items-center gap-2 bg-amber-400/10">
               <div className="h-8 w-8 rounded-full bg-amber-400/10 text-amber-300 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
               </div>
               <div>
                   <h3 className="font-bold text-slate-100">Pending Invitations</h3>
                   <p className="text-xs text-slate-400">These users have not accepted yet.</p>
               </div>
            </div>
            
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-[520px] sm:min-w-[560px] w-full text-left text-sm">
                <tbody className="divide-y divide-white/10">
                  {inviteRows.map((invite) => (
                    <tr key={invite.id} className="group hover:bg-amber-400/10 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                              <Mail className="h-4 w-4" />
                          </div>
                          <span className="text-slate-100 font-bold">{invite.email}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="px-2 py-1 rounded-md bg-white/10 text-slate-400 text-xs font-bold uppercase border border-white/10">
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                         <form action={revokeInvitation}>
                           <input type="hidden" name="invitationId" value={invite.id} />
                           <input type="hidden" name="organizationId" value={orgId ?? ""} />
                           <button
                             type="submit"
                             className="flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-xs font-bold text-rose-300 hover:bg-rose-500/10 transition-colors"
                           >
                             <Trash2 className="h-3 w-3" />
                             Revoke
                           </button>
                         </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
