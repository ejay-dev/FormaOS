import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ensureUserProvisioning } from '@/lib/provisioning/ensure-provisioning';

const TOTAL_ONBOARDING_STEPS = 7;

type MembershipRow = {
  organization_id: string | null;
  role: string | null;
};

type OrganizationRow = {
  id: string;
  name: string | null;
  plan_key: string | null;
  industry: string | null;
  frameworks: string[] | null;
  onboarding_completed: boolean | null;
};

type OnboardingStatusRow = {
  organization_id: string;
  current_step: number | null;
  completed_steps: number[] | null;
  completed_at: string | null;
};

export type OnboardingSnapshot = {
  hasPlan: boolean;
  hasIndustry: boolean;
  hasFrameworks: boolean;
  hasRole: boolean;
  onboardingCompleted: boolean;
  storedStep: number | null;
};

export type WorkspaceRecoveryResult = {
  ok: boolean;
  nextPath: string;
  organizationId: string | null;
  onboardingStep: number;
  onboardingComplete: boolean;
  missingRecords: string[];
  actions: string[];
};

function clampStep(step: number) {
  if (!Number.isFinite(step)) return 1;
  return Math.min(Math.max(Math.trunc(step), 1), TOTAL_ONBOARDING_STEPS);
}

export function deriveOnboardingStep(snapshot: OnboardingSnapshot): number {
  if (!snapshot.hasPlan) return 2;
  if (!snapshot.hasIndustry) return 3;
  if (!snapshot.hasRole) return 4;
  if (!snapshot.hasFrameworks) return 5;
  return clampStep(snapshot.storedStep ?? 1);
}

export function isOnboardingComplete(snapshot: OnboardingSnapshot): boolean {
  return Boolean(
    snapshot.onboardingCompleted &&
      snapshot.hasPlan &&
      snapshot.hasIndustry &&
      snapshot.hasFrameworks &&
      snapshot.hasRole,
  );
}

export async function recoverUserWorkspace({
  userId,
  userEmail,
  source,
}: {
  userId: string;
  userEmail?: string | null;
  source: string;
}): Promise<WorkspaceRecoveryResult> {
  const admin = createSupabaseAdminClient();
  const actions: string[] = [];
  const missingRecords: string[] = [];

  try {
    const provision = await ensureUserProvisioning({
      userId,
      email: userEmail ?? null,
    });
    actions.push(...provision.actions);

    if (!provision.ok) {
      // Fallback path for DB-level self-healing when app-level provisioning failed.
      const rpcResult = await admin.rpc('rpc_bootstrap_user', {
        p_user_id: userId,
        p_user_email: userEmail ?? null,
      });
      if (!rpcResult.error) {
        actions.push('rpc_bootstrap_user');
      }
    }
  } catch (error) {
    console.error('[BOOTSTRAP_RECOVERY] provisioning failed', {
      source,
      userId,
      error,
    });
  }

  const { data: membershipData, error: membershipError } = await admin
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError || !membershipData?.organization_id) {
    missingRecords.push('org_members');
    console.error('[BOOTSTRAP_RECOVERY] membership missing after recovery', {
      source,
      userId,
      membershipError,
    });
    return {
      ok: false,
      nextPath: '/auth/signin',
      organizationId: null,
      onboardingStep: 1,
      onboardingComplete: false,
      missingRecords,
      actions,
    };
  }

  const membership = membershipData as MembershipRow;
  const organizationId = membership.organization_id;

  if (!membership.role) {
    await admin
      .from('org_members')
      .update({ role: 'member' })
      .eq('organization_id', organizationId)
      .eq('user_id', userId);
    actions.push('role_backfilled');
  }

  const { data: orgData } = await admin
    .from('organizations')
    .select('id, name, plan_key, industry, frameworks, onboarding_completed')
    .eq('id', organizationId)
    .maybeSingle();

  if (!orgData?.id) {
    missingRecords.push('organizations');
    return {
      ok: false,
      nextPath: '/auth/signin',
      organizationId,
      onboardingStep: 1,
      onboardingComplete: false,
      missingRecords,
      actions,
    };
  }

  const organization = orgData as OrganizationRow;
  const hasPlan = Boolean(organization.plan_key);
  const hasIndustry = Boolean(organization.industry);
  const frameworks = Array.isArray(organization.frameworks)
    ? organization.frameworks.filter(Boolean)
    : [];
  const hasFrameworks = frameworks.length > 0;

  if (!hasPlan) missingRecords.push('organizations.plan_key');
  if (!hasIndustry) missingRecords.push('organizations.industry');
  if (!hasFrameworks) missingRecords.push('organizations.frameworks');
  if (!membership.role) missingRecords.push('org_members.role');

  const { data: statusData } = await admin
    .from('org_onboarding_status')
    .select('organization_id, current_step, completed_steps, completed_at')
    .eq('organization_id', organizationId)
    .maybeSingle();

  const status = (statusData as OnboardingStatusRow | null) ?? null;
  const onboardingSnapshot: OnboardingSnapshot = {
    hasPlan,
    hasIndustry,
    hasFrameworks,
    hasRole: Boolean(membership.role),
    onboardingCompleted: Boolean(organization.onboarding_completed),
    storedStep: status?.current_step ?? null,
  };
  const onboardingComplete = isOnboardingComplete(onboardingSnapshot);
  const onboardingStep = deriveOnboardingStep(onboardingSnapshot);

  if (!status?.organization_id) {
    await admin.from('org_onboarding_status').upsert({
      organization_id: organizationId,
      current_step: onboardingStep,
      completed_steps: [],
      updated_at: new Date().toISOString(),
    });
    actions.push('onboarding_status_created');
  } else if (!onboardingComplete && status.current_step !== onboardingStep) {
    await admin
      .from('org_onboarding_status')
      .update({
        current_step: onboardingStep,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId);
    actions.push('onboarding_step_repaired');
  }

  if (!onboardingComplete && organization.onboarding_completed) {
    await admin
      .from('organizations')
      .update({ onboarding_completed: false })
      .eq('id', organizationId);
    actions.push('onboarding_flag_repaired');
  }

  const nextPath = onboardingComplete ? '/app' : `/onboarding?step=${onboardingStep}`;

  console.log('[BOOTSTRAP_RECOVERY]', {
    source,
    userId,
    organizationId,
    onboardingStep,
    onboardingComplete,
    missingRecords,
    actions,
    nextPath,
  });

  return {
    ok: true,
    nextPath,
    organizationId,
    onboardingStep,
    onboardingComplete,
    missingRecords,
    actions,
  };
}
