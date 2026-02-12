/**
 * =========================================================
 * ACTIVATION TELEMETRY
 * =========================================================
 *
 * Tracks user activation milestones for onboarding analytics.
 * Uses PostHog for event tracking when available, falls back
 * to console logging in development.
 *
 * Milestone Model (First-Week Activation):
 *   Day 0: Enable framework
 *   Day 1: Map first evidence
 *   Day 2: Generate executive report
 *
 * Integration: Import and call these helpers from onboarding
 * components and key app actions.
 */

type ActivationEvent =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'framework_enabled'
  | 'first_evidence_mapped'
  | 'first_policy_created'
  | 'first_team_member_invited'
  | 'first_report_generated'
  | 'first_control_mapped'
  | 'first_task_created'
  | 'first_audit_export'
  | 'activation_milestone_day0'
  | 'activation_milestone_day1'
  | 'activation_milestone_day2'
  | 'onboarding_drop_off';

interface ActivationProperties {
  step?: number;
  stepName?: string;
  framework?: string;
  industry?: string;
  role?: string;
  timeSpentMs?: number;
  milestone?: string;
  daysSinceSignup?: number;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an activation event
 * Uses PostHog if available, otherwise logs to console in dev
 */
export function trackActivation(
  event: ActivationEvent,
  properties?: ActivationProperties,
): void {
  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    source: 'activation_telemetry',
  };

  // PostHog tracking (client-side)
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(event, enrichedProperties);
    return;
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Activation] ${event}`, enrichedProperties);
  }
}

/**
 * Track onboarding step completion with timing
 */
export function trackOnboardingStep(
  step: number,
  stepName: string,
  startTime: number,
  metadata?: Record<string, string | number | boolean>,
): void {
  trackActivation('onboarding_step_completed', {
    step,
    stepName,
    timeSpentMs: Date.now() - startTime,
    ...metadata,
  });
}

/**
 * Track first-week milestone achievement
 */
export function trackMilestone(
  milestone: 'day0' | 'day1' | 'day2',
  properties?: ActivationProperties,
): void {
  const milestoneEvents: Record<string, ActivationEvent> = {
    day0: 'activation_milestone_day0',
    day1: 'activation_milestone_day1',
    day2: 'activation_milestone_day2',
  };

  trackActivation(milestoneEvents[milestone], {
    milestone,
    ...properties,
  });
}

/**
 * Calculate activation confidence score (0-100)
 * Based on which milestones have been completed
 */
export interface ActivationState {
  frameworkEnabled: boolean;
  evidenceMapped: boolean;
  policyCreated: boolean;
  teamInvited: boolean;
  reportGenerated: boolean;
  controlMapped: boolean;
}

export function calculateActivationScore(state: ActivationState): number {
  const weights: Record<keyof ActivationState, number> = {
    frameworkEnabled: 25,
    evidenceMapped: 20,
    policyCreated: 15,
    teamInvited: 15,
    reportGenerated: 15,
    controlMapped: 10,
  };

  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (state[key as keyof ActivationState]) {
      score += weight;
    }
  }

  return score;
}

/**
 * Get human-readable activation status
 */
export function getActivationStatus(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: 'Audit Ready',
      color: 'success',
      description: 'Your organization is well on its way to audit readiness.',
    };
  }
  if (score >= 50) {
    return {
      label: 'Making Progress',
      color: 'warning',
      description:
        'Good start! Complete a few more milestones to reach audit-ready status.',
    };
  }
  if (score >= 20) {
    return {
      label: 'Getting Started',
      color: 'info',
      description:
        "You've taken the first steps. Keep going to build your compliance posture.",
    };
  }
  return {
    label: 'Just Began',
    color: 'muted',
    description:
      'Enable a framework and start mapping evidence to begin your compliance journey.',
  };
}
