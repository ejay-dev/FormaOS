import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { brand } from '@/config/brand';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { after } from 'next/server';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { Building2, ShieldCheck } from 'lucide-react';
import { SubmitButton } from '@/components/ui/submit-button';
import { applyIndustryPack } from '@/app/app/onboarding/actions';
import { createInvitation } from '@/lib/invitations/create-invitation';
import { sendEmail } from '@/lib/email/send-email';
import { resolvePlanKey, PLAN_CATALOG } from '@/lib/plans';
import { ensureSubscription } from '@/lib/billing/subscriptions';
import {
  frameworkOptionsForIndustry,
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
  ROLE_OPTIONS,
  getDefaultRoleOptionId,
  isReadOnlyPersonaRole,
  resolveRoleSelectionOutcome,
} from '@/lib/onboarding/journey';
import {
  onOnboardingCompleted,
  updateComplianceScoreAndCheckRisk,
  onIndustryConfigured,
  onFrameworksProvisioned,
} from '@/lib/automation/integration';
import { recoverUserWorkspace } from '@/lib/provisioning/workspace-recovery';
import { OnboardingStepTracker } from '@/components/onboarding/onboarding-step-tracker';
import { logActivity as logProductActivity } from '@/lib/activity/feed';
import { authLogger } from '@/lib/observability/structured-logger';
import { trackActivation } from '@/lib/analytics/activation-telemetry';

// Force dynamic rendering - this page uses cookies() for auth
export const dynamic = 'force-dynamic';

const TOTAL_STEPS = 7;
// Audit Sprint 6a (2026-05-23): Scale tier added. Was deliberately
// excluded because the DB CHECK constraint on org_subscriptions
// rejected 'scale'; that's fixed by migration 20260624020. Operator
// must also set STRIPE_PRICE_SCALE in production env for checkout to
// resolve a price ID — productionRequiredKeys in check-env.js already
// guards this.
const PLAN_CHOICES = [
  PLAN_CATALOG.basic,
  PLAN_CATALOG.pro,
  PLAN_CATALOG.scale,
  PLAN_CATALOG.enterprise,
];

/**
 * Keys are the `error` query value each server action redirects with, so a
 * failed step explains what to change instead of one generic message.
 */
const ONBOARDING_ERROR_MESSAGES: Record<string, string> = {
  'organisation-name':
    'Enter an organisation name between 2 and 100 characters, starting and ending with a letter or number.',
  'team-size': 'Choose how many people work in your organisation.',
  plan: 'Choose a plan to continue.',
  industry: 'Choose the industry you operate in.',
  role: 'Choose how you will use FormaOS.',
  frameworks: 'Choose at least one standard that applies to your work.',
  'invite-emails':
    'One or more addresses could not be read. Check them, or skip this step and invite people later.',
  'invite-delivery':
    'We could not send every invitation. Check the addresses and try again, or skip this step and invite people later from Settings.',
  permission:
    'Your account cannot change this setting. Ask an owner or admin in your organisation to finish setup.',
  'first-action': 'Choose what you want to do first.',
};

const ONBOARDING_ERROR_FALLBACK =
  'That step could not be saved. Check the details and try again.';

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

function handleOnboardingActionFailure(
  actionName: string,
  step: number,
  error: unknown,
): never {
  if (isRedirectError(error)) {
    throw error;
  }

  console.error(`[onboarding] ${actionName} failed`, error);
  redirect(`/onboarding?step=${step}&error=unexpected`);
}

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
    .eq('organization_id', orgId)
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
    authLogger.info('founder_blocked_from_onboarding', {
      email: userEmail,
      redirect: '/admin',
    });
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

  // Use admin client for insert to bypass RLS
  const admin = createSupabaseAdminClient();
  const { data: created } = await admin
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
  // Use admin client to bypass RLS — the user-scoped client may be blocked
  // by row-level security on org_onboarding_status, causing silent upsert
  // failures that leave users stuck on the current step.
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from('org_onboarding_status')
    .select('completed_steps')
    .eq('organization_id', orgId)
    .maybeSingle();

  const completed = new Set<number>(existing?.completed_steps ?? []);
  completed.add(step);

  const { error } = await admin.from('org_onboarding_status').upsert({
    organization_id: orgId,
    current_step: nextStep,
    completed_steps: Array.from(completed).sort((a, b) => a - b),
    last_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[onboarding] markStepComplete failed', {
      orgId,
      step,
      nextStep,
      error: error.message,
    });
    throw new Error(
      `Failed to advance onboarding from step ${step} to ${nextStep}`,
    );
  }
}

