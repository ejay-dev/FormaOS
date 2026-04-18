import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createCustomRole } from '@/lib/authz/permission-engine';

export const metadata = { title: 'New Role | FormaOS' };

async function createRole(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const name = String(formData.get('name') ?? '').trim();
  const baseRole = String(formData.get('base_role') ?? 'member');

  if (!name) redirect('/app/settings/roles/new?error=name-required');

  try {
    await createCustomRole(state.organization.id, name, baseRole, {});
    redirect('/app/settings/roles');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create role';
    redirect(`/app/settings/roles/new?error=${encodeURIComponent(message)}`);
  }
}

export default async function NewRolePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings/roles"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Custom Role</h1>
          <p className="text-sm text-muted-foreground">
            Start from a base role — you can refine permissions after creation
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form
        action={createRole}
        className="space-y-4 rounded-lg border border-border bg-card p-5"
      >
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Role name <span className="text-destructive">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="e.g. Compliance Reviewer"
          />
        </div>
        <div>
          <label htmlFor="base_role" className="mb-1 block text-sm font-medium">
            Base role
          </label>
          <select
            id="base_role"
            name="base_role"
            defaultValue="member"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="viewer">Viewer — read-only</option>
            <option value="member">Member — standard access</option>
            <option value="admin">Admin — full module access</option>
          </select>
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="When this role should be assigned"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/app/settings/roles"
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Role
          </button>
        </div>
      </form>
    </div>
  );
}
