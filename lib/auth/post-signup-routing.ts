/**
 * Deterministic post-signup routing logic
 */

export function getPostSignupRoute(onboardingCompleted: boolean): string {
  if (!onboardingCompleted) {
    return '/app/onboarding';
  }
  return '/app/dashboard';
}