async function upsertSelectedFrameworks(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
  frameworkSlugs: string[],
) {
  if (!frameworkSlugs.length) return;

  const timestamp = new Date().toISOString();
  const primaryPayload = frameworkSlugs.map((slug) => ({
    organization_id: orgId,
    framework_slug: slug,
    enabled_at: timestamp,
  }));

  const { error: primaryError } = await admin
    .from('org_frameworks')
    .upsert(primaryPayload, {
      onConflict: 'organization_id,framework_slug',
    });

  if (!primaryError) return;

  const message = primaryError.message?.toLowerCase() ?? '';
  const missingOrganizationIdColumn =
    message.includes('organization_id') && message.includes('does not exist');
  const missingOrganizationOnConflict =
    message.includes('organization_id,framework_slug') &&
    message.includes('does not exist');

  if (!missingOrganizationIdColumn && !missingOrganizationOnConflict) {
    throw primaryError;
  }

  const legacyPayload = frameworkSlugs.map((slug) => ({
    org_id: orgId,
    framework_slug: slug,
    enabled_at: timestamp,
  }));

  const { error: legacyError } = await admin
    .from('org_frameworks')
    .upsert(legacyPayload, { onConflict: 'org_id,framework_slug' });

  if (legacyError) {
    throw legacyError;
  }
}

async function advanceWelcome() {
  'use server';
  try {
    const { orgId } = await getOrgContext();
    await markStepComplete(orgId, 1, 2);
    redirect('/onboarding?step=2');
  } catch (error) {
    handleOnboardingActionFailure('advanceWelcome', 1, error);
  }
}

