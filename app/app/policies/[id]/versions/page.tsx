import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  History,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/system-state/server';

function statusClass(status: string) {
  switch (status) {
    case 'published':
    case 'approved':
      return 'border-success/20 bg-success/10 text-success';
    case 'pending_approval':
    case 'review':
      return 'border-warning/20 bg-warning/10 text-warning';
    case 'archived':
      return 'border-border bg-muted/10 text-muted-foreground';
    default:
      return 'border-info/20 bg-info/10 text-info';
  }
}

export default async function PolicyVersionHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const { id: policyId } = await params;
  const db = await createSupabaseServerClient();

  const { data: policy } = await db
    .from('org_policies')
    .select('id, title, content, status, version, created_at, updated_at')
    .eq('id', policyId)
    .eq('organization_id', state.organization.id)
    .maybeSingle();

  if (!policy) notFound();

  const [{ data: versions }, { count: acknowledgments }, { data: schedule }] =
    await Promise.all([
      db
        .from('policy_versions')
        .select(
          'id, version_number, title, change_summary, status, published_at, created_at',
        )
        .eq('org_id', state.organization.id)
        .eq('policy_id', policyId)
        .order('version_number', { ascending: false }),
      db
        .from('policy_acknowledgments')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', state.organization.id)
        .eq('policy_id', policyId),
      db
        .from('policy_review_schedules')
        .select('review_frequency, next_review_date, last_reviewed_at')
        .eq('org_id', state.organization.id)
        .eq('policy_id', policyId)
        .maybeSingle(),
    ]);

  const rows =
    versions && versions.length > 0
      ? versions
      : [
          {
            id: policy.id,
            version_number: Number(
              String(policy.version ?? '1').replace(/[^0-9]/g, '') || 1,
            ),
            title: policy.title,
            change_summary:
              'Current policy record. No lifecycle versions have been recorded yet.',
            status: policy.status ?? 'draft',
            published_at: null,
            created_at: policy.created_at,
          },
        ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Link
            href="/app/policies/versions"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Policy versions
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{policy.title}</h1>
            <p className="text-sm text-muted-foreground">
              Version history, acknowledgments, and review schedule.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/policies/${policy.id}`}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Open policy
          </Link>
          <Link
            href={`/app/policies/${policy.id}/edit`}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <History className="h-4 w-4" />
            <span className="text-xs font-medium">Versions</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">{rows.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Acknowledgments</span>
          </div>
          <p className="mt-1 text-2xl font-semibold">
            {acknowledgments ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs font-medium">Next Review</span>
          </div>
          <p className="mt-1 text-sm font-semibold">
            {schedule?.next_review_date
              ? new Date(schedule.next_review_date).toLocaleDateString()
              : 'Not scheduled'}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold">Version History</h2>
        </div>
        <div className="divide-y divide-border">
          {rows.map((version) => (
            <div
              key={version.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="truncate text-sm font-medium">
                    v{version.version_number} - {version.title}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created {new Date(version.created_at).toLocaleDateString()}
                  {version.published_at
                    ? ` - Published ${new Date(version.published_at).toLocaleDateString()}`
                    : ''}
                </p>
                {version.change_summary && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {version.change_summary}
                  </p>
                )}
              </div>
              <span
                className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusClass(
                  version.status,
                )}`}
              >
                {String(version.status).replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
