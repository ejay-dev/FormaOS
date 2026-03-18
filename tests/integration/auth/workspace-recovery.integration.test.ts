import {
  deriveOnboardingStep,
  isOnboardingComplete,
  type OnboardingSnapshot,
} from '@/lib/provisioning/workspace-recovery';

describe('workspace recovery onboarding inference', () => {
  const baseSnapshot: OnboardingSnapshot = {
    hasPlan: true,
    hasIndustry: true,
    hasFrameworks: true,
    hasRole: true,
    onboardingCompleted: true,
    storedStep: 7,
  };

  it('keeps complete users on /app', () => {
    expect(isOnboardingComplete(baseSnapshot)).toBe(true);
    expect(deriveOnboardingStep(baseSnapshot)).toBe(7);
  });

  it('routes users missing plan back to step 2+', () => {
    const snapshot: OnboardingSnapshot = {
      ...baseSnapshot,
      hasPlan: false,
      onboardingCompleted: false,
      storedStep: 1,
    };

    expect(isOnboardingComplete(snapshot)).toBe(false);
    expect(deriveOnboardingStep(snapshot)).toBe(2);
  });

  it('routes users missing role to step 4+', () => {
    const snapshot: OnboardingSnapshot = {
      ...baseSnapshot,
      hasRole: false,
      onboardingCompleted: false,
      storedStep: 2,
    };

    expect(isOnboardingComplete(snapshot)).toBe(false);
    expect(deriveOnboardingStep(snapshot)).toBe(4);
  });

  it('treats onboarding flag true as incomplete when frameworks are missing', () => {
    const snapshot: OnboardingSnapshot = {
      ...baseSnapshot,
      hasFrameworks: false,
      onboardingCompleted: true,
      storedStep: 7,
    };

    expect(isOnboardingComplete(snapshot)).toBe(false);
    expect(deriveOnboardingStep(snapshot)).toBe(5);
  });
});