async function saveOrgDetails(formData: FormData) {
  'use server';
  try {
    const { orgId, orgRecord } = await getOrgContext();
    const admin = createSupabaseAdminClient();

    const nameRaw = (formData.get('organizationName') as string | null) ?? '';
    const teamSize = (formData.get('teamSize') as string | null) ?? '';
    const planInput = (formData.get('plan') as string | null) ?? '';

    const nameCheck = validateOrganizationName(nameRaw);
    const teamCheck = validateTeamSize(teamSize);
    const planCandidate = planInput || orgRecord?.plan_key || '';
    const planCheck = validatePlan(planCandidate);

    if (!nameCheck.valid) {
      redirect('/onboarding?step=2&error=organisation-name');
    }

    if (!teamCheck.valid) {
      redirect('/onboarding?step=2&error=team-size');
    }

    if (!planCheck.valid) {
      redirect('/onboarding?step=2&error=plan');
    }

    const sanitizedName = sanitizeOrganizationName(nameRaw);
    const resolvedPlan = resolvePlanKey(planCandidate);

    if (!resolvedPlan) {
      redirect('/onboarding?step=2&error=plan');
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
  } catch (error) {
    handleOnboardingActionFailure('saveOrgDetails', 2, error);
  }
}

async function saveIndustrySelection(formData: FormData) {
  'use server';
  try {
    const { orgId, orgRecord, canProvision } = await getOrgContext();
    const admin = createSupabaseAdminClient();
    const industry = (formData.get('industry') as string | null) ?? '';

    const validation = validateIndustry(industry);
    if (!validation.valid) {
      redirect('/onboarding?step=3&error=industry');
    }

    if (!canProvision) {
      redirect('/onboarding?step=3&error=permission');
    }

    await admin.from('organizations').update({ industry }).eq('id', orgId);

    if (!orgRecord?.industry && INDUSTRY_PACKS[industry]) {
      try {
        await applyIndustryPack(industry);
      } catch (error) {
        console.error('Industry pack failed:', error);
      }
    }

    try {
      await onIndustryConfigured(orgId, industry);
    } catch (error) {
      console.warn('[onboarding] industry automation hook failed', error);
    }

    await markStepComplete(orgId, 3, 4);
    redirect('/onboarding?step=4');
  } catch (error) {
    handleOnboardingActionFailure('saveIndustrySelection', 3, error);
  }
}

async function saveRoleSelection(formData: FormData) {
  'use server';
  try {
    const { supabase, orgId, user, orgRecord } = await getOrgContext();
    const roleSelection = (formData.get('role') as string | null) ?? '';
    const outcome = resolveRoleSelectionOutcome(
      roleSelection,
      orgRecord?.frameworks,
    );
    if (!outcome) {
      redirect('/onboarding?step=4&error=role');
    }

    const { error: roleUpdateError } = await supabase
      .from('org_members')
      .update({ role: outcome.option.role })
      .eq('organization_id', orgId)
      .eq('user_id', user.id);

    if (roleUpdateError) {
      // RLS or row-not-found: retry under service-role client. Mirror the
      // pattern used by saveFrameworkSelection so a transient RLS denial
      // does not silently advance the wizard with an unchanged role.
      console.warn(
        '[onboarding] org_members.role update failed; retrying with admin client',
        roleUpdateError,
      );
      const { error: adminRoleUpdateError } = await createSupabaseAdminClient()
        .from('org_members')
        .update({ role: outcome.option.role })
        .eq('organization_id', orgId)
        .eq('user_id', user.id);

      if (adminRoleUpdateError) {
        throw adminRoleUpdateError;
      }
    }

    if (outcome.frameworksToPersist) {
      const { error: orgFrameworksError } = await createSupabaseAdminClient()
        .from('organizations')
        .update({ frameworks: outcome.frameworksToPersist })
        .eq('id', orgId);
      if (orgFrameworksError) {
        throw orgFrameworksError;
      }
    }

    for (const step of outcome.completedSteps) {
      await markStepComplete(orgId, step, step + 1);
    }

    redirect(outcome.redirectPath);
  } catch (error) {
    handleOnboardingActionFailure('saveRoleSelection', 4, error);
  }
}

async function saveFrameworkSelection(formData: FormData) {
  'use server';
  try {
    const { supabase, orgId, canProvision, user, orgRecord } = await getOrgContext();
    const admin = createSupabaseAdminClient();
    const frameworks = formData
      .getAll('frameworks')
      .map((item) => item.toString())
      .filter(Boolean);

    // Audit 2026-05-27 Tier 4.1 — industry-gate framework selection so a
    // SaaS / Financial Services org can't bypass the picker UI to select
    // a framework intended for a different industry.
    const orgIndustry = (orgRecord as { industry?: string | null } | null)?.industry ?? null;
    const validation = validateFrameworks(frameworks, orgIndustry);
    if (!validation.valid) {
      redirect('/onboarding?step=5&error=frameworks');
    }

    if (!canProvision) {
      redirect('/onboarding?step=5&error=permission');
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
      const { error: adminFrameworkUpdateError } = await admin
        .from('organizations')
        .update({ frameworks })
        .eq('id', orgId);

      if (adminFrameworkUpdateError) {
        throw adminFrameworkUpdateError;
      }
    }

    const selectedFrameworks = getProvisioningFrameworkSlugs(frameworks);

    if (selectedFrameworks.length) {
      await upsertSelectedFrameworks(admin, orgId, selectedFrameworks);

      // Defer heavy provisioning to run after the response is sent.
      // This prevents Vercel function timeouts on cold starts with multiple frameworks.
      after(async () => {
        try {
          const provisioningResults = await Promise.allSettled(
            selectedFrameworks.map((slug) =>
              provisionFrameworkControls(orgId, slug, {
                force: true,
                client: admin,
              }),
            ),
          );

          const provisioningFailures = provisioningResults.filter(
            (result) => result.status === 'rejected',
          );

          if (provisioningFailures.length > 0) {
            console.warn(
              '[onboarding] framework provisioning encountered failures',
              {
                orgId,
                failureCount: provisioningFailures.length,
                frameworks: selectedFrameworks,
              },
            );
          }

          await onFrameworksProvisioned(orgId, selectedFrameworks).catch(
            (error) =>
              console.warn(
                '[onboarding] frameworks automation hook failed',
                error,
              ),
          );

          await logProductActivity(
            orgId,
            user.id,
            'created',
            {
              type: 'framework',
              id: selectedFrameworks.join(','),
              name: selectedFrameworks.join(', '),
              path: '/app/compliance/frameworks',
            },
            {
              frameworks: selectedFrameworks,
              source: 'onboarding',
            },
          ).catch((activityErr) =>
            console.warn(
              '[onboarding] activity log failed (non-blocking)',
              activityErr,
            ),
          );
        } catch (err) {
          console.error(
            '[onboarding] deferred framework provisioning failed',
            err,
          );
        }
      });
    }

    await markStepComplete(orgId, 5, 6);
    redirect('/onboarding?step=6');
  } catch (error) {
    handleOnboardingActionFailure('saveFrameworkSelection', 5, error);
  }
}

async function saveInvites(formData: FormData) {
  'use server';
  try {
    const { orgId, orgRecord, user } = await getOrgContext();
    const inviteEmails = parseInviteEmails(
      formData.get('inviteEmails') as string | null,
    );
    const validation = validateInviteEmails(inviteEmails);

    if (!validation.valid) {
      redirect('/onboarding?step=6&error=invite-emails');
    }

    if (validation.validEmails.length > 0) {
      const inviteBase =
        process.env.NEXT_PUBLIC_APP_URL ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        'https://app.formaos.com.au';
      const inviterName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'A team member';
      const inviterEmail =
        user.email ?? process.env.SUPPORT_EMAIL ?? brand.email.contactEmail;

      const inviteResults = await Promise.all(
        validation.validEmails.map(async (email) => {
          const invitation = await createInvitation({
            organizationId: orgId,
            email,
            role: 'member',
            invitedBy: user.id,
          });

          if (!invitation.success || !invitation.data) {
            const errorMessage =
              invitation.error instanceof Error
                ? invitation.error.message
                : String(invitation.error ?? 'Failed to create invitation');

            return {
              email,
              ok: false,
              error: errorMessage,
            };
          }

          const inviteUrl = `${inviteBase.replace(/\/$/, '')}/accept-invite/${invitation.data.token}`;
          const emailResult = await sendEmail({
            type: 'invite',
            to: email,
            inviterName,
            inviterEmail,
            organizationName: orgRecord?.name || 'Organization',
            inviteUrl,
            role: 'member',
            organizationId: orgId,
            userId: user.id,
          });

          return {
            email,
            ok: emailResult.success,
            error: emailResult.success
              ? null
              : (emailResult.error ?? 'Failed to deliver invite email'),
          };
        }),
      );

      const failedInvites = inviteResults.filter((result) => !result.ok);

      if (failedInvites.length > 0) {
        console.warn('[onboarding] invitation creation encountered failures', {
          orgId,
          failureCount: failedInvites.length,
          inviteCount: validation.validEmails.length,
          failedInvites,
        });
        redirect('/onboarding?step=6&error=invite-delivery');
      }
    }

    await markStepComplete(orgId, 6, 7);
    redirect('/onboarding?step=7');
  } catch (error) {
    handleOnboardingActionFailure('saveInvites', 6, error);
  }
}

async function skipInvites() {
  'use server';
  try {
    const { orgId } = await getOrgContext();
    await markStepComplete(orgId, 6, 7);
    redirect('/onboarding?step=7');
  } catch (error) {
    handleOnboardingActionFailure('skipInvites', 6, error);
  }
}

async function completeFirstAction(formData: FormData) {
  'use server';
  try {
    const { supabase, orgId, orgRecord, user } = await getOrgContext();
    const admin = createSupabaseAdminClient();
    const action = (formData.get('firstAction') as string | null) ?? '';

    if (!action) {
      redirect('/onboarding?step=7&error=first-action');
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
      const evaluationResults = await Promise.allSettled(
        frameworks.map((frameworkCode: string) =>
          evaluateFrameworkControls(orgId, frameworkCode),
        ),
      );
      const failedEvaluations = evaluationResults.filter(
        (result) => result.status === 'rejected',
      );

      if (failedEvaluations.length > 0) {
        console.warn('[onboarding] framework evaluation encountered failures', {
          orgId,
          failureCount: failedEvaluations.length,
          frameworkCount: frameworks.length,
        });
      }
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

    const { data: existing } = await admin
      .from('org_onboarding_status')
      .select('completed_steps')
      .eq('organization_id', orgId)
      .maybeSingle();

    const completed = new Set<number>(existing?.completed_steps ?? []);
    completed.add(7);

    await admin.from('org_onboarding_status').upsert({
      organization_id: orgId,
      current_step: 7,
      completed_steps: Array.from(completed).sort((a, b) => a - b),
      first_action: action,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    try {
      await onOnboardingCompleted(orgId);
    } catch (error) {
      console.warn('[onboarding] completion automation hook failed', error);
    }

    try {
      await updateComplianceScoreAndCheckRisk(orgId);
    } catch (error) {
      console.warn('[onboarding] compliance score update failed', error);
    }

    trackActivation('onboarding_completed', {
      industry: orgRecord?.industry ?? undefined,
      role: undefined,
    });

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
  } catch (error) {
    handleOnboardingActionFailure('completeFirstAction', 7, error);
  }
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

  // Authoritative completion signal: organizations.onboarding_completed is
  // set by the server action at the end of step 7. Trust it over derived
  // checks — a transient empty frameworks read (RLS / embedded-join lag)
  // must not trap a finished user back on the wizard.
  const explicitlyCompleted = Boolean(orgRecord?.onboarding_completed);
  const onboardingStatusComplete =
    explicitlyCompleted ||
    Boolean(status.completed_at) ||
    status.completed_steps.includes(TOTAL_STEPS);
  const hasRequiredOnboardingData =
    Boolean(orgRecord?.plan_key) &&
    Boolean(orgRecord?.industry) &&
    Array.isArray(orgRecord?.frameworks) &&
    orgRecord.frameworks.length > 0;

  if (
    explicitlyCompleted ||
    (onboardingStatusComplete && hasRequiredOnboardingData)
  ) {
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

  const errorCode = resolvedSearchParams?.error ?? '';
  const errorMessage = errorCode
    ? (ONBOARDING_ERROR_MESSAGES[errorCode] ?? ONBOARDING_ERROR_FALLBACK)
    : null;
  const fastTrack = resolvedSearchParams?.fast_track === '1';
  const persona = resolvedSearchParams?.persona ?? '';
  const isReadOnlyPersona = isReadOnlyPersonaRole(role, persona);
  const defaultRoleOptionId = getDefaultRoleOptionId(role);
  const planLabel = planKey ? PLAN_CATALOG[planKey].name : 'Plan not selected';
  const completedRatio = (safeStep / TOTAL_STEPS) * 100;
  const journey = resolvedSearchParams?.journey ?? '';
  const firstActionDefault = isReadOnlyPersona
    ? 'review_dashboard'
    : journey === 'prove'
      ? 'upload_evidence'
      : journey === 'evaluate'
        ? 'run_evaluation'
        : 'create_task';

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] font-sans">
      <OnboardingStepTracker step={safeStep} totalSteps={TOTAL_STEPS} />
      <div className="flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          <div className="bg-surface-1 rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl border border-edge-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[hsl(var(--card))]" />

            <div className="mb-8 text-center md:text-left">
              <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--card))] text-foreground flex items-center justify-center mb-6 shadow-xl mx-auto md:mx-0">
                <Building2 className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-semibold text-foreground tracking-tight">
                Set up your workspace
              </h1>
              <p className="text-muted-foreground mt-2 font-medium leading-relaxed text-sm tabular-nums">
                Step {safeStep} of {TOTAL_STEPS} · {planLabel}
              </p>
              <div className="mt-5">
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{ width: `${completedRatio}%` }}
                  />
                </div>
              </div>
              {errorMessage ? (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {errorMessage}
                </div>
              ) : null}
              {fastTrack ? (
                <div className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
                  We have set up sensible defaults for your role, so there is
                  less to fill in here.
                </div>
              ) : null}
            </div>

            {safeStep === 1 ? (
              <form action={advanceWelcome} className="space-y-6">
                <div className="rounded-2xl border border-edge-2 bg-[hsl(var(--card))] p-6 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-base font-semibold text-foreground">
                        Welcome to FormaOS.
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        The next few questions set up your organisation and the
                        standards you have to meet. It takes about three
                        minutes, and you can change any of it later.
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
                <div className="space-y-3">
                  <label
                    htmlFor="organization-name"
                    className="block text-sm font-medium text-foreground"
                  >
                    Organisation name
                  </label>
                  <input
                    required
                    id="organization-name"
                    name="organizationName"
                    defaultValue={orgRecord?.name ?? ''}
                    placeholder="e.g. Northwind Support Services"
                    data-testid="organization-name"
                    className="w-full p-4 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] focus:bg-surface-1 focus:outline-white/20 text-sm font-semibold transition-all shadow-inner"
                  />
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">
                    How many people work here?
                  </legend>
                  <div className="grid gap-3 md:grid-cols-2">
                    {TEAM_SIZE_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] px-4 py-3 text-sm text-foreground"
                      >
                        <input
                          required
                          type="radio"
                          name="teamSize"
                          value={option.id}
                          defaultChecked={orgRecord?.team_size === option.id}
                          data-testid={`team-size-${option.id}`}
                          className="h-4 w-4 border-edge-3 bg-[hsl(var(--card))] text-primary"
                        />
                        <span>{option.label} people</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">
                    Plan
                  </legend>
                  <div className="grid gap-3 md:grid-cols-3">
                    {PLAN_CHOICES.map((option) => (
                      <label
                        key={option.key}
                        className="flex flex-col gap-3 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] px-4 py-4 text-sm text-foreground"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            required
                            type="radio"
                            name="plan"
                            value={option.key}
                            defaultChecked={planKey === option.key}
                            data-testid={`plan-option-${option.key}`}
                            className="h-4 w-4 border-edge-3 bg-[hsl(var(--card))] text-primary"
                          />
                          <span className="text-sm font-semibold text-foreground">
                            {option.name}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {option.summary}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <SubmitButton loadingText="Saving...">Continue</SubmitButton>
              </form>
            ) : null}

            {safeStep === 3 ? (
              <form
                action={saveIndustrySelection}
                className="space-y-8"
                data-testid="onboarding-step-industry"
              >
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">
                    What kind of work do you do?
                  </legend>
                  <div className="grid gap-3 md:grid-cols-2">
                    {INDUSTRY_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] px-4 py-3 text-sm text-foreground"
                      >
                        <input
                          required
                          type="radio"
                          name="industry"
                          value={option.id}
                          defaultChecked={orgRecord?.industry === option.id}
                          data-testid={`industry-option-${option.id}`}
                          className="h-4 w-4 border-edge-3 bg-[hsl(var(--card))] text-primary"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <SubmitButton loadingText="Setting up...">
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
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">
                    How will you use FormaOS?
                  </legend>
                  <div className="grid gap-3 md:grid-cols-2">
                    {ROLE_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className="flex gap-3 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] px-4 py-3 text-sm text-foreground"
                      >
                        <input
                          required
                          type="radio"
                          name="role"
                          value={option.id}
                          defaultChecked={defaultRoleOptionId === option.id}
                          data-testid={`role-option-${option.id}`}
                          className="mt-1 h-4 w-4 border-edge-3 bg-[hsl(var(--card))] text-primary"
                        />
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">
                            {option.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                          <span
                            className={`block text-xs ${
                              option.journey === 'full'
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {option.journey === 'full'
                              ? 'Sets up everything'
                              : option.journey === 'read-only'
                                ? 'View only, nothing to configure'
                                : 'Shorter setup'}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <SubmitButton loadingText="Saving...">Continue</SubmitButton>
              </form>
            ) : null}

            {safeStep === 5 ? (
              <form
                action={saveFrameworkSelection}
                className="space-y-8"
                data-testid="onboarding-step-frameworks"
              >
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">
                    Which standards do you have to meet? Choose at least one.
                  </legend>
                  <div className="grid gap-3 md:grid-cols-2">
                    {frameworkOptionsForIndustry(
                      (orgRecord as { industry?: string | null } | null)?.industry ?? null,
                    ).map((framework) => {
                      const checked = Array.isArray(orgRecord?.frameworks)
                        ? orgRecord?.frameworks.includes(framework.id)
                        : false;
                      return (
                        <label
                          key={framework.id}
                          className="flex items-center gap-3 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] px-4 py-3 text-sm text-foreground"
                        >
                          <input
                            type="checkbox"
                            name="frameworks"
                            value={framework.id}
                            defaultChecked={checked}
                            data-testid={`framework-option-${framework.id}`}
                            className="h-4 w-4 rounded border-edge-3 bg-[hsl(var(--card))] text-primary"
                          />
                          <span>{framework.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <SubmitButton loadingText="Setting up your controls...">
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
                  <label
                    htmlFor="invite-emails"
                    className="block text-sm font-medium text-foreground"
                  >
                    Invite the people you work with
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Optional. You can also invite people later from Settings.
                  </p>
                  <textarea
                    id="invite-emails"
                    name="inviteEmails"
                    rows={4}
                    placeholder="Add emails separated by commas or new lines"
                    data-testid="invite-emails"
                    className="w-full p-4 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] text-sm font-semibold text-foreground"
                  />
                </div>
                <div className="space-y-3">
                  <SubmitButton loadingText="Sending invites...">
                    Send invitations
                  </SubmitButton>
                  <button
                    type="submit"
                    formAction={skipInvites}
                    formNoValidate
                    data-testid="skip-invites"
                    className="w-full rounded-2xl px-8 py-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Skip for now
                  </button>
                </div>
              </form>
            ) : null}

            {safeStep === 7 ? (
              <form
                action={completeFirstAction}
                className="space-y-8"
                data-testid="onboarding-step-first-action"
              >
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">
                    What do you want to do first?
                  </legend>
                  {isReadOnlyPersona ? (
                    <p className="text-sm text-muted-foreground">
                      Your access is view only, so the options here do not
                      change anything in your workspace.
                    </p>
                  ) : null}
                  <div className="space-y-3">
                    {!isReadOnlyPersona ? (
                      <label className="flex items-center gap-3 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] px-4 py-3 text-sm text-foreground">
                        <input
                          type="radio"
                          name="firstAction"
                          value="create_task"
                          data-testid="first-action-create-task"
                          className="h-4 w-4 border-edge-3 bg-[hsl(var(--card))] text-primary"
                          defaultChecked={firstActionDefault === 'create_task'}
                          required
                        />
                        <span>Create your first compliance task</span>
                      </label>
                    ) : null}
                    {!isReadOnlyPersona ? (
                      <label className="flex items-center gap-3 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] px-4 py-3 text-sm text-foreground">
                        <input
                          type="radio"
                          name="firstAction"
                          value="upload_evidence"
                          data-testid="first-action-upload-evidence"
                          className="h-4 w-4 border-edge-3 bg-[hsl(var(--card))] text-primary"
                          defaultChecked={
                            firstActionDefault === 'upload_evidence'
                          }
                        />
                        <span>Set up a task to upload your first evidence</span>
                      </label>
                    ) : null}
                    <label className="flex items-center gap-3 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] px-4 py-3 text-sm text-foreground">
                      <input
                        type="radio"
                        name="firstAction"
                        value="run_evaluation"
                        data-testid="first-action-run-evaluation"
                        className="h-4 w-4 border-edge-3 bg-[hsl(var(--card))] text-primary"
                        defaultChecked={firstActionDefault === 'run_evaluation'}
                        required={isReadOnlyPersona}
                      />
                      <span>Run your first check against those standards</span>
                    </label>
                    {isReadOnlyPersona ? (
                      <label className="flex items-center gap-3 rounded-2xl border border-edge-2 bg-[hsl(var(--card))] px-4 py-3 text-sm text-foreground">
                        <input
                          type="radio"
                          name="firstAction"
                          value="review_dashboard"
                          data-testid="first-action-review-dashboard"
                          className="h-4 w-4 border-edge-3 bg-[hsl(var(--card))] text-primary"
                          defaultChecked={
                            firstActionDefault === 'review_dashboard'
                          }
                        />
                        <span>Open the dashboard and review where you sit</span>
                      </label>
                    ) : null}
                  </div>
                </fieldset>
                <SubmitButton loadingText="Completing setup...">
                  Complete setup
                </SubmitButton>
              </form>
            ) : null}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-edge-2 pt-8 text-sm text-muted-foreground">
              {safeStep > 1 ? (
                <Link
                  href={`/onboarding?step=${safeStep - 1}`}
                  data-testid="onboarding-back"
                  className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
              <p>Your answers are saved as you go.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
