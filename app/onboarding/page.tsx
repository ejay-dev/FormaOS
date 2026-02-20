import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Building2, ShieldCheck, Sparkles, Info } from 'lucide-react';
import { SubmitButton } from '@/components/ui/submit-button';
import { applyIndustryPack } from '@/app/app/onboarding/actions';
import { createInvitation } from '@/lib/invitations/create-invitation';
import { resolvePlanKey, PLAN_CATALOG } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import {
  FRAMEWORK_OPTIONS,
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  parseInviteEmails,
  validateFrameworks,
  validateIndustry,
  validatePlan,
  validateTeamSize,
  validateInviteEmails,
  validateOrganizationName,
  sanitizeOrganizationName,
} from '@/lib/validators/organization';
import { INDUSTRY_PACKS } from '@/lib/industry-packs';
import { evaluateFrameworkControls } from '@/app/app/actions/compliance-engine';
import { provisionFrameworkControls } from '@/lib/frameworks/provisioning';
import { getProvisioningFrameworkSlugs } from '@/lib/onboarding/framework-selection';
import { isProvisioningRole } from '@/lib/onboarding/roles';
import {
  onOnboardingCompleted,
  updateComplianceScoreAndCheckRisk,
  onIndustryConfigured,
  onFrameworksProvisioned,
  onOnboardingMilestone,
} from '@/lib/automation/integration';
import { recoverUserWorkspace } from '@/lib/provisioning/workspace-recovery';
import { isCareLaunchMode, isIndustryAllowed, CARE_INDUSTRY_IDS } from '@/lib/vertical-launch';
import { EnterpriseTrustStrip } from '@/components/trust/EnterpriseTrustStrip';

// Force dynamic rendering - this page uses cookies() for auth
export const dynamic = 'force-dynamic';

const TOTAL_STEPS = 7;
const PLAN_CHOICES = [
  PLAN_CATALOG.basic,
  PLAN_CATALOG.pro,
  PLAN_CATALOG.enterprise,
];

type OnboardingRole = 'owner' | 'admin' | 'member' | 'viewer';
type JourneyType = 'full' | 'fast-track' | 'read-only';

type RoleOption = {
  id: string;
  label: string;
  role: OnboardingRole;
  description: string;
  journey: JourneyType;
};

const ROLE_OPTIONS = [
  {
    id: 'employer',
    label: 'Employer / Organization owner',
    role: 'owner',
    description: 'Full governance setup, framework provisioning, and team activation.',
    journey: 'full',
  },
  {
    id: 'compliance_lead',
    label: 'Compliance lead / Admin',
    role: 'admin',
    description: 'Configure controls and readiness workflows without billing ownership.',
    journey: 'full',
  },
  {
    id: 'employee',
    label: 'Employee / Field staff',
    role: 'member',
    description: 'Fast-track to assigned tasks, evidence, and day-to-day execution.',
    journey: 'fast-track',
  },
  {
    id: 'external_auditor',
    label: 'External auditor / Viewer',
    role: 'viewer',
    description: 'Read-only trust and readiness visibility with guided first review.',
    journey: 'read-only',
  },
] as const satisfies readonly RoleOption[];

const ONBOARDING_MILESTONES = [
  { id: 'foundation', label: 'Foundation', steps: [1, 2, 3] },
  { id: 'operating-model', label: 'Operating Model', steps: [4, 5] },
  { id: 'activation', label: 'Activation', steps: [6, 7] },
];

type OnboardingStatusRow = {
  organization_id: string;
  current_step: number;
  completed_steps: number[];
  completed_at: string | null;
  first_action: string | null;
};

type FrameworkRow = {
  framework_slug: string | null;
};

function normalizeFrameworks(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
}

