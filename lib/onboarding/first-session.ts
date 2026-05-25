import 'server-only';

import { cache } from 'react';
import { consoleShim } from '@/lib/monitoring/console-shim';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type FirstSessionStepId =
  | 'create-care-plan'
  | 'add-goal'
  | 'log-progress-note'
  | 'upload-evidence'
  | 'review-task';

export type FirstSessionStep = {
  id: FirstSessionStepId;
  label: string;
  description: string;
  /** Ties the step to a concrete compliance benefit — used for trust copy. */
  complianceNote: string;
  /** Nav-section prefix for "on-track" detection by the guidance notification. */
  basePath: string;
  href: string;
  done: boolean;
};

export type FirstSessionState = {
  isFirstSession: boolean;
  completed: number;
  total: number;
  progress: number;
  nextStep: FirstSessionStep | null;
  steps: FirstSessionStep[];
  /** Step ids the user has already seen the completion toast for. */
  seenSteps: FirstSessionStepId[];
  /** Done steps whose completion has not yet been acknowledged (toast pending). */
  freshlyCompletedSteps: FirstSessionStepId[];
};

async function safeCount(
  query: PromiseLike<{ count: number | null; error?: unknown }>,
): Promise<number> {
  try {
    const { count } = await query;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function fetchSeenSteps(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
): Promise<FirstSessionStepId[]> {
  try {
    const { data, error } = await admin
      .from('org_first_session_progress')
      .select('seen_steps')
      .eq('organization_id', orgId)
      .maybeSingle();
    if (error) {
      // Missing table / permissions — log once so monitoring can pick it up.
      consoleShim.warn(
        '[onboarding-health] org_first_session_progress read failed',
        { code: error.code, message: error.message },
      );
      return [];
    }
    const raw = Array.isArray(data?.seen_steps) ? data.seen_steps : [];
    return raw.filter((id): id is FirstSessionStepId =>
      [
        'create-care-plan',
        'add-goal',
        'log-progress-note',
        'upload-evidence',
        'review-task',
      ].includes(id as string),
    );
  } catch (err) {
    consoleShim.warn('[onboarding-health] seen_steps fetch threw', err);
    return [];
  }
}

async function firstCarePlanWithGoalsId(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
): Promise<{ planId: string | null; hasGoals: boolean }> {
  try {
    const { data } = await admin
      .from('org_care_plans')
      .select('id, goals')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!data) return { planId: null, hasGoals: false };
    const goals = Array.isArray(data.goals) ? data.goals : [];
    return { planId: (data.id as string) ?? null, hasGoals: goals.length > 0 };
  } catch {
    return { planId: null, hasGoals: false };
  }
}

export const getFirstSessionState = cache(_getFirstSessionState);

async function _getFirstSessionState(
  orgId: string,
): Promise<FirstSessionState> {
  const admin = createSupabaseAdminClient();

  const [
    carePlans,
    tasks,
    evidence,
    incidents,
    { planId, hasGoals },
    progressNotes,
    seenSteps,
  ] = await Promise.all([
    safeCount(
      admin
        .from('org_care_plans')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_evidence')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    safeCount(
      admin
        .from('org_incidents')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    firstCarePlanWithGoalsId(admin, orgId),
    safeCount(
      admin
        .from('org_progress_notes')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId),
    ),
    fetchSeenSteps(admin, orgId),
  ]);

  const steps: FirstSessionStep[] = [
    {
      id: 'create-care-plan',
      label: 'Create your first care plan',
      description: 'A plan is the anchor for goals, supports and progress.',
      complianceNote:
        'A care plan is the primary artefact auditors ask for. It links every participant action back to a documented obligation.',
      basePath: '/app/care-plans',
      href: '/app/care-plans/new',
      done: carePlans >= 1,
    },
    {
      id: 'add-goal',
      label: 'Add your first goal',
      description: 'Goals drive plan progress and give your team a target.',
      complianceNote:
        'Goals turn a plan into measurable outcomes — the basis for NDIS outcome reporting and progress audits.',
      basePath: '/app/care-plans',
      href: planId ? `/app/care-plans/${planId}` : '/app/care-plans',
      done: hasGoals,
    },
    {
      id: 'log-progress-note',
      label: 'Log your first progress note',
      description: 'Capture how a visit went — builds the participant record.',
      complianceNote:
        'Progress notes are real-time evidence for audits. Logging them early builds the longitudinal record regulators expect.',
      basePath: '/app/participants',
      href: '/app/participants',
      done: progressNotes >= 1,
    },
    {
      id: 'upload-evidence',
      label: 'Upload your first evidence',
      description: 'Attach a credential, service agreement or consent form.',
      complianceNote:
        'Evidence in the vault maps directly to compliance controls — auditors sample these, so having real files reduces audit prep.',
      basePath: '/app/vault',
      href: '/app/vault',
      done: evidence >= 1,
    },
    {
      id: 'review-task',
      label: 'Review an open task',
      description: 'Compliance tasks surface the obligations that matter next.',
      complianceNote:
        'Tasks are the system translating frameworks into everyday work. Reviewing one closes a compliance obligation.',
      basePath: '/app/tasks',
      href: '/app/tasks',
      done: tasks >= 1,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Show the Start here hero while the org is still working through the
  // five guided actions. Incidents signal the org is past pure onboarding and
  // should drop the hero even if some steps remain.
  const isFirstSession = completed < total && incidents === 0;

  const nextStep = steps.find((s) => !s.done) ?? null;

  // Steps that are done but haven't had their success toast acknowledged yet.
  // The toast component will mark them seen server-side after displaying.
  const freshlyCompletedSteps = steps
    .filter((s) => s.done && !seenSteps.includes(s.id))
    .map((s) => s.id);

  return {
    isFirstSession,
    completed,
    total,
    progress,
    nextStep,
    steps,
    seenSteps,
    freshlyCompletedSteps,
  };
}
