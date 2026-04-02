import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Shield, Plus, Users } from 'lucide-react';

export const metadata = { title: 'Roles & Permissions | FormaOS' };

const BASE_ROLES = [
  {
    name: 'Admin',
    description: 'Full access to all modules',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  {
    name: 'Member',
    description: 'Standard access with create and edit',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    name: 'Viewer',
    description: 'Read-only access across modules',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  },
];

export default async function RolesPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();
  const { data: customRoles } = await db
    .from('custom_roles')
    .select('*')
    .eq('org_id', state.organization.id)
    .order('name');

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage default and custom roles for your organization
          </p>
        </div>
        <a
          href="/app/settings/roles/new"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Create Custom Role
        </a>
      </div>

      {/* Base Roles */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" /> Default Roles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BASE_ROLES.map((role) => (
            <div
              key={role.name}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 text-xs rounded font-medium ${role.color}`}
                >
                  {role.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Roles */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" /> Custom Roles
        </h2>
        {customRoles && customRoles.length > 0 ? (
          <div className="space-y-2">
            {customRoles.map(
              (role: {
                id: string;
                name: string;
                base_role: string;
                permissions: Record<string, Record<string, boolean>>;
              }) => {
                const moduleCount = Object.keys(role.permissions || {}).length;
                const permCount = Object.values(role.permissions || {}).reduce(
                  (sum, perms) =>
                    sum + Object.values(perms).filter(Boolean).length,
                  0,
                );
                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {role.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Based on {role.base_role} · {moduleCount} modules ·{' '}
                        {permCount} permissions
                      </p>
                    </div>
                    <a
                      href={`/app/settings/roles/${role.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </a>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No custom roles created yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Custom roles let you fine-tune permissions beyond the default
              admin/member/viewer roles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