async function resolveOrganizationFrameworks(
  orgId: string,
  frameworks: unknown,
): Promise<string[]> {
  const directFrameworks = normalizeFrameworks(frameworks);
  if (directFrameworks.length > 0) {
    return directFrameworks;
  }

  const admin = createSupabaseAdminClient();
  const { data: frameworkRows } = await admin
    .from('org_frameworks')
    .select('framework_slug')
    .eq('org_id', orgId)
    .limit(100);

  const fallbackFrameworks = normalizeFrameworks(
    (frameworkRows as FrameworkRow[] | null)?.map((row) => row.framework_slug),
  );

  if (fallbackFrameworks.length > 0) {
    await admin
      .from('organizations')
      .update({ frameworks: fallbackFrameworks })
      .eq('id', orgId);
  }

  return fallbackFrameworks;
}

async function getOrgContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/signin');

  // 🚨 FOUNDER BYPASS: Founders should never be in onboarding
  const parseEnvList = (value?: string | null) =>
    new Set(
      (value ?? '')
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    );

  const founderEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  const founderIds = parseEnvList(process.env.FOUNDER_USER_IDS);
  const userEmail = (user?.email ?? '').trim().toLowerCase();
  const userId = (user?.id ?? '').trim().toLowerCase();
  const isFounder = Boolean(
    user &&
    ((userEmail && founderEmails.has(userEmail)) || founderIds.has(userId)),
  );

  if (isFounder) {
    console.log(
      '[onboarding] 🚫 FOUNDER blocked from onboarding - redirecting to /admin',
      { email: userEmail },
    );
    redirect('/admin');
  }

  let { data: membership } = await supabase
    .from('org_members')
    .select(
      'organization_id, role, organizations(name, plan_key, industry, team_size, frameworks, onboarding_completed, created_by)',
    )
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) {
    console.warn('[onboarding] Missing membership, triggering recovery', {
      userId: user.id,
    });
    const recovery = await recoverUserWorkspace({
      userId: user.id,
      userEmail: user.email ?? null,
      source: 'onboarding-getOrgContext',
    });

    const { data: recoveredMembership } = await supabase
      .from('org_members')
      .select(
        'organization_id, role, organizations(name, plan_key, industry, team_size, frameworks, onboarding_completed, created_by)',
      )
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    membership = recoveredMembership;

    if (!membership?.organization_id) {
      redirect(recovery.nextPath);
    }
  }

  const baseOrgRecord = Array.isArray(membership.organizations)
    ? membership.organizations[0]
    : membership.organizations;
  const frameworks = await resolveOrganizationFrameworks(
    membership.organization_id as string,
    baseOrgRecord?.frameworks,
  );
  const orgRecord = {
    ...(baseOrgRecord ?? {}),
    frameworks,
  };

  return {
    supabase,
    user,
    orgId: membership.organization_id as string,
    orgRecord,
    role: membership.role as string | null,
    canProvision: isProvisioningRole(membership.role as string | null),
  };
}

async function getOnboardingStatus(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  orgId: string,
): Promise<OnboardingStatusRow> {
  const { data } = await supabase
    .from('org_onboarding_status')
    .select(
      'organization_id, current_step, completed_steps, completed_at, first_action',
    )
    .eq('organization_id', orgId)
    .maybeSingle();

  if (data?.organization_id) {
    return {
      organization_id: data.organization_id,
      current_step: data.current_step ?? 1,
      completed_steps: data.completed_steps ?? [],
      completed_at: data.completed_at ?? null,
      first_action: data.first_action ?? null,
    };
  }

  const { data: created } = await supabase
    .from('org_onboarding_status')
    .insert({ organization_id: orgId, current_step: 1, completed_steps: [] })
    .select(
      'organization_id, current_step, completed_steps, completed_at, first_action',
    )
    .maybeSingle();

  return {
    organization_id: orgId,
    current_step: created?.current_step ?? 1,
    completed_steps: created?.completed_steps ?? [],
    completed_at: created?.completed_at ?? null,
    first_action: created?.first_action ?? null,
  };
}

