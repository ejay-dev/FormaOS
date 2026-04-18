import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'New CAPA | FormaOS' };

async function createCapa(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const priority = String(formData.get('priority') ?? 'medium');
  const dueDate = String(formData.get('due_date') ?? '').trim();

  if (!title) redirect('/app/capa/new?error=title-required');

  const db = await createSupabaseServerClient();
  const { error } = await db.from('org_capa_items').insert({
    organization_id: state.organization.id,
    title,
    description: description || null,
    priority,
    status: 'open',
    due_date: dueDate || null,
    created_by: state.user.id,
  });

  if (error) redirect(`/app/capa/new?error=${encodeURIComponent(error.message)}`);
  redirect('/app/capa');
}

export default async function NewCapaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');
  const { error } = await searchParams;

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link
            href="/app/capa"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div>
            <h1 className="page-title">New CAPA</h1>
            <p className="page-description">
              Log a corrective or preventive action
            </p>
          </div>
        </div>
      </div>

      <div className="page-content max-w-2xl">
        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <form action={createCapa} className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Short description of the corrective action"
            />
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Root cause, planned action, owner, acceptance criteria"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="priority" className="mb-1 block text-sm font-medium">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue="medium"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label htmlFor="due_date" className="mb-1 block text-sm font-medium">
                Due date
              </label>
              <input
                id="due_date"
                name="due_date"
                type="date"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Link
              href="/app/capa"
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create CAPA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
