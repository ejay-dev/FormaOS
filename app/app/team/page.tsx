import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InviteButton } from "@/components/team/invite-button"; // ✅ Using our new robust button
import { RoleCell } from "@/components/team/role-cell";
import { Users, Mail, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { hasPermission, normalizeRole } from "@/app/app/actions/rbac";
import { getOrgMemberIdentities } from "@/lib/team/member-identity";
import { PageHero, type PageHeroMetric } from "@/components/ui/page-hero";
import {
  RecordCard,
  RecordList,
} from "@/components/mobile/record-card";
import { TeamEmptyState } from "@/components/empty-states";

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
    .maybeSingle();

  const orgId = membership?.organization_id;

  // 2. Fetch Data Parallel
  const [
    { data: members },
    { data: invites },
    { data: subscription },
    { data: entitlements },
    { data: actorRow },
    identities,
  ] = await Promise.all([
    supabase.from('org_members').select('id, user_id, role, created_at').eq('organization_id', orgId).order('created_at', { ascending: true }).limit(100),
    supabase.from('team_invitations').select('id, email, role, created_at').eq('organization_id', orgId).eq('status', 'pending').order('created_at', { ascending: false }).limit(50),
    supabase.from('org_subscriptions').select('status').eq('organization_id', orgId).maybeSingle(),
    supabase.from('org_entitlements').select('feature_key, enabled, limit_value').eq('organization_id', orgId),
    supabase.from('org_members').select('role').eq('organization_id', orgId).eq('user_id', user?.id ?? '').maybeSingle(),
    getOrgMemberIdentities(),
  ]);

  const actorRoleRaw = String((actorRow as { role?: string } | null)?.role ?? '').toLowerCase();
  const actorRoleKey = normalizeRole(actorRoleRaw);
  const canManageUsers = hasPermission(actorRoleKey, 'MANAGE_USERS');
  const isActorOwner = actorRoleRaw === 'owner';

  const hasSubscription = subscription?.status === "active" || subscription?.status === "trialing";
  const entitlementRows: EntitlementRow[] = entitlements ?? [];
  const memberRows: MemberRow[] = members ?? [];
  const inviteRows: InviteRow[] = invites ?? [];
  const teamLimit =
    entitlementRows.find((e) => e.feature_key === "team_limit" && e.enabled)?.limit_value ?? null;
  const memberCount = memberRows.length;
  const inviteCount = inviteRows.length;
  const reachedLimit = teamLimit !== null && memberCount + inviteCount >= teamLimit;

  const heroMetrics: PageHeroMetric[] = [
    { label: "Members", value: memberCount, sub: "active" },
    {
      label: "Invites",
      value: inviteCount,
      sub: inviteCount > 0 ? "pending" : "none pending",
      tone: inviteCount > 0 ? "warning" : "neutral",
    },
    {
      label: "Limit",
      value: teamLimit !== null ? `${memberCount + inviteCount}/${teamLimit}` : "—",
      sub: teamLimit !== null ? "of plan" : "no cap",
      tone: reachedLimit ? "danger" : "neutral",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHero
        title="Team"
        subtitle="Who has access to this workspace, their role, and any invitations still pending."
        metrics={heroMetrics}
        actions={
          <>
            <Link
              href="/app/team/org-chart"
              className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Org chart
            </Link>
            {orgId ? (
              <InviteButton
                orgId={orgId}
                disabled={!hasSubscription || reachedLimit}
              />
            ) : null}
          </>
        }
      />

      <div className="page-content space-y-4">
      {!hasSubscription ? (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          Subscription required to invite team members.{" "}
          <Link href="/app/billing" className="underline">Upgrade</Link>
        </div>
      ) : null}

      {hasSubscription && reachedLimit ? (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          Team limit reached ({memberCount + inviteCount}/{teamLimit}).{" "}
          <Link href="/app/billing" className="underline">Upgrade</Link>
        </div>
      ) : null}

      {/* Active Members */}
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="h-3.5 w-3.5" />
          Members ({memberRows.length})
        </h2>
        {memberRows.length === 0 ? (
          <div className="rounded-lg border border-border bg-card">
            <TeamEmptyState />
          </div>
        ) : null}
        {/* Mobile cards */}
        <div className="md:hidden">
          <RecordList>
            {memberRows.map((member) => (
              <RecordCard
                key={member.id}
                title={identities[member.user_id ?? '']?.name ?? 'Unknown member'}
                subtitle={identities[member.user_id ?? '']?.email ?? undefined}
                status={
                  <span className="status-pill status-pill-green">Active</span>
                }
                meta={[
                  {
                    label: 'Role',
                    value: (
                      <RoleCell
                        targetUserId={member.user_id ?? ''}
                        currentRole={member.role}
                        isActorOwner={isActorOwner}
                        isSelf={member.user_id === user?.id}
                        editable={canManageUsers && !!member.user_id}
                      />
                    ),
                  },
                ]}
              />
            ))}
          </RecordList>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="min-w-[480px] w-full text-left text-sm">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-4 py-3 text-sm font-medium">User</th>
                        <th className="px-4 py-3 text-sm font-medium">Role</th>
                        <th className="px-4 py-3 text-sm font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                {memberRows.map((member) => {
                    const identity = identities[member.user_id ?? ''];
                    return (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted text-foreground flex items-center justify-center text-xs font-medium uppercase">
                            {identity?.initials ?? "?"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground truncate max-w-[220px]">
                                {identity?.name ?? "Unknown member"}
                            </span>
                            {identity?.email ? (
                                <span className="text-xs text-muted-foreground truncate max-w-[220px]">
                                    {identity.email}
                                </span>
                            ) : null}
                        </div>
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <RoleCell
                          targetUserId={member.user_id ?? ''}
                          currentRole={member.role}
                          isActorOwner={isActorOwner}
                          isSelf={member.user_id === user?.id}
                          editable={canManageUsers && !!member.user_id}
                        />
                    </td>
                    <td className="px-4 py-3">
                        <span className="status-pill status-pill-green">
                            Active
                        </span>
                    </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pending Invites */}
      {inviteRows.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-3.5 w-3.5" />
            Pending invitations ({inviteRows.length})
          </h2>
          {/* Mobile cards */}
          <div className="md:hidden">
            <RecordList>
              {inviteRows.map((invite) => (
                <RecordCard
                  key={invite.id}
                  title={
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{invite.email}</span>
                    </span>
                  }
                  status={
                    <span className="status-pill status-pill-amber">
                      {invite.role}
                    </span>
                  }
                  actions={
                    <form action={revokeInvitation}>
                      <input
                        type="hidden"
                        name="invitationId"
                        value={invite.id}
                      />
                      <input
                        type="hidden"
                        name="organizationId"
                        value={orgId ?? ''}
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors min-h-[36px]"
                      >
                        <Trash2 className="h-3 w-3" />
                        Revoke
                      </button>
                    </form>
                  }
                />
              ))}
            </RecordList>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="min-w-[480px] w-full text-left text-sm">
                <tbody className="divide-y divide-border">
                  {inviteRows.map((invite) => (
                    <tr key={invite.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{invite.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="status-pill status-pill-amber">
                          {invite.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                         <form action={revokeInvitation}>
                           <input type="hidden" name="invitationId" value={invite.id} />
                           <input type="hidden" name="organizationId" value={orgId ?? ""} />
                           <button
                             type="submit"
                             className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
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
        </section>
      )}
      </div>
    </div>
  );
}
