import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPoliciesDueForReview } from '@/lib/policies/policy-engine';
import { FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  StatusBadge,
  documentStatus,
} from '@/components/compliance/StatusBadge';

export const metadata = { title: 'Policy Versions | FormaOS' };

export default async function PolicyVersionsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const db = await createSupabaseServerClient();

  const [{ data: policies }, dueForReview] = await Promise.all([
    db
      .from('policy_versions')
      .select('*')
      .eq('org_id', state.organization.id)
      .order('policy_id')
      .order('version_number', { ascending: false }),
    getPoliciesDueForReview(state.organization.id),
  ]);

  // Group by policy_id, take latest version per policy
  const policyMap = new Map<string, any>();
  for (const p of policies || []) {
    if (!policyMap.has(p.policy_id)) {
      policyMap.set(p.policy_id, p);
    }
  }
  const latestPolicies = Array.from(policyMap.values());

  // Review alerts name the policy, never its row id.
  const titleByPolicyId = new Map<string, string>(
    latestPolicies.map((p) => [p.policy_id as string, p.title as string]),
  );

  const published = latestPolicies.filter(
    (p) => p.status === 'published',
  ).length;
  const drafts = latestPolicies.filter((p) => p.status === 'draft').length;
  const pendingApproval = latestPolicies.filter(
    (p) => p.status === 'pending_approval',
  ).length;

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Version history</h1>
          <p className="page-description">
            Approvals and acknowledgement tracking across every policy version
          </p>
        </div>
        <Link
          href="/app/policies"
          className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Policy Library
        </Link>
      </div>

      <div className="page-content space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />{' '}
            <span className="text-xs">Total policies</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {latestPolicies.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="h-4 w-4" />{' '}
            <span className="text-xs">Published</span>
          </div>
          <p className="text-2xl font-bold text-success">{published}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />{' '}
            <span className="text-xs">Pending approval</span>
          </div>
          <p className="text-2xl font-bold text-warning">
            {pendingApproval}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4" />{' '}
            <span className="text-xs">Due for review</span>
          </div>
          <p className="text-2xl font-bold text-destructive">
            {dueForReview.length}
          </p>
        </div>
      </div>

      {/* Due for Review Alert */}
      {dueForReview.length > 0 && (
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" /> Policies due for review
          </h3>
          <ul className="space-y-1">
            {dueForReview.map(
              (schedule: {
                id: string;
                policy_id: string;
                next_review_date: string;
                review_frequency: string;
              }) => (
                <li key={schedule.id} className="text-xs text-warning">
                  <Link
                    href={`/app/policies/${schedule.policy_id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {titleByPolicyId.get(schedule.policy_id) ?? 'Untitled policy'}
                  </Link>{' '}
                  — due{' '}
                  {new Date(schedule.next_review_date).toLocaleDateString(
                    'en-AU',
                    { day: 'numeric', month: 'short', year: 'numeric' },
                  )}{' '}
                  ({String(schedule.review_frequency).replace(/_/g, ' ')})
                </li>
              ),
            )}
          </ul>
        </div>
      )}

      {/* Policy List */}
      <div className="space-y-2">
        {latestPolicies.map(
          (policy: {
            id: string;
            policy_id: string;
            title: string;
            version_number: number;
            status: string;
            published_at?: string;
            created_at: string;
          }) => (
            <Link
              key={policy.id}
              href={`/app/policies/${policy.policy_id}/versions`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:bg-muted/30"
            >
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  {policy.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  v{policy.version_number} · Created{' '}
                  {new Date(policy.created_at).toLocaleDateString()}
                  {policy.published_at &&
                    ` · Published ${new Date(policy.published_at).toLocaleDateString()}`}
                </p>
              </div>
              <StatusBadge {...documentStatus(policy.status)} />
            </Link>
          ),
        )}
        {latestPolicies.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No policies created yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first policy to start managing versions and approvals
            </p>
          </div>
        )}
      </div>

      {/* Drafts */}
      {drafts > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            Drafts ({drafts})
          </h2>
          <div className="space-y-2">
            {latestPolicies
              .filter((p) => p.status === 'draft')
              .map(
                (policy: {
                  id: string;
                  policy_id: string;
                  title: string;
                  version_number: number;
                  created_at: string;
                }) => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between rounded border border-dashed border-border p-3"
                  >
                    <div>
                      <p className="text-sm text-foreground">{policy.title}</p>
                      <p className="text-xs text-muted-foreground">
                        v{policy.version_number} draft
                      </p>
                    </div>
                    <Link
                      href={`/app/policies/${policy.policy_id}/edit`}
                      className="text-xs text-primary hover:underline"
                    >
                      Continue editing
                    </Link>
                  </div>
                ),
              )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
