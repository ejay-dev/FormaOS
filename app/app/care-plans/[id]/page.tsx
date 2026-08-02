import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  ArrowLeft,
  Target,
  Calendar,
  StickyNote,
  History,
  CheckCircle2,
  Circle,
  Clock3,
  Trash2,
  PlusCircle,
  NotebookPen,
  ListChecks,
} from 'lucide-react';
import {
  createGoal,
  updateGoal,
  deleteGoal,
  createSupport,
  updateSupport,
  deleteSupport,
  updateCarePlanStatus,
  syncCarePlanProgress,
} from '@/app/app/actions/care-operations';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import {
  computePlanProgress,
  normalizeGoal,
  normalizeSupport,
  type CareGoal,
  type CareSupport,
} from '@/lib/care-plans/normalize';
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner';
import { ConfirmActionButton } from '@/components/care/confirm-action-button';
import {
  CARE_PLAN_STATUS_CLASSES,
  CARE_PLAN_STATUS_LABELS,
  normaliseCarePlanStatus,
} from '@/components/care/care-plan-status';

export const metadata = { title: 'Care Plan Detail | FormaOS' };
export const dynamic = 'force-dynamic';

type GoalStatus = CareGoal['status'];
type SupportStatus = CareSupport['status'];

async function addGoalAction(planId: string, formData: FormData) {
  'use server';
  const result = await createGoal(planId, formData);
  if (result && 'success' in result && result.success) {
    await syncCarePlanProgress(planId);
  }
  revalidatePath(`/app/care-plans/${planId}`);
  redirect(`/app/care-plans/${planId}`);
}

async function updateGoalStatusAction(planId: string, formData: FormData) {
  'use server';
  const goalId = String(formData.get('goal_id') ?? '');
  const status = String(formData.get('status') ?? '') as GoalStatus;
  if (!goalId || !status) return;
  await updateGoal(planId, goalId, { status });
  await syncCarePlanProgress(planId);
  revalidatePath(`/app/care-plans/${planId}`);
  redirect(`/app/care-plans/${planId}`);
}

async function editGoalAction(planId: string, formData: FormData) {
  'use server';
  const goalId = String(formData.get('goal_id') ?? '');
  if (!goalId) return;
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const targetDate = String(formData.get('target_date') ?? '').trim();
  const patch: {
    title?: string;
    description?: string | null;
    target_date?: string | null;
  } = {};
  if (title) patch.title = title;
  patch.description = description || null;
  patch.target_date = targetDate || null;
  await updateGoal(planId, goalId, patch);
  revalidatePath(`/app/care-plans/${planId}`);
  redirect(`/app/care-plans/${planId}`);
}

async function deleteGoalAction(planId: string, formData: FormData) {
  'use server';
  const goalId = String(formData.get('goal_id') ?? '');
  if (!goalId) return;
  await deleteGoal(planId, goalId);
  revalidatePath(`/app/care-plans/${planId}`);
  redirect(`/app/care-plans/${planId}`);
}

async function addSupportAction(planId: string, formData: FormData) {
  'use server';
  await createSupport(planId, formData);
  revalidatePath(`/app/care-plans/${planId}`);
  redirect(`/app/care-plans/${planId}`);
}

async function updateSupportStatusAction(planId: string, formData: FormData) {
  'use server';
  const supportId = String(formData.get('support_id') ?? '');
  const status = String(formData.get('status') ?? '') as SupportStatus;
  if (!supportId || !status) return;
  await updateSupport(planId, supportId, { status });
  revalidatePath(`/app/care-plans/${planId}`);
  redirect(`/app/care-plans/${planId}`);
}

async function deleteSupportAction(planId: string, formData: FormData) {
  'use server';
  const supportId = String(formData.get('support_id') ?? '');
  if (!supportId) return;
  await deleteSupport(planId, supportId);
  revalidatePath(`/app/care-plans/${planId}`);
  redirect(`/app/care-plans/${planId}`);
}

async function transitionPlanAction(planId: string, formData: FormData) {
  'use server';
  const status = String(formData.get('status') ?? '');
  if (!status) return;
  await updateCarePlanStatus(planId, status);
  revalidatePath(`/app/care-plans/${planId}`);
  redirect(`/app/care-plans/${planId}`);
}

