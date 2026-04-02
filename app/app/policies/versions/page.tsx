import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPoliciesDueForReview } from '@/lib/policies/policy-engine';
import { FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export const metadata = { title: 'Policy Versions | FormaOS' };

export default async function PolicyVersionsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

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
  const policyMap = new Map<
    string,
    typeof policies extends (infer T)[] ? T : never
  >();
  for (const p of policies || []) {
    if (!policyMap.has(p.policy_id)) {
      policyMap.set(p.policy_id, p);
    }
  }
  const latestPolicies = Array.from(policyMap.values());

  const published = latestPolicies.filter(
    (p) => p.status === 'published',
  ).length;
  const drafts = latestPolicies.filter((p) => p.status === 'draft').length;
  const pendingApproval = latestPolicies.filter(
    (p) => p.status === 'pending_approval',
  ).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Policy Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Version control, approvals, and acknowledgment tracking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />{' '}
            <span className="text-xs">Total Policies</span>
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
          <p className="text-2xl font-bold text-green-600">{published}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />{' '}
            <span className="text-xs">Pending Approval</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {pendingApproval}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4" />{' '}
            <span className="text-xs">Due for Review</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {dueForReview.length}
          </p>
        </div>
      </div>

      {/* Due for Review Alert */}
      {dueForReview.length > 0 && (
        <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Policies Due for Review
          </h3>
          <div className="space-y-1">
            {dueForReview.map(
              (schedule: {
                id: string;
                policy_id: string;
                next_review_date: string;
                review_frequency: string;
              }) => (
                <div
                  key={schedule.id}
                  className="text-xs text-yellow-700 dark:text-yellow-400"
                >
                  Policy {schedule.policy_id.slice(0, 8)}… — Due{' '}
                  {schedule.next_review_date} ({schedule.review_frequency})
                </div>
              ),
            )}
          </div>
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
            <a
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
              <span
                className={`px-2 py-0.5 text-xs rounded ${
                  policy.status === 'published'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : policy.status === 'pending_approval'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : policy.status === 'draft'
                        ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                }`}
              >
                {policy.status.replace('_', ' ')}
              </span>
            </a>
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
                    <a
                      href={`/app/policies/${policy.policy_id}/edit`}
                      className="text-xs text-primary hover:underline"
                    >
                      Continue editing
                    </a>
                  </div>
                ),
              )}
          </div>
        </div>
      )}
    </div>
  );
}
