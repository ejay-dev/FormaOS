import { isProvisioningRole } from '@/lib/onboarding/roles';

export type OnboardingRole = 'owner' | 'admin' | 'member' | 'viewer';
export type JourneyType = 'full' | 'fast-track' | 'read-only';

export type RoleOption = {
  id: string;
  label: string;
  role: OnboardingRole;
  description: string;
  journey: JourneyType;
};

export const ROLE_OPTIONS = [
  {
    id: 'employer',
    label: 'Employer / Organization owner',
    role: 'owner',
    description:
      'Full governance setup, framework provisioning, and team activation.',
    journey: 'full',
  },
  {
    id: 'compliance_lead',
    label: 'Compliance lead / Admin',
    role: 'admin',
    description:
      'Configure controls and readiness workflows without billing ownership.',
    journey: 'full',
  },
  {
    id: 'employee',
    label: 'Employee / Field staff',
    role: 'member',
    description:
      'Fast-track to assigned tasks, evidence, and day-to-day execution.',
    journey: 'fast-track',
  },
  {
    id: 'external_auditor',
    label: 'External auditor / Viewer',
    role: 'viewer',
    description:
      'Read-only trust and readiness visibility with guided first review.',
    journey: 'read-only',
  },
] as const satisfies readonly RoleOption[];

const DEFAULT_FAST_TRACK_FRAMEWORKS = ['iso27001'] as const;

export type RoleSelectionOutcome = {
  option: RoleOption;
  nextStep: number;
  completedSteps: number[];
  redirectPath: string;
  frameworksToPersist: string[] | null;
};

function normalizeFrameworks(input: readonly string[] | null | undefined) {
  if (!Array.isArray(input)) {
    return [];
  }

  return Array.from(
    new Set(
      input
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
}

export function getRoleOptionById(selection: string | null | undefined) {
  return ROLE_OPTIONS.find((option) => option.id === selection);
}

export function getDefaultRoleOptionId(role: string | null | undefined) {
  return ROLE_OPTIONS.find((option) => option.role === role)?.id ?? 'employer';
}

export function isReadOnlyPersonaRole(
  role: string | null | undefined,
  persona: string | null | undefined,
) {
  return role === 'viewer' || persona === 'viewer';
}

export function resolveRoleSelectionOutcome(
  selection: string | null | undefined,
  currentFrameworks: readonly string[] | null | undefined,
): RoleSelectionOutcome | null {
  const option = getRoleOptionById(selection);
  if (!option) {
    return null;
  }

  if (!isProvisioningRole(option.role)) {
    const frameworks = normalizeFrameworks(currentFrameworks);
    const frameworksToPersist =
      frameworks.length > 0
        ? frameworks
        : Array.from(DEFAULT_FAST_TRACK_FRAMEWORKS);

    return {
      option,
      nextStep: 7,
      completedSteps: [4, 5, 6],
      frameworksToPersist,
      redirectPath: `/onboarding?step=7&fast_track=1&persona=${encodeURIComponent(option.role)}`,
    };
  }

  return {
    option,
    nextStep: 5,
    completedSteps: [4],
    frameworksToPersist: null,
    redirectPath: '/onboarding?step=5',
  };
}
