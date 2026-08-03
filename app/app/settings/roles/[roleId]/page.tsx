import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Lock, Shield, Users } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';
import { getOrgMemberIdentities } from '@/lib/team/member-identity';
import {
  getRolePermissions,
  PERMISSION_MODULES,
  type PermissionAction,
  type PermissionMatrix,
} from '@/lib/authz/permission-engine';

const ACTIONS: PermissionAction[] = [
  'read',
  'write',
  'delete',
  'export',
  'admin',
];

function label(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const { roleId } = await params;
  const db = await createSupabaseServerClient();

  const { data: role } = await db
    .from('custom_roles')
    .select('id, name, description, base_role, permissions, created_at')
    .eq('id', roleId)
    .eq('org_id', state.organization.id)
    .maybeSingle();

  if (!role) notFound();

  const permissions =
    ((await getRolePermissions(role.id)) as PermissionMatrix | null) ??
    ({} as PermissionMatrix);

  const { data: teams } = await db
    .from('team_groups')
    .select('id, name')
    .eq('org_id', state.organization.id);

  const teamIds = (teams ?? []).map((team) => team.id);
  const { data: assignedMembers } =
    teamIds.length > 0
      ? await db
          .from('team_members')
          .select('id, user_id, team_id, joined_at')
          .eq('custom_role_id', role.id)
          .in('team_id', teamIds)
          .order('joined_at', { ascending: false })
      : { data: [] };

  const teamNameById = new Map(
    (teams ?? []).map((team) => [team.id as string, team.name as string]),
  );

  const identities = await getOrgMemberIdentities();

  const enabledCount = PERMISSION_MODULES.reduce(
    (sum, module) =>
      sum + ACTIONS.filter((action) => permissions[module]?.[action]).length,
    0,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-16">
      <div className="space-y-3">
        <Link
          href="/app/settings/roles"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Roles
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{role.name}</h1>
          <p className="text-sm text-muted-foreground">
            {role.description ||
              `A custom role with ${role.base_role} access, assignable to a team.`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span className="text-sm">Based on</span>
          </div>
          <p className="mt-1 text-2xl font-semibold capitalize">
            {role.base_role}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Permissions on</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">{enabledCount}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-sm">Assigned members</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">
            {assignedMembers?.length ?? 0}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Permissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inherited from the {role.base_role} role. To give someone different
            access, assign them a role that already matches it.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Module</th>
                {ACTIONS.map((action) => (
                  <th key={action} className="px-4 py-3 font-medium">
                    {label(action)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PERMISSION_MODULES.map((module) => (
                <tr key={module}>
                  <td className="px-4 py-3 font-medium">{label(module)}</td>
                  {ACTIONS.map((action) => {
                    const enabled = permissions[module]?.[action] ?? false;
                    return (
                      <td key={action} className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            enabled
                              ? 'bg-success/10 text-success'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {enabled ? 'Enabled' : 'Off'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Assigned members</h2>
        </div>
        {assignedMembers && assignedMembers.length > 0 ? (
          <div className="divide-y divide-border">
            {assignedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {identities[member.user_id as string]?.name ??
                      'Unknown member'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {identities[member.user_id as string]?.email
                      ? `${identities[member.user_id as string]?.email} · `
                      : ''}
                    Team {teamNameById.get(member.team_id) ?? member.team_id}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(member.joined_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No team members are assigned to this custom role yet.
          </div>
        )}
      </div>
    </div>
  );
}
