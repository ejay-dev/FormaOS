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

type FrameworkRow = {
  framework_slug: string | null;
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

function pickPrimaryMembership<
  T extends { role?: string | null; organization_id?: string | null },
>(
  memberships: T[],
): T | null {
  if (!memberships.length) return null;
  const weight = (role?: string | null) => {
    const normalized = (role ?? '').toLowerCase();
    if (normalized === 'owner') return 3;
    if (normalized === 'admin') return 2;
    return 1;
  };
  return (
    memberships
      .slice()
      .sort((a, b) => weight(b.role) - weight(a.role))
      .at(0) ??
    memberships[0]
  );
}

function clampStep(step: number) {
  if (!Number.isFinite(step)) return 1;
  return Math.min(Math.max(Math.trunc(step), 1), TOTAL_ONBOARDING_STEPS);
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

async function resolveFrameworksForOrganization(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  organizationFrameworks: unknown,
) {
  const directFrameworks = normalizeFrameworks(organizationFrameworks);
  if (directFrameworks.length > 0) {
    return {
      frameworks: directFrameworks,
      repairedFromOrgFrameworks: false,
    };
  }

  const { data: frameworkRows } = await admin
    .from('org_frameworks')
    .select('framework_slug')
    .eq('org_id', organizationId)
    .limit(100);

  const fallbackFrameworks = normalizeFrameworks(
    (frameworkRows as FrameworkRow[] | null)?.map((row) => row.framework_slug),
  );

  if (!fallbackFrameworks.length) {
    return {
      frameworks: [],
      repairedFromOrgFrameworks: false,
    };
  }

  const { error: backfillError } = await admin
    .from('organizations')
    .update({ frameworks: fallbackFrameworks })
    .eq('id', organizationId);

  return {
    frameworks: fallbackFrameworks,
    repairedFromOrgFrameworks: !backfillError,
  };
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

  const { data: membershipRows, error: membershipError } = await admin
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .limit(50);

  if ((membershipRows?.length ?? 0) > 1) {
    console.warn('[BOOTSTRAP_RECOVERY] multiple memberships detected', {
      source,
      userId,
      count: membershipRows?.length ?? 0,
    });
  }

  const membershipData = pickPrimaryMembership(membershipRows ?? []);

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
  const organizationId = membership.organization_id as string;

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
  const frameworkResolution = await resolveFrameworksForOrganization(
    admin,
    organizationId,
    organization.frameworks,
  );
  if (frameworkResolution.repairedFromOrgFrameworks) {
    actions.push('frameworks_backfilled_from_org_frameworks');
  }
  const frameworks = frameworkResolution.frameworks;
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
  const statusMarkedComplete = Boolean(status?.completed_at) ||
    Boolean(status?.completed_steps?.includes(TOTAL_ONBOARDING_STEPS));
  let onboardingCompletedFlag = Boolean(organization.onboarding_completed);
  const onboardingCanBeCompleted =
    hasPlan && hasIndustry && hasFrameworks && Boolean(membership.role);

  if (!onboardingCompletedFlag && onboardingCanBeCompleted && statusMarkedComplete) {
    const { error: promoteError } = await admin
      .from('organizations')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (!promoteError) {
      onboardingCompletedFlag = true;
      actions.push('onboarding_flag_promoted');
    }
  }

  const onboardingSnapshot: OnboardingSnapshot = {
    hasPlan,
    hasIndustry,
    hasFrameworks,
    hasRole: Boolean(membership.role),
    onboardingCompleted: onboardingCompletedFlag,
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

  if (!onboardingComplete && onboardingCompletedFlag) {
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