async function markStepComplete(orgId: string, step: number, nextStep: number) {
  'use server';
  const { supabase } = await getOrgContext();

  const { data: existing } = await supabase
    .from('org_onboarding_status')
    .select('completed_steps')
    .eq('organization_id', orgId)
    .maybeSingle();

  const completed = new Set<number>(existing?.completed_steps ?? []);
  completed.add(step);

  await supabase.from('org_onboarding_status').upsert({
    organization_id: orgId,
    current_step: nextStep,
    completed_steps: Array.from(completed).sort((a, b) => a - b),
    last_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

async function advanceWelcome() {
  'use server';
  const { orgId } = await getOrgContext();
  await markStepComplete(orgId, 1, 2);
  redirect('/onboarding?step=2');
}

async function saveOrgDetails(formData: FormData) {
  'use server';
  const { orgId, orgRecord } = await getOrgContext();
  const admin = createSupabaseAdminClient();

  const nameRaw = (formData.get('organizationName') as string | null) ?? '';
  const teamSize = (formData.get('teamSize') as string | null) ?? '';
  const planInput = (formData.get('plan') as string | null) ?? '';

  const nameCheck = validateOrganizationName(nameRaw);
  const teamCheck = validateTeamSize(teamSize);
  const planCandidate = planInput || orgRecord?.plan_key || '';
  const planCheck = validatePlan(planCandidate);

  if (!nameCheck.valid || !teamCheck.valid) {
    redirect('/onboarding?step=2&error=1');
  }

  if (!planCheck.valid) {
    redirect('/onboarding?step=2&error=1');
  }

  const sanitizedName = sanitizeOrganizationName(nameRaw);
  const resolvedPlan = resolvePlanKey(planCandidate);

  if (!resolvedPlan) {
    redirect('/onboarding?step=2&error=1');
  }

  await admin
    .from('organizations')
    .update({
      name: sanitizedName,
      team_size: teamSize,
      plan_key: resolvedPlan,
      plan_selected_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  await ensureSubscription(orgId, resolvedPlan);

  await markStepComplete(orgId, 2, 3);
  redirect('/onboarding?step=3');
}

async function saveIndustrySelection(formData: FormData) {
  'use server';
  const { orgId, orgRecord, canProvision } = await getOrgContext();
  const admin = createSupabaseAdminClient();
  const industry = (formData.get('industry') as string | null) ?? '';

  const validation = validateIndustry(industry);
  if (!validation.valid) {
    redirect('/onboarding?step=3&error=1');
  }

  if (!canProvision) {
    redirect('/onboarding?step=3&error=1');
  }

  await admin.from('organizations').update({ industry }).eq('id', orgId);

  if (!orgRecord?.industry && INDUSTRY_PACKS[industry]) {
    try {
      await applyIndustryPack(industry);
    } catch (error) {
      console.error('Industry pack failed:', error);
    }
  }

  // Trigger automation for industry configuration
  await onIndustryConfigured(orgId, industry);

  await markStepComplete(orgId, 3, 4);
  redirect('/onboarding?step=4');
}

async function saveRoleSelection(formData: FormData) {
  'use server';
  const { supabase, orgId, user, orgRecord } = await getOrgContext();
  const roleSelection = (formData.get('role') as string | null) ?? '';

  const match = ROLE_OPTIONS.find((option) => option.id === roleSelection);
  if (!match) {
    redirect('/onboarding?step=4&error=1');
  }

  await supabase
    .from('org_members')
    .update({ role: match.role })
    .eq('organization_id', orgId)
    .eq('user_id', user.id);

  // Fast-track non-provisioning personas to first proof with defaults already
  // managed by the organization profile.
  if (!isProvisioningRole(match.role)) {
    const defaultFrameworks =
      Array.isArray(orgRecord?.frameworks) && orgRecord.frameworks.length > 0
        ? orgRecord.frameworks
        : ['iso27001'];

    await createSupabaseAdminClient()
      .from('organizations')
      .update({ frameworks: defaultFrameworks })
      .eq('id', orgId);

    await markStepComplete(orgId, 4, 5);
    await markStepComplete(orgId, 5, 6);
    await markStepComplete(orgId, 6, 7);
    redirect(
      `/onboarding?step=7&fast_track=1&persona=${encodeURIComponent(match.role)}`,
    );
  }

  await markStepComplete(orgId, 4, 5);
  redirect('/onboarding?step=5');
}

async function saveFrameworkSelection(formData: FormData) {
  'use server';
  const { supabase, orgId, canProvision } = await getOrgContext();
  const admin = createSupabaseAdminClient();
  const frameworks = formData
    .getAll('frameworks')
    .map((item) => item.toString())
    .filter(Boolean);

  const validation = validateFrameworks(frameworks);
  if (!validation.valid) {
    redirect('/onboarding?step=5&error=1');
  }

  if (!canProvision) {
    redirect('/onboarding?step=5&error=1');
  }

  const { error: frameworkUpdateError } = await supabase
    .from('organizations')
    .update({ frameworks })
    .eq('id', orgId);
  if (frameworkUpdateError) {
    console.warn(
      '[onboarding] organizations.frameworks update failed; retrying with admin client',
      frameworkUpdateError,
    );
    await admin.from('organizations').update({ frameworks }).eq('id', orgId);
  }

  try {
    const selectedFrameworks = getProvisioningFrameworkSlugs(frameworks);

    if (selectedFrameworks.length) {
      const upsertPayload = selectedFrameworks.map((slug) => ({
        org_id: orgId,
        framework_slug: slug,
        enabled_at: new Date().toISOString(),
      }));
      const { error: adminUpsertError } = await admin
        .from('org_frameworks')
        .upsert(upsertPayload, { onConflict: 'org_id,framework_slug' });

      if (adminUpsertError) {
        console.warn(
          '[onboarding] admin org_frameworks upsert failed',
          adminUpsertError,
        );
        await supabase.from('org_frameworks').upsert(upsertPayload, {
          onConflict: 'org_id,framework_slug',
        });
      }

      try {
        await Promise.all(
          selectedFrameworks.map((slug) =>
            provisionFrameworkControls(orgId, slug, {
              force: true,
              client: admin,
            }),
          ),
        );
      } catch (error) {
        console.warn('[onboarding] admin provisioning failed', error);
      }

      try {
        await Promise.all(
          selectedFrameworks.map((slug) =>
            provisionFrameworkControls(orgId, slug, {
              force: true,
              client: supabase,
            }),
          ),
        );

        // Trigger automation for frameworks provisioned
        await onFrameworksProvisioned(orgId, selectedFrameworks);
      } catch (error) {
        console.warn('[onboarding] user provisioning failed', error);
      }
    }
  } catch (error) {
    console.warn('[onboarding] Framework provisioning skipped:', error);
  }

  await markStepComplete(orgId, 5, 6);
  redirect('/onboarding?step=6');
}

async function saveInvites(formData: FormData) {
  'use server';
  const { orgId, user } = await getOrgContext();
  const inviteEmails = parseInviteEmails(
    formData.get('inviteEmails') as string | null,
  );
  const validation = validateInviteEmails(inviteEmails);

  if (!validation.valid) {
    redirect('/onboarding?step=6&error=1');
  }

  if (validation.validEmails.length > 0) {
    await Promise.all(
      validation.validEmails.map((email) =>
        createInvitation({
          organizationId: orgId,
          email,
          role: 'member',
          invitedBy: user.id,
        }),
      ),
    );
  }

  await markStepComplete(orgId, 6, 7);
  redirect('/onboarding?step=7');
}

async function completeFirstAction(formData: FormData) {
  'use server';
  const { supabase, orgId, orgRecord, user } = await getOrgContext();
  const admin = createSupabaseAdminClient();
  const action = (formData.get('firstAction') as string | null) ?? '';

  if (!action) {
    redirect('/onboarding?step=7&error=1');
  }

  if (action === 'create_task') {
    await supabase.from('org_tasks').insert({
      organization_id: orgId,
      title: 'Kickoff compliance task',
      description:
        'Review your first compliance requirement and assign an owner.',
      status: 'pending',
      priority: 'high',
      assigned_to: user.id,
    });
  }

  if (action === 'upload_evidence') {
    await supabase.from('org_tasks').insert({
      organization_id: orgId,
      title: 'Upload first evidence artifact',
      description:
        'Attach a policy, credential, or control evidence file to validate the workflow.',
      status: 'pending',
      priority: 'medium',
      assigned_to: user.id,
    });
  }

  if (action === 'run_evaluation') {
    const frameworks = Array.isArray(orgRecord?.frameworks)
      ? orgRecord?.frameworks
      : [];
    await Promise.all(
      frameworks.map((frameworkCode: string) =>
        evaluateFrameworkControls(orgId, frameworkCode),
      ),
    );
  }

  if (action === 'review_dashboard') {
    // Read-only onboarding action; no mutation required.
  }

  await admin
    .from('organizations')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  const { data: existing } = await supabase
    .from('org_onboarding_status')
    .select('completed_steps')
    .eq('organization_id', orgId)
    .maybeSingle();

  const completed = new Set<number>(existing?.completed_steps ?? []);
  completed.add(7);

  await supabase.from('org_onboarding_status').upsert({
    organization_id: orgId,
    current_step: 7,
    completed_steps: Array.from(completed).sort((a, b) => a - b),
    first_action: action,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await onOnboardingCompleted(orgId);
  await updateComplianceScoreAndCheckRisk(orgId);

  const { data: subscription } = await supabase
    .from('org_subscriptions')
    .select('status, current_period_end, trial_expires_at')
    .eq('organization_id', orgId)
    .maybeSingle();

  const subscriptionActive =
    subscription?.status &&
    ['active', 'trialing'].includes(subscription.status);
  const trialEndValue =
    subscription?.trial_expires_at ?? subscription?.current_period_end;
  const trialExpired =
    subscription?.status === 'trialing' &&
    (!trialEndValue ||
      Number.isNaN(new Date(trialEndValue).getTime()) ||
      Date.now() > new Date(trialEndValue).getTime());

  if (!subscriptionActive || trialExpired) {
    redirect('/app/billing');
  }

  redirect('/app');
}

type OnboardingPageProps = {
  searchParams?: Promise<{
    step?: string;
    plan?: string;
    error?: string;
    from?: string;
    journey?: string;
    fast_track?: string;
    persona?: string;
  }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const resolvedSearchParams = await searchParams;

  // Loop break: if AppLayout sent us here because systemState failed,
  // but onboarding is actually complete, don't bounce back to /app
  // (which would just send us here again). Show error instead.
  const cameFromApp = resolvedSearchParams?.from === 'app';

  const { orgId, orgRecord, supabase, role } = await getOrgContext();
  const status = await getOnboardingStatus(supabase, orgId);

  const onboardingStatusComplete =
    Boolean(status.completed_at) || status.completed_steps.includes(TOTAL_STEPS);
  const hasRequiredOnboardingData =
    Boolean(orgRecord?.plan_key) &&
    Boolean(orgRecord?.industry) &&
    Array.isArray(orgRecord?.frameworks) &&
    orgRecord.frameworks.length > 0;

  if (onboardingStatusComplete && hasRequiredOnboardingData) {
    if (!orgRecord?.onboarding_completed) {
      await createSupabaseAdminClient()
        .from('organizations')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', orgId);
    }
    if (cameFromApp) {
      console.error(
        '[Onboarding] Loop detected: onboarding complete but app state unavailable; invoking workspace recovery.',
      );
      redirect('/workspace-recovery?from=onboarding-loop');
    }
    redirect('/app');
  }

  const planKey =
    resolvePlanKey(orgRecord?.plan_key ?? '') ||
    resolvePlanKey(resolvedSearchParams?.plan ?? '');

  const rawStep = Number.parseInt(resolvedSearchParams?.step ?? '', 10);
  const step = Number.isNaN(rawStep) ? status.current_step : rawStep;
  const safeStep = Math.min(Math.max(step, 1), TOTAL_STEPS);

  if (safeStep > status.current_step) {
    redirect(`/onboarding?step=${status.current_step}`);
  }

  const errorState = Boolean(resolvedSearchParams?.error);
  const fastTrack = resolvedSearchParams?.fast_track === '1';
  const persona = resolvedSearchParams?.persona ?? '';
  const isReadOnlyPersona = role === 'viewer' || persona === 'viewer';
  const defaultRoleOptionId =
    ROLE_OPTIONS.find((option) => option.role === role)?.id ?? 'employer';
  const planLabel = planKey ? PLAN_CATALOG[planKey].name : 'Plan not selected';
  const completedRatio = (safeStep / TOTAL_STEPS) * 100;
  const journey = resolvedSearchParams?.journey ?? '';
  const firstActionDefault =
    isReadOnlyPersona
      ? 'review_dashboard'
      : journey === 'prove'
      ? 'upload_evidence'
      : journey === 'evaluate'
        ? 'run_evaluation'
        : 'create_task';

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] font-sans">
      <EnterpriseTrustStrip surface="onboarding" />
      <div className="flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
        <div className="bg-white/5 rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[hsl(var(--card))]" />

          <div className="mb-8 text-center md:text-left">
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--card))] text-white flex items-center justify-center mb-6 shadow-xl mx-auto md:mx-0">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">
              FormaOS onboarding
            </h1>
            <p className="text-slate-400 mt-2 font-medium leading-relaxed text-sm">
              Step {safeStep} of {TOTAL_STEPS} · {planLabel}
            </p>
            <div className="mt-5 space-y-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${completedRatio}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {ONBOARDING_MILESTONES.map((milestone) => {
                  const isComplete = Math.max(...milestone.steps) < safeStep;
                  const isActive = milestone.steps.includes(safeStep);
                  return (
                    <div
                      key={milestone.id}
                      className={`rounded-full border px-2 py-1 text-center ${
                        isActive
                          ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-200'
                          : isComplete
                            ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-white/10 bg-white/5'
                      }`}
                    >
                      {milestone.label}
                    </div>
                  );
                })}
              </div>
            </div>
            {errorState ? (
              <div className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                Please complete the required fields before continuing.
              </div>
            ) : null}
            {fastTrack ? (
              <div className="mt-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-xs text-cyan-100">
                Fast-track enabled for this persona. Core governance defaults
                are pre-configured so you can reach first proof faster.
              </div>
            ) : null}
          </div>

          {safeStep === 1 ? (
            <form action={advanceWelcome} className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-[hsl(var(--card))] p-6 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-sky-400" />
                  <div>
                    <div className="text-base font-semibold text-slate-100">
                      Welcome to FormaOS.
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      We will capture your organization details and configure
                      the compliance engine to match your obligations.
                    </p>
                  </div>
                </div>
              </div>
              <SubmitButton loadingText="Starting...">Continue</SubmitButton>
            </form>
          ) : null}

          {safeStep === 2 ? (
            <form
              action={saveOrgDetails}
              className="space-y-8"
              data-testid="onboarding-step-org"
            >
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Organization name
                </label>
                <input
                  required
                  name="organizationName"
                  defaultValue={orgRecord?.name ?? ''}
                  placeholder="e.g. Acme Corp"
                  data-testid="organization-name"
                  className="w-full p-4 rounded-2xl border border-white/10 bg-[hsl(var(--card))] focus:bg-white/5 focus:outline-white/20 text-sm font-semibold transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Team size
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  {TEAM_SIZE_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 text-sm text-slate-200"
                    >
                      <input
                        required
                        type="radio"
                        name="teamSize"
                        value={option.id}
                        defaultChecked={orgRecord?.team_size === option.id}
                        data-testid={`team-size-${option.id}`}
                        className="h-4 w-4 border-white/20 bg-[hsl(var(--card))] text-sky-400"
                      />
                      <span>{option.label} people</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Plan
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  {PLAN_CHOICES.map((option) => (
                    <label
                      key={option.key}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--card))] px-4 py-4 text-sm text-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          required
                          type="radio"
                          name="plan"
                          value={option.key}
                          defaultChecked={planKey === option.key}
                          data-testid={`plan-option-${option.key}`}
                          className="h-4 w-4 border-white/20 bg-[hsl(var(--card))] text-sky-400"
                        />
                        <span className="text-sm font-semibold text-slate-100">
                          {option.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {option.summary}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <SubmitButton loadingText="Saving...">Continue</SubmitButton>
            </form>
          ) : null}

          {safeStep === 3 ? (
            <form
              action={saveIndustrySelection}
              className="space-y-8"
              data-testid="onboarding-step-industry"
            >
              {/* Show banner if org already has a non-care industry (admin override path) */}
              {isCareLaunchMode() && orgRecord?.industry && !isIndustryAllowed(orgRecord.industry) && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                  <span>
                    This organization is currently set to an industry that is not in our launch focus. Your existing access and data remain intact. To switch to a supported care provider vertical, select one below.
                  </span>
                </div>
              )}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Industry
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  {(isCareLaunchMode()
                    ? INDUSTRY_OPTIONS.filter((o) => (CARE_INDUSTRY_IDS as readonly string[]).includes(o.id))
                    : INDUSTRY_OPTIONS
                  ).map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 text-sm text-slate-200"
                    >
                      <input
                        required
                        type="radio"
                        name="industry"
                        value={option.id}
                        defaultChecked={
                          orgRecord?.industry
                            ? orgRecord.industry === option.id
                            : isCareLaunchMode() && option.id === 'ndis'
                        }
                        data-testid={`industry-option-${option.id}`}
                        className="h-4 w-4 border-white/20 bg-[hsl(var(--card))] text-sky-400"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <SubmitButton loadingText="Configuring industry...">
                Continue
              </SubmitButton>
            </form>
          ) : null}

          {safeStep === 4 ? (
            <form
              action={saveRoleSelection}
              className="space-y-8"
              data-testid="onboarding-step-role"
            >
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Choose your onboarding persona
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {ROLE_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className="flex gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 text-sm text-slate-200"
                    >
                      <input
                        required
                        type="radio"
                        name="role"
                        value={option.id}
                        defaultChecked={defaultRoleOptionId === option.id}
                        data-testid={`role-option-${option.id}`}
                        className="mt-1 h-4 w-4 border-white/20 bg-[hsl(var(--card))] text-sky-400"
                      />
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-100">
                          {option.label}
                        </div>
                        <div className="text-xs text-slate-400">
                          {option.description}
                        </div>
                        <span
                          className={`inline-flex rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                            option.journey === 'full'
                              ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
                              : option.journey === 'read-only'
                                ? 'border-slate-400/30 bg-slate-500/10 text-slate-200'
                                : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                          }`}
                        >
                          {option.journey === 'full'
                            ? 'Full setup'
                            : option.journey === 'read-only'
                              ? 'Read-only fast track'
                              : 'Execution fast track'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <SubmitButton loadingText="Setting role...">
                Continue
              </SubmitButton>
            </form>
          ) : null}

          {safeStep === 5 ? (
            <form
              action={saveFrameworkSelection}
              className="space-y-8"
              data-testid="onboarding-step-frameworks"
            >
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Compliance frameworks (select at least one)
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {FRAMEWORK_OPTIONS.map((framework) => {
                    const checked = Array.isArray(orgRecord?.frameworks)
                      ? orgRecord?.frameworks.includes(framework.id)
                      : false;
                    return (
                      <label
                        key={framework.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 text-sm text-slate-200"
                      >
                        <input
                          type="checkbox"
                          name="frameworks"
                          value={framework.id}
                          defaultChecked={checked}
                          data-testid={`framework-option-${framework.id}`}
                          className="h-4 w-4 rounded border-white/20 bg-[hsl(var(--card))] text-sky-400"
                        />
                        <span>{framework.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <SubmitButton loadingText="Configuring frameworks...">
                Continue
              </SubmitButton>
            </form>
          ) : null}

          {safeStep === 6 ? (
            <form
              action={saveInvites}
              className="space-y-8"
              data-testid="onboarding-step-invites"
            >
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Invite teammates (optional)
                </label>
                <textarea
                  name="inviteEmails"
                  rows={4}
                  placeholder="Add emails separated by commas or new lines"
                  data-testid="invite-emails"
                  className="w-full p-4 rounded-2xl border border-white/10 bg-[hsl(var(--card))] text-sm font-semibold text-slate-100"
                />
              </div>
              <SubmitButton loadingText="Sending invites...">
                Continue
              </SubmitButton>
            </form>
          ) : null}

          {safeStep === 7 ? (
            <form
              action={completeFirstAction}
              className="space-y-8"
              data-testid="onboarding-step-first-action"
            >
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  First system action
                </div>
                {isReadOnlyPersona ? (
                  <div className="rounded-xl border border-slate-400/30 bg-slate-500/10 px-4 py-3 text-xs text-slate-300">
                    Read-only persona detected. Choose a review-first action to
                    enter the workspace safely.
                  </div>
                ) : null}
                <div className="space-y-3">
                  {!isReadOnlyPersona ? (
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 text-sm text-slate-200">
                      <input
                        type="radio"
                        name="firstAction"
                        value="create_task"
                        data-testid="first-action-create-task"
                        className="h-4 w-4 border-white/20 bg-[hsl(var(--card))] text-sky-400"
                        defaultChecked={firstActionDefault === 'create_task'}
                        required
                      />
                      <span>Create a kickoff compliance task</span>
                    </label>
                  ) : null}
                  {!isReadOnlyPersona ? (
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 text-sm text-slate-200">
                      <input
                        type="radio"
                        name="firstAction"
                        value="upload_evidence"
                        data-testid="first-action-upload-evidence"
                        className="h-4 w-4 border-white/20 bg-[hsl(var(--card))] text-sky-400"
                        defaultChecked={firstActionDefault === 'upload_evidence'}
                      />
                      <span>Prepare an evidence upload task</span>
                    </label>
                  ) : null}
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 text-sm text-slate-200">
                    <input
                      type="radio"
                      name="firstAction"
                      value="run_evaluation"
                      data-testid="first-action-run-evaluation"
                      className="h-4 w-4 border-white/20 bg-[hsl(var(--card))] text-sky-400"
                      defaultChecked={firstActionDefault === 'run_evaluation'}
                      required={isReadOnlyPersona}
                    />
                    <span>Run the first compliance evaluation</span>
                  </label>
                  {isReadOnlyPersona ? (
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(var(--card))] px-4 py-3 text-sm text-slate-200">
                      <input
                        type="radio"
                        name="firstAction"
                        value="review_dashboard"
                        data-testid="first-action-review-dashboard"
                        className="h-4 w-4 border-white/20 bg-[hsl(var(--card))] text-sky-400"
                        defaultChecked={firstActionDefault === 'review_dashboard'}
                      />
                      <span>Open readiness dashboard and review posture</span>
                    </label>
                  ) : null}
                </div>
              </div>
              <SubmitButton loadingText="Completing setup...">
                Complete setup
              </SubmitButton>
            </form>
          ) : null}

          <div className="mt-10 pt-8 border-t border-white/10 flex items-center gap-3 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Onboarding progress stored securely
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
