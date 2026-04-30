import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ChevronLeft, Save, ShieldCheck, History } from 'lucide-react';
import Link from 'next/link';
import {
  approvePolicy,
  rejectPolicy,
  submitPolicyForReview,
  updatePolicy,
} from '@/app/app/actions/policies';
import { ArtifactSidebar } from '@/components/policies/artifact-sidebar';
import { getLatestVersion } from '@/lib/policies/lifecycle';

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

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Link
          href="/app/policies"
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Policy Library
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <History className="h-3 w-3" />
            <span>
              Last modified:{' '}
              {new Date(
                policy.last_updated_at || policy.created_at,
              ).toLocaleDateString()}
            </span>
          </div>
          <div className="h-4 w-px bg-glass-strong" />
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-400/10 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-400/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Template
          </div>
        </div>
      </div>

      {/* Main Form Surface */}
      {/* Main Form Surface */}
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
            <div className="bg-surface-1 border border-edge-2 rounded-[2rem] shadow-sm overflow-hidden flex flex-col h-[70vh] md:h-[800px]">
              <div className="p-6 sm:p-8 border-b border-edge-2 bg-surface-1">
                <input
                  name="title"
                  defaultValue={policy.title}
                  disabled={!isAdmin}
                  placeholder="Policy Title..."
                  className="w-full bg-transparent text-2xl sm:text-3xl font-black text-foreground outline-none placeholder:text-muted-foreground tracking-tight disabled:opacity-50"
                />
              </div>
              <div className="p-6 sm:p-8 flex-1">
                <textarea
                  name="content"
                  defaultValue={policy.content}
                  disabled={!isAdmin}
                  placeholder="# Write your policy content here..."
                  className="w-full h-full bg-transparent text-sm leading-relaxed text-muted-foreground outline-none resize-none font-mono disabled:opacity-50"
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
            <div className="bg-surface-1 border border-edge-2 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-8 md:sticky md:top-6">
              <div className="space-y-3">
                <label
                  htmlFor="field-206"
                  className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em] ml-1"
                >
                  Lifecycle Stage
                </label>
                <div className="relative">
                  <select
                    name="status" // Ensure our Server Action handles 'status' update if intended
                    defaultValue={policy.status}
                    disabled={!isAdmin}
                    className="w-full p-4 rounded-2xl border border-edge-2 text-xs font-black bg-glass-strong cursor-pointer outline-none focus:bg-surface-1 focus:ring-2 focus:ring-sky-500/20 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="draft">Drafting Mode</option>
                    <option value="review">Under Review</option>
                    <option value="published">Active & Enforced</option>
                    <option value="archived">Archived</option>
                  </select>
                  <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-4 py-6 border-y border-edge-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Version</span>
                  <span className="text-foreground bg-glass-strong px-2 py-1 rounded-lg">
                    {latestVersion
                      ? `v${latestVersion.version_number}`
                      : policy.version || 'v1.0'}
                  </span>
                </div>
                {latestVersion ? (
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground">Lifecycle</span>
                    <span className="text-foreground bg-glass-strong px-2 py-1 rounded-lg">
                      {latestVersion.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">Governance ID</span>
                  <span className="font-mono text-muted-foreground">
                    POL-{policy.id.slice(0, 4).toUpperCase()}
                  </span>
                </div>
              </div>

              {isAdmin ? (
                <button
                  type="submit"
                  className="w-full bg-glass-strong text-foreground py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-glass-strong transition-all shadow-xl motion-safe:active:scale-95 group"
                >
                  <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Save Draft
                </button>
              ) : (
                <div className="p-4 bg-glass-strong rounded-2xl border border-edge-2 text-xs font-black text-muted-foreground text-center uppercase tracking-widest flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Read Only Mode
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
        <div className="mt-6 bg-surface-1 border border-edge-2 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Approval Workflow
              </p>
              <p className="text-sm text-foreground">
                Latest version{' '}
                <span className="font-mono">v{latestVersion.version_number}</span>{' '}
                is currently{' '}
                <span className="font-bold">
                  {latestVersion.status.replace(/_/g, ' ')}
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
                    className="bg-glass-strong text-foreground px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-glass-strong transition-all shadow-sm motion-safe:active:scale-95"
                  >
                    Submit for Review
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
                      className="text-xs px-3 py-2 rounded-xl border border-edge-2 bg-glass-strong text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-emerald-400/40"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-500/15 text-emerald-700 border border-emerald-400/40 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500/25 transition-all motion-safe:active:scale-95"
                    >
                      Approve & Publish
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
                      className="text-xs px-3 py-2 rounded-xl border border-edge-2 bg-glass-strong text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-rose-400/40"
                    />
                    <button
                      type="submit"
                      className="bg-rose-500/15 text-rose-700 border border-rose-400/40 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500/25 transition-all motion-safe:active:scale-95"
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
    </div>
  );
}
