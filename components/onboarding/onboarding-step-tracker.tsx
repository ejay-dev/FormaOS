'use client';

import { useEffect, useRef } from 'react';
import {
  trackActivation,
  trackOnboardingStep,
} from '@/lib/analytics/activation-telemetry';

const STEP_NAMES: Record<number, string> = {
  1: 'welcome',
  2: 'organization_details',
  3: 'industry_selection',
  4: 'role_selection',
  5: 'framework_selection',
  6: 'team_invites',
  7: 'first_action',
};

/**
 * Lightweight client component that fires PostHog events
 * on step mount. Drop into the server-rendered onboarding
 * page to bridge the telemetry gap.
 */
export function OnboardingStepTracker({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  const mountTimeRef = useRef(Date.now());
  const trackedStepRef = useRef<number | null>(null);

  useEffect(() => {
    if (trackedStepRef.current === step) return;
    trackedStepRef.current = step;

    const stepName = STEP_NAMES[step] ?? `step_${step}`;

    if (step === 1) {
      trackActivation('onboarding_started', { totalSteps });
    }

    trackOnboardingStep(step, stepName, mountTimeRef.current, { totalSteps });

    // Reset mount time for next step timing
    mountTimeRef.current = Date.now();
  }, [step, totalSteps]);

  return null;
}
