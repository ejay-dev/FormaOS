import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  History,
  Save,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import {
  acknowledgePolicyVersion,
  approvePolicy,
  rejectPolicy,
  schedulePolicyReview,
  submitPolicyForReview,
  updatePolicy,
} from '@/app/app/actions/policies';
import { ArtifactSidebar } from '@/components/policies/artifact-sidebar';
import { getLatestVersion } from '@/lib/policies/lifecycle';
import { getOrgMemberIdentities } from '@/lib/team/member-identity';
import {
  StatusBadge,
  documentStatus,
} from '@/components/compliance/StatusBadge';

export default async function PolicyDetailPage({
  params,
}: {
  params?: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const policyId = resolvedParams?.id ?? '';
  if (!policyId) return notFound();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return notFound();

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) return notFound();

  // 1. Fetch Policy (org-scoped)
  const { data: policy, error: policyError } = await supabase
    .from('org_policies')
    .select('*')
    .eq('id', policyId)
    .eq('organization_id', membership.organization_id)
    .maybeSingle();

  if (policyError) {
    console.error('[policies] fetch failed', policyError);
  }

  if (!policy) notFound();

  // 2. Fetch linked evidence for this policy
  const { data: evidence } = await supabase
    .from('org_evidence')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .or(`policy_id.eq.${policyId},linked_policy_id.eq.${policyId}`);

  // 3. Fetch Vault browser items (for the sidebar)
  const { data: vaultItems } = await supabase
    .from('org_evidence')
    .select('*')
    .eq('organization_id', membership.organization_id);

  const isAdmin = membership?.role === 'admin' || membership?.role === 'owner';

  // 4. Lifecycle state — latest policy_version row drives the Submit/
  // Approve/Reject controls. Best-effort; if the lifecycle tables aren't
  // populated yet we fall back to legacy controls.
  let latestVersion: Awaited<ReturnType<typeof getLatestVersion>> = null;
  try {
    latestVersion = await getLatestVersion(supabase, policyId);
  } catch (lifecycleErr) {
    console.warn('[policies/[id]] lifecycle fetch failed:', lifecycleErr);
  }

  const lifecycleStatus = latestVersion?.status ?? null;
  const canSubmit = isAdmin && lifecycleStatus === 'draft';
  const isAuthorOfPending =
    latestVersion?.status === 'pending_approval' &&
    latestVersion.created_by === user.id;
  const canDecide =
    isAdmin && lifecycleStatus === 'pending_approval' && !isAuthorOfPending;

  const [
    { count: acknowledgmentCount },
    { count: memberCount },
    { data: myAcknowledgment },
    { data: approvalRows },
    { data: reviewSchedule },
    { data: reviewerRows },
  ] = latestVersion
    ? await Promise.all([
        supabase
          .from('policy_acknowledgments')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', membership.organization_id)
          .eq('policy_version_id', latestVersion.id),
        supabase
          .from('org_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', membership.organization_id),
        supabase
          .from('policy_acknowledgments')
          .select('id, acknowledged_at')
          .eq('org_id', membership.organization_id)
          .eq('policy_version_id', latestVersion.id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('policy_approvals')
          .select('id, approver_id, decision, comment, decided_at, created_at')
          .eq('org_id', membership.organization_id)
          .eq('policy_version_id', latestVersion.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('policy_review_schedules')
          .select('id, review_frequency, next_review_date, last_reviewed_at, reviewer_ids')
          .eq('org_id', membership.organization_id)
          .eq('policy_id', policyId)
          .maybeSingle(),
        supabase
          .from('org_members')
          .select('user_id, role, compliance_status')
          .eq('organization_id', membership.organization_id)
          .eq('compliance_status', 'active')
          .order('role', { ascending: true }),
      ])
    : [
        { count: 0 },
        { count: 0 },
        { data: null },
        { data: [] },
        { data: null },
        { data: [] },
      ];

  const identities = await getOrgMemberIdentities();

  const totalPolicyMembers = memberCount ?? 0;
  const acknowledgedPolicies = acknowledgmentCount ?? 0;
  const acknowledgmentPercent =
    totalPolicyMembers > 0
      ? Math.round((acknowledgedPolicies / totalPolicyMembers) * 100)
      : 0;
  const canAcknowledge =
    latestVersion?.status === 'published' && !myAcknowledgment;

  return (
    <div className="space-y-6 pb-20">
      <div className="page-header flex-col items-start gap-3 px-0 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <Link
            href="/app/policies"
            className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Policy Library
          </Link>
          <h1 className="page-title mt-1 truncate">{policy.title}</h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <History className="h-3.5 w-3.5" />
          <span>
            Last modified{' '}
            {new Date(
              policy.last_updated_at || policy.created_at,
            ).toLocaleDateString()}
          </span>
        </div>
      </div>

      <form
        action={async (formData) => {
          'use server';
          await updatePolicy(formData);
        }}
      >
        {/* CRITICAL: The Server Action needs the ID to function. 
            We pass it securely as a hidden field. 
        */}
        <input type="hidden" name="policyId" value={policy.id} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-[70vh] md:h-[800px]">
              <div className="p-4 sm:p-5 border-b border-border">
                <label
                  htmlFor="policy-title"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Title
                </label>
                <input
                  id="policy-title"
                  name="title"
                  defaultValue={policy.title}
                  disabled={!isAdmin}
                  placeholder="Policy title"
                  className="mt-1 w-full bg-transparent text-xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
                />
              </div>
              <div className="p-4 sm:p-5 flex-1">
                <textarea
                  name="content"
                  defaultValue={policy.content}
                  disabled={!isAdmin}
                  placeholder="Write the policy content here"
                  aria-label="Policy content"
                  className="w-full h-full bg-transparent text-sm leading-relaxed text-foreground outline-none resize-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Configuration & Artifacts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Artifact Browser (Imported Component) */}
            <ArtifactSidebar
              policyId={policy.id}
              linkedArtifacts={evidence || []}
              allVaultItems={vaultItems || []}
              readOnly={!isAdmin}
            />

            {/* Document Controls */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-5 md:sticky md:top-6">
              <div className="space-y-2">
                <label
                  htmlFor="policy-status"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Lifecycle stage
                </label>
                <div className="relative">
                  <select
                    id="policy-status"
                    name="status"
                    defaultValue={policy.status}
                    disabled={!isAdmin}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">In review</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                  <ShieldCheck className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="flex flex-col gap-2 border-y border-border py-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {latestVersion
                      ? `v${latestVersion.version_number}`
                      : policy.version || 'v1.0'}
                  </span>
                </div>
                {latestVersion ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lifecycle</span>
                    <StatusBadge {...documentStatus(latestVersion.status)} />
                  </div>
                ) : null}
              </div>

              {isAdmin ? (
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save draft
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Read only
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Lifecycle controls — separate forms because each posts a different
          server action. Visible only when there's a versioned lifecycle row
          (i.e., createPolicy/updatePolicy seeded one) and the user has the
          right role. */}
      {latestVersion ? (
        <div className="mt-6 bg-card border border-border rounded-xl p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Approval workflow
              </p>
              <p className="text-sm text-muted-foreground">
                Latest version v{latestVersion.version_number} is currently{' '}
                <span className="font-medium text-foreground">
                  {documentStatus(latestVersion.status).label.toLowerCase()}
                </span>
                .
                {isAuthorOfPending
                  ? ' You authored this version, so a different owner or admin must approve it.'
                  : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {canSubmit ? (
                <form
                  action={async (formData) => {
                    'use server';
                    await submitPolicyForReview(formData);
                  }}
                >
                  <input type="hidden" name="policyId" value={policy.id} />
                  <button
                    type="submit"
                    className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Submit for review
                  </button>
                </form>
              ) : null}

              {canDecide ? (
                <>
                  <form
                    action={async (formData) => {
                      'use server';
                      await approvePolicy(formData);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="policyId" value={policy.id} />
                    <input
                      type="text"
                      name="comment"
                      placeholder="Approval note (optional)"
                      aria-label="Approval note"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm font-medium text-success transition-colors hover:bg-success/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Approve and publish
                    </button>
                  </form>
                  <form
                    action={async (formData) => {
                      'use server';
                      await rejectPolicy(formData);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="policyId" value={policy.id} />
                    <input
                      type="text"
                      name="comment"
                      placeholder="Rejection reason"
                      aria-label="Rejection reason"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Reject
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {latestVersion ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Staff acknowledgement
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Published policies collect named staff sign-off for audit
                  evidence.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted px-3 py-2 text-right">
                <p className="text-xl font-semibold tabular-nums text-foreground">
                  {acknowledgmentPercent}%
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {acknowledgedPolicies}/{totalPolicyMembers}
                </p>
              </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success"
                style={{ width: `${acknowledgmentPercent}%` }}
              />
            </div>

            {myAcknowledgment ? (
              <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  You acknowledged this version on{' '}
                  {new Date(
                    String(myAcknowledgment.acknowledged_at),
                  ).toLocaleDateString()}
                  .
                </span>
              </div>
            ) : canAcknowledge ? (
              <form
                action={async (formData) => {
                  'use server';
                  await acknowledgePolicyVersion(formData);
                }}
              >
                <input type="hidden" name="policyId" value={policy.id} />
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-success/20 bg-success/10 px-4 py-2 text-sm font-medium text-success transition-colors hover:bg-success/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Acknowledge current version
                </button>
              </form>
            ) : (
              <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                Acknowledgement opens after the policy is approved and
                published.
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Review decisions
              </p>
              {(approvalRows ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(approvalRows ?? []).map(
                    (approval: {
                      id: string;
                      approver_id: string;
                      decision: string | null;
                      comment: string | null;
                      decided_at: string | null;
                    }) => (
                      <div
                        key={approval.id}
                        className="rounded-lg border border-border bg-muted px-3 py-2 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-foreground">
                            {identities[approval.approver_id]?.name ??
                              'Unknown member'}
                          </span>
                          <StatusBadge
                            {...(approval.decision === 'approved'
                              ? { label: 'Approved', tone: 'success' as const }
                              : approval.decision === 'rejected'
                                ? { label: 'Rejected', tone: 'danger' as const }
                                : { label: 'Pending', tone: 'neutral' as const })}
                          />
                        </div>
                        {approval.comment ? (
                          <p className="mt-2 text-muted-foreground">
                            {approval.comment}
                          </p>
                        ) : null}
                        {approval.decided_at ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {new Date(approval.decided_at).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No review decision has been recorded for this version yet.
                </p>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Review schedule
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Set when this policy comes back for review and who signs it
                  off.
                </p>
              </div>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Next review</span>
                <span className="font-semibold text-foreground">
                  {reviewSchedule?.next_review_date
                    ? new Date(
                        String(reviewSchedule.next_review_date),
                      ).toLocaleDateString()
                    : 'Not scheduled'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Cadence</span>
                <span className="font-semibold text-foreground">
                  {reviewSchedule?.review_frequency
                    ? String(reviewSchedule.review_frequency).replace('_', ' ')
                    : 'None'}
                </span>
              </div>
            </div>

            {isAdmin ? (
              <form
                action={async (formData) => {
                  'use server';
                  await schedulePolicyReview(formData);
                }}
                className="space-y-4"
              >
                <input type="hidden" name="policyId" value={policy.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium text-muted-foreground">
                    <span>Frequency</span>
                    <select
                      name="frequency"
                      defaultValue={
                        String(reviewSchedule?.review_frequency ?? 'annual')
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
                    >
                      <option value="quarterly">Quarterly</option>
                      <option value="semi_annual">Semi annual</option>
                      <option value="annual">Annual</option>
                      <option value="biennial">Biennial</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-medium text-muted-foreground">
                    <span>Next review</span>
                    <input
                      type="date"
                      name="nextReviewDate"
                      required
                      defaultValue={
                        reviewSchedule?.next_review_date
                          ? String(reviewSchedule.next_review_date)
                          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                              .toISOString()
                              .slice(0, 10)
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Reviewers
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(reviewerRows ?? []).map(
                      (reviewer: { user_id: string; role: string | null }) => {
                        const selected = Array.isArray(
                          reviewSchedule?.reviewer_ids,
                        )
                          ? reviewSchedule.reviewer_ids.includes(
                              reviewer.user_id,
                            )
                          : false;
                        return (
                          <label
                            key={reviewer.user_id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              name="reviewerIds"
                              value={reviewer.user_id}
                              defaultChecked={selected}
                              className="h-3.5 w-3.5"
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium">
                                {identities[reviewer.user_id]?.name ??
                                  'Unknown member'}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {identities[reviewer.user_id]?.email
                                  ? `${identities[reviewer.user_id]?.email} · `
                                  : ''}
                                {reviewer.role ?? 'member'}
                              </span>
                            </span>
                          </label>
                        );
                      },
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  Save review schedule
                </button>
              </form>
            ) : (
              <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                Review schedules are managed by owners and admins.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
