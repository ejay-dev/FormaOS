import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Lock, Save } from 'lucide-react';
import { updatePolicy } from '@/app/app/actions/policies';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';

const LOCKED_STATUSES = new Set(['published', 'pending_approval', 'approved']);

export default async function EditPolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const { id: policyId } = await params;
  const db = await createSupabaseServerClient();

  const { data: policy } = await db
    .from('org_policies')
    .select('id, title, content, status, version, created_at, updated_at')
    .eq('id', policyId)
    .eq('organization_id', state.organization.id)
    .maybeSingle();

  if (!policy) notFound();

  const canManage =
    state.role === 'owner' ||
    state.role === 'admin' ||
    state.role === 'member';
  const locked = LOCKED_STATUSES.has(policy.status ?? '');
  const canEdit = canManage && !locked;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Link
            href={`/app/policies/${policy.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to policy
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Policy</h1>
            <p className="text-sm text-muted-foreground">{policy.title}</p>
          </div>
        </div>
        <Link
          href={`/app/policies/${policy.id}/versions`}
          className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Version history
        </Link>
      </div>

      {!canEdit && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-semibold">Editing is not available</p>
              <p className="mt-1 text-xs text-amber-200">
                {locked
                  ? 'This policy is in a controlled lifecycle state. Create a new draft version before making changes.'
                  : 'Your current role can view this policy but cannot edit it.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <form
        action={async (formData) => {
          'use server';
          await updatePolicy(formData);
        }}
        className="space-y-5 rounded-lg border border-border bg-card p-5"
      >
        <input type="hidden" name="policyId" value={policy.id} />

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={policy.title}
            disabled={!canEdit}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={policy.status ?? 'draft'}
            disabled={!canEdit}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm capitalize disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="draft">Draft</option>
            <option value="review">Under review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label htmlFor="content" className="mb-1 block text-sm font-medium">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={18}
            defaultValue={policy.content ?? ''}
            disabled={!canEdit}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/app/policies/${policy.id}`}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!canEdit}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
