'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type {
  FirstSessionState,
  FirstSessionStepId,
} from '@/lib/onboarding/first-session';

type OnboardingContextValue = {
  state: FirstSessionState | null;
  isActive: boolean;
  nextStepId: FirstSessionStepId | null;
  freshlyCompletedSteps: FirstSessionStepId[];
};

const OnboardingContext = createContext<OnboardingContextValue>({
  state: null,
  isActive: false,
  nextStepId: null,
  freshlyCompletedSteps: [],
});

export function OnboardingProvider({
  state,
  children,
}: {
  state: FirstSessionState | null;
  children: ReactNode;
}) {
  const isActive = Boolean(state?.isFirstSession);
  const nextStepId = state?.nextStep?.id ?? null;
  const freshlyCompletedSteps = state?.freshlyCompletedSteps ?? [];
  return (
    <OnboardingContext.Provider
      value={{ state, isActive, nextStepId, freshlyCompletedSteps }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
