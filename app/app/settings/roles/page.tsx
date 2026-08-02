import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';

import {
  SettingsPageHeader,
  SettingsPageShell,
} from '@/components/settings/settings-page-header';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'Roles | Settings | FormaOS' };

const BASE_ROLES = [
  {
    name: 'Owner',
    description:
      'Everything an admin can do, plus billing and transferring ownership.',
  },
  {
    name: 'Admin',
    description: 'Full access to every module, including team and settings.',
  },
  {
    name: 'Member',
    description: 'Create and edit records across the modules they work in.',
  },
  {
    name: 'Viewer',
    description: 'Read-only access across modules.',
  },
];

export default async function RolesPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const db = await createSupabaseServerClient();
  const { data: customRoles } = await db
    .from('custom_roles')
    .select('*')
    .eq('org_id', state.organization.id)
    .order('name');

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        title="Roles"
        description="The four built-in roles, plus any custom roles you assign to a team."
        action={
          <Link
            href="/app/settings/roles/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" />
            Create custom role
          </Link>
        }
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Built-in roles</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BASE_ROLES.map((role) => (
            <div
              key={role.name}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="text-sm font-medium text-foreground">{role.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {role.description}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Change a person&apos;s role on the{' '}
          <Link
            href="/app/team"
            className="font-medium text-primary hover:text-primary/80"
          >
            Team page
          </Link>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Custom roles</h2>
        {customRoles && customRoles.length > 0 ? (
          <div className="space-y-2">
            {customRoles.map(
              (role: {
                id: string;
                name: string;
                base_role: string;
                description: string | null;
                permissions: Record<string, Record<string, boolean>>;
              }) => {
                const overrideCount = Object.values(
                  role.permissions || {},
                ).reduce(
                  (sum, actions) => sum + Object.keys(actions ?? {}).length,
                  0,
                );
                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {role.name}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {role.description
                          ? `${role.description} · `
                          : ''}
                        Starts from {role.base_role} access
                        {overrideCount > 0
                          ? ` with ${overrideCount} adjustment${overrideCount === 1 ? '' : 's'}`
                          : ''}
                      </p>
                    </div>
                    <Link
                      href={`/app/settings/roles/${role.id}`}
                      className="shrink-0 text-sm font-medium text-primary hover:text-primary/80"
                    >
                      View
                    </Link>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-foreground">No custom roles yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A custom role copies one of the built-in roles under a name that
              matches the job, so you can assign it to a team.
            </p>
          </div>
        )}
      </section>
    </SettingsPageShell>
  );
}
