import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  isMissingSupabaseColumnError,
  isMissingSupabaseTableError,
} from '@/lib/supabase/schema-compat';
import { createCapa } from '../actions';
import { SubmitButton } from '@/components/ui/submit-button';

export const metadata = { title: 'New CAPA | FormaOS' };

type SearchParams = {
  error?: string;
  source_type?: string;
  source_id?: string;
  incident_id?: string;
  title?: string;
};

type MemberOption = {
  user_id: string;
  role: string | null;
};

const SUPPORTED_SOURCE_TYPES = ['incident', 'obligation', 'policy'] as const;

function normalizeSourceType(params: SearchParams) {
  if (params.incident_id) return 'incident';
  return SUPPORTED_SOURCE_TYPES.includes(
    params.source_type as (typeof SUPPORTED_SOURCE_TYPES)[number],
  )
    ? params.source_type!
    : 'manual';
}

async function getMemberOptions(db: ReturnType<typeof createSupabaseAdminClient>, orgId: string) {
  const { data: members } = await db
    .from('org_members')
    .select('user_id, role')
    .eq('organization_id', orgId)
    .order('role');

  const memberRows = (members ?? []) as MemberOption[];
  const profileIds = memberRows.map((member) => member.user_id);
  const { data: profiles } =
    profileIds.length > 0
      ? await db
          .from('user_profiles')
          .select('user_id, full_name')
          .in('user_id', profileIds)
      : { data: [] as { user_id?: string; full_name?: string | null }[] };

  const profileNameById = new Map(
    (profiles ?? []).map((profile) => [
      profile.user_id as string,
      (profile.full_name as string | null)?.trim() || (profile.user_id as string).slice(0, 8),
    ]),
  );

  return memberRows.map((member) => ({
    userId: member.user_id,
    role: member.role ?? 'member',
    label: profileNameById.get(member.user_id) ?? member.user_id.slice(0, 8),
  }));
}

export default async function NewCapaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');
  const params = await searchParams;
  const db = createSupabaseAdminClient();
  const { error: schemaError } = await db
    .from('org_capa_items')
    .select('id, severity, owner_id, source_type, source_id, root_cause, corrective_action, preventive_action, verification_notes')
    .eq('organization_id', state.organization.id)
    .limit(1);
  const capaUnavailable =
    isMissingSupabaseTableError(schemaError, 'org_capa_items') ||
    isMissingSupabaseColumnError(schemaError, 'org_capa_items');

  const canAuthor = ['owner', 'admin'].includes(state.role);
  const memberOptions = capaUnavailable ? [] : await getMemberOptions(db, state.organization.id);
  const sourceType = normalizeSourceType(params);
  const sourceId = params.source_id || params.incident_id || '';
  const suggestedTitle =
    params.title ||
    (sourceType !== 'manual' && sourceId
      ? `CAPA from ${sourceType}`
      : '');

  return (
    <div className="flex h-full flex-col">
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
              Log a corrective or preventive action with owner, due date, and source context
            </p>
          </div>
        </div>
      </div>

      <div className="page-content max-w-3xl">
        {capaUnavailable && (
          <div
            className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground"
            data-testid="capa-create-disabled"
          >
            <div className="flex items-center gap-2 font-medium text-foreground">
              <Lock className="h-4 w-4" />
              CAPA creation unavailable
            </div>
            <p className="mt-2">
              Apply the CAPA lifecycle migration before creating CAPA records
              in this workspace.
            </p>
          </div>
        )}

        {!capaUnavailable && !canAuthor && (
          <div
            className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground"
            data-testid="capa-create-disabled"
          >
            CAPA creation requires an admin or manager role. Viewer access is
            read-only.
          </div>
        )}

        {!capaUnavailable && canAuthor && params.error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {params.error}
          </div>
        )}

        {!capaUnavailable && canAuthor && (
          <form
            action={createCapa}
            className="space-y-4 rounded-lg border border-border bg-card p-5"
            data-testid="capa-create-form"
          >
            <input type="hidden" name="source_type" value={sourceType} />
            <input type="hidden" name="source_id" value={sourceId} />
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={suggestedTitle}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Short description of the corrective or preventive action"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="Context, expected outcome, acceptance criteria, or initial notes"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="type" className="mb-1 block text-sm font-medium">
                  Action type
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue="corrective"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="corrective">Corrective</option>
                  <option value="preventive">Preventive</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="severity"
                  className="mb-1 block text-sm font-medium"
                >
                  Severity
                </label>
                <select
                  id="severity"
                  name="severity"
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
                <label
                  htmlFor="owner_id"
                  className="mb-1 block text-sm font-medium"
                >
                  Owner
                </label>
                <select
                  id="owner_id"
                  name="owner_id"
                  defaultValue={state.user.id}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Unassigned</option>
                  {memberOptions.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.label} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="due_date"
                  className="mb-1 block text-sm font-medium"
                >
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
            {sourceType !== 'manual' && sourceId && (
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                This CAPA will be linked to the selected {sourceType}.
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Link
                href="/app/capa"
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                Cancel
              </Link>
              <SubmitButton
                size="md"
                fullWidth={false}
                showArrow={false}
                loadingText="Creating…"
                className="rounded-md px-4"
              >
                Create CAPA
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