export default async function CarePlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const { id } = await params;
  const db = await createSupabaseServerClient();

  const { data: plan } = await db
    .from('org_care_plans')
    .select(
      'id, organization_id, client_id, title, description, status, plan_type, start_date, end_date, review_date, goals, supports, created_at, updated_at',
    )
    .eq('id', id)
    .eq('organization_id', state.organization.id)
    .maybeSingle();

  if (!plan) notFound();

  const { data: participant } = plan.client_id
    ? await db
        .from('org_patients')
        .select('id, full_name, external_id, care_status')
        .eq('id', plan.client_id)
        .eq('organization_id', state.organization.id)
        .maybeSingle()
    : { data: null };

  const goals: CareGoal[] = Array.isArray(plan.goals)
    ? (plan.goals as unknown[]).map(normalizeGoal)
    : [];
  const supports: CareSupport[] = Array.isArray(plan.supports)
    ? (plan.supports as unknown[]).map(normalizeSupport)
    : [];

  const planProgress = computePlanProgress(goals);
  const achievedCount = goals.filter((g) => g.status === 'achieved').length;

  const { data: progressNotes } = plan.client_id
    ? await db
        .from('org_progress_notes')
        .select('id, note_text, status_tag, created_at')
        .eq('patient_id', plan.client_id)
        .eq('organization_id', state.organization.id)
        .order('created_at', { ascending: false })
        .limit(5)
    : { data: [] };

  const { data: visits } = plan.client_id
    ? await db
        .from('org_visits')
        .select('id, visit_type, service_category, scheduled_start, status')
        .eq('client_id', plan.client_id)
        .eq('organization_id', state.organization.id)
        .order('scheduled_start', { ascending: false })
        .limit(5)
    : { data: [] };

  const planStatus = normaliseCarePlanStatus(plan.status);

  const addGoal = addGoalAction.bind(null, id);
  const setGoalStatus = updateGoalStatusAction.bind(null, id);
  const editGoal = editGoalAction.bind(null, id);
  const removeGoal = deleteGoalAction.bind(null, id);
  const addSupport = addSupportAction.bind(null, id);
  const setSupportStatus = updateSupportStatusAction.bind(null, id);
  const removeSupport = deleteSupportAction.bind(null, id);
  const transitionPlan = transitionPlanAction.bind(null, id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <OnboardingBanner stepId="add-goal" scrollTargetId="care-plan-goals" />
      <Breadcrumbs
        items={[
          { label: 'Care Plans', href: '/app/care-plans' },
          { label: plan.title ?? 'Care Plan' },
        ]}
      />
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/care-plans"
          aria-label="Back to care plans"
          className="min-h-[44px] md:min-h-0 rounded-md p-1.5 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title" data-testid="care-plan-title">
              {plan.title ?? 'Care Plan'}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CARE_PLAN_STATUS_CLASSES[planStatus]}`}
            >
              {CARE_PLAN_STATUS_LABELS[planStatus]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {participant ? (
              <>
                Participant:{' '}
                <Link
                  href={`/app/participants/${participant.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {participant.full_name}
                </Link>
              </>
            ) : (
              'Participant: Unassigned'
            )}{' '}
            · Created {new Date(plan.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status transitions */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <span className="text-sm font-medium text-muted-foreground">
          Transition:
        </span>
        {planStatus === 'draft' && (
          <StatusButton label="Activate" target="active" action={transitionPlan} />
        )}
        {planStatus === 'active' && (
          <>
            <StatusButton
              label="Mark for review"
              target="under_review"
              action={transitionPlan}
            />
            <StatusButton
              label="Complete"
              target="completed"
              action={transitionPlan}
            />
          </>
        )}
        {planStatus === 'under_review' && (
          <>
            <StatusButton
              label="Re-activate"
              target="active"
              action={transitionPlan}
            />
            <StatusButton
              label="Complete"
              target="completed"
              action={transitionPlan}
            />
          </>
        )}
        {(planStatus === 'active' || planStatus === 'completed') && (
          <StatusButton
            label="Archive"
            target="archived"
            action={transitionPlan}
            variant="danger"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* SECTION 1 — Overview */}
          <section
            className="rounded-lg border border-border bg-card p-5"
            data-testid="care-plan-overview"
          >
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <StickyNote className="h-5 w-5 text-muted-foreground" /> Overview
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Plan type" value={plan.plan_type ?? '—'} />
              <Detail
                label="Review due"
                value={
                  plan.review_date
                    ? new Date(plan.review_date).toLocaleDateString()
                    : 'Not set'
                }
              />
              <Detail
                label="Start"
                value={
                  plan.start_date
                    ? new Date(plan.start_date).toLocaleDateString()
                    : '—'
                }
              />
              <Detail
                label="End"
                value={
                  plan.end_date
                    ? new Date(plan.end_date).toLocaleDateString()
                    : '—'
                }
              />
            </div>
            {plan.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm text-foreground/90">
                {plan.description}
              </p>
            )}
          </section>

          {/* SECTION 2 — Goals */}
          <section
            id="care-plan-goals"
            className="rounded-lg border border-border bg-card"
            data-testid="care-plan-goals"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Target className="h-5 w-5 text-muted-foreground" /> Goals (
                {goals.length})
              </h2>
              <span className="text-xs text-muted-foreground">
                {achievedCount} achieved
              </span>
            </div>

            <div className="divide-y divide-border">
              {goals.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No goals yet. Add the first goal below to start tracking
                  progress.
                </p>
              )}

              {goals.map((goal) => {
                const goalSupports = supports.filter(
                  (s) => s.goal_id === goal.id,
                );
                return (
                  <div
                    key={goal.id}
                    className="px-5 py-4"
                    data-testid="care-plan-goal"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{goal.title}</p>
                        {goal.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap">
                            {goal.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Target:{' '}
                          {goal.target_date
                            ? new Date(goal.target_date).toLocaleDateString()
                            : 'No date'}{' '}
                          · Progress {goal.progress_percentage}%
                        </p>
                      </div>
                      <GoalStatusBadge status={goal.status} />
                    </div>

                    <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${goal.status === 'achieved' ? 'bg-success' : 'bg-primary'}`}
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <form action={setGoalStatus} className="flex gap-1">
                        <input
                          type="hidden"
                          name="goal_id"
                          value={goal.id}
                        />
                        <select
                          name="status"
                          defaultValue={goal.status}
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In progress</option>
                          <option value="achieved">Achieved</option>
                        </select>
                        <button
                          type="submit"
                          className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                        >
                          Update
                        </button>
                      </form>
                      <ConfirmActionButton
                        action={removeGoal}
                        fields={{ goal_id: goal.id }}
                        label="Delete"
                        ariaLabel={`Delete goal ${goal.title}`}
                        icon={<Trash2 className="h-3 w-3" />}
                        className="inline-flex min-h-[44px] md:min-h-0 items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                        title="Delete this goal?"
                        description={`"${goal.title}" and its linked supports will be removed from the plan. This cannot be undone.`}
                        confirmLabel="Delete goal"
                      />
                    </div>

                    {/* Edit goal (title, description, target date) */}
                    <details className="mt-3" data-testid="edit-goal-details">
                      <summary className="cursor-pointer text-xs text-primary hover:underline">
                        Edit goal
                      </summary>
                      <form
                        action={editGoal}
                        className="mt-2 space-y-2 rounded-md border border-border bg-muted/30 p-3"
                        data-testid="edit-goal-form"
                      >
                        <input
                          type="hidden"
                          name="goal_id"
                          value={goal.id}
                        />
                        <label className="block text-xs font-medium text-muted-foreground">
                          Title
                          <input
                            name="title"
                            defaultValue={goal.title}
                            required
                            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-medium text-muted-foreground">
                          Description
                          <textarea
                            name="description"
                            defaultValue={goal.description ?? ''}
                            rows={2}
                            className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                          />
                        </label>
                        <label className="block text-xs font-medium text-muted-foreground">
                          Target date
                          <input
                            type="date"
                            name="target_date"
                            defaultValue={goal.target_date ?? ''}
                            className="mt-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
                          />
                        </label>
                        <button
                          type="submit"
                          className="inline-flex min-h-[44px] md:min-h-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                          data-testid="save-goal-edit"
                        >
                          Save changes
                        </button>
                      </form>
                    </details>

                    {/* Supports nested under this goal */}
                    <div className="mt-4 ml-4 border-l border-border pl-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <ListChecks className="h-3.5 w-3.5" /> Supports (
                        {goalSupports.length})
                      </div>
                      <div className="space-y-2">
                        {goalSupports.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No supports linked to this goal.
                          </p>
                        )}
                        {goalSupports.map((support) => (
                          <div
                            key={support.id}
                            className="rounded-md border border-border bg-background px-3 py-2"
                            data-testid="care-plan-support"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm">{support.description}</p>
                                {(support.assigned_to ?? support.frequency) && (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {support.assigned_to
                                      ? `Assigned: ${support.assigned_to}`
                                      : ''}
                                    {support.assigned_to && support.frequency
                                      ? ' · '
                                      : ''}
                                    {support.frequency
                                      ? `Frequency: ${support.frequency}`
                                      : ''}
                                  </p>
                                )}
                              </div>
                              <SupportStatusBadge status={support.status} />
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <form
                                action={setSupportStatus}
                                className="flex gap-1"
                              >
                                <input
                                  type="hidden"
                                  name="support_id"
                                  value={support.id}
                                />
                                <select
                                  name="status"
                                  defaultValue={support.status}
                                  className="rounded-md border border-border bg-background px-2 py-0.5 text-xs"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">
                                    In progress
                                  </option>
                                  <option value="completed">Completed</option>
                                </select>
                                <button
                                  type="submit"
                                  className="inline-flex min-h-[44px] md:min-h-0 items-center justify-center rounded-md border border-border px-2 py-0.5 text-xs hover:bg-muted"
                                >
                                  Update
                                </button>
                              </form>
                              <ConfirmActionButton
                                action={removeSupport}
                                fields={{ support_id: support.id }}
                                label="Remove"
                                ariaLabel={`Remove support ${support.description}`}
                                icon={<Trash2 className="h-3 w-3" />}
                                className="inline-flex min-h-[44px] md:min-h-0 items-center gap-1 rounded-md border border-destructive/30 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10"
                                title="Remove this support?"
                                description={`"${support.description}" will be removed from this goal. This cannot be undone.`}
                                confirmLabel="Remove support"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add support form (only if goals exist) */}
                      <form
                        action={addSupport}
                        className="mt-3 space-y-2 rounded-md border border-dashed border-border p-3"
                        data-testid="add-support-form"
                      >
                        <input
                          type="hidden"
                          name="goal_id"
                          value={goal.id}
                        />
                        <input
                          name="description"
                          required
                          placeholder="Support action (e.g., Daily morning walk with staff)"
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            name="assigned_to"
                            placeholder="Assigned to (optional)"
                            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                          />
                          <input
                            name="frequency"
                            placeholder="Frequency (e.g., 3x/week)"
                            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          className="inline-flex min-h-[44px] md:min-h-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                        >
                          <PlusCircle className="h-3 w-3" /> Add support
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add goal form */}
            <form
              action={addGoal}
              className="space-y-2 border-t border-border bg-muted/30 px-5 py-4"
              data-testid="add-goal-form"
            >
              <div className="text-sm font-medium">Add a new goal</div>
              <input
                name="title"
                required
                placeholder="Goal title (e.g., Maintain independence in ADLs)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <textarea
                name="description"
                rows={2}
                placeholder="Description (optional)"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-2">
                <label
                  htmlFor="new-goal-target-date"
                  className="text-xs text-muted-foreground"
                >
                  Target date
                </label>
                <input
                  id="new-goal-target-date"
                  type="date"
                  name="target_date"
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                />
                <button
                  type="submit"
                  className="ml-auto inline-flex min-h-[44px] md:min-h-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  data-testid="submit-goal"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add goal
                </button>
              </div>
            </form>
          </section>

          {/* SECTION 4 — Progress */}
          <section
            className="rounded-lg border border-border bg-card p-5"
            data-testid="care-plan-progress"
          >
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />{' '}
              Progress
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span>Plan completion</span>
                  <span
                    className="font-medium"
                    data-testid="plan-progress-value"
                  >
                    {planProgress}%
                  </span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${planProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Derived from goal progress. {achievedCount} of {goals.length}{' '}
                goals achieved.
              </p>
            </div>
          </section>

          {/* Cross-module: related progress notes */}
          <section
            className="rounded-lg border border-border bg-card p-5"
            data-testid="care-plan-progress-notes"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <NotebookPen className="h-5 w-5 text-muted-foreground" />{' '}
                Recent progress notes
              </h2>
              {participant && (
                <Link
                  href="/app/progress-notes"
                  className="text-xs text-primary hover:underline"
                >
                  View all
                </Link>
              )}
            </div>
            {(progressNotes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No progress notes recorded for this participant yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {(progressNotes ?? []).map(
                  (n: {
                    id: string;
                    note_text: string;
                    status_tag: string | null;
                    created_at: string;
                  }) => (
                    <li
                      key={n.id}
                      className="border-l-2 border-primary/30 pl-3"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                        {n.status_tag && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                            {n.status_tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm whitespace-pre-wrap">
                        {n.note_text}
                      </p>
                    </li>
                  ),
                )}
              </ul>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Plan dates
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start</span>
                <span>
                  {plan.start_date
                    ? new Date(plan.start_date).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End</span>
                <span>
                  {plan.end_date
                    ? new Date(plan.end_date).toLocaleDateString()
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Review due</span>
                <span>
                  {plan.review_date
                    ? new Date(plan.review_date).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4 text-muted-foreground" /> Activity
            </h3>
            <p className="text-xs text-muted-foreground">
              Created {new Date(plan.created_at).toLocaleDateString()}
              {plan.updated_at && plan.updated_at !== plan.created_at && (
                <> · Updated {new Date(plan.updated_at).toLocaleDateString()}</>
              )}
            </p>
          </div>

          {/* Cross-module: recent visits */}
          {(visits ?? []).length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4 text-muted-foreground" /> Recent
                visits
              </h3>
              <ul className="space-y-2 text-xs">
                {(visits ?? []).map(
                  (v: {
                    id: string;
                    visit_type: string;
                    service_category: string | null;
                    scheduled_start: string;
                    status: string;
                  }) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate">
                        {v.service_category ?? v.visit_type}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(v.scheduled_start).toLocaleDateString()}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function GoalStatusBadge({ status }: { status: GoalStatus }) {
  const config: Record<
    GoalStatus,
    { label: string; className: string; Icon: typeof CheckCircle2 }
  > = {
    pending: {
      label: 'Pending',
      className: 'bg-muted text-muted-foreground',
      Icon: Circle,
    },
    in_progress: {
      label: 'In progress',
      className: 'bg-info/10 text-info',
      Icon: Clock3,
    },
    achieved: {
      label: 'Achieved',
      className: 'bg-success/10 text-success',
      Icon: CheckCircle2,
    },
  };
  const { label, className, Icon } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function SupportStatusBadge({ status }: { status: SupportStatus }) {
  const config: Record<SupportStatus, { label: string; className: string }> = {
    pending: {
      label: 'Pending',
      className: 'bg-muted text-muted-foreground',
    },
    in_progress: {
      label: 'In progress',
      className: 'bg-info/10 text-info',
    },
    completed: {
      label: 'Completed',
      className: 'bg-success/10 text-success',
    },
  };
  const { label, className } = config[status];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function StatusButton({
  label,
  target,
  action,
  variant,
}: {
  label: string;
  target: string;
  action: (formData: FormData) => Promise<void>;
  variant?: 'danger';
}) {
  return (
    <form action={action}>
      <input type="hidden" name="status" value={target} />
      <button
        type="submit"
        className={`rounded-md px-3 py-1 text-xs font-medium ${
          variant === 'danger'
            ? 'border border-destructive/30 text-destructive hover:bg-destructive/10'
            : 'border border-border hover:bg-muted'
        }`}
      >
        {label}
      </button>
    </form>
  );
}
