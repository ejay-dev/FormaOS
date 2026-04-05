/**
 * Tests for lib/auth/post-signup-routing.ts
 */

import { getPostSignupRoute } from '@/lib/auth/post-signup-routing';

describe('getPostSignupRoute', () => {
  it('returns onboarding when not completed', () => {
    expect(getPostSignupRoute(false)).toBe('/app/onboarding');
  });

  it('returns dashboard when completed', () => {
    expect(getPostSignupRoute(true)).toBe('/app/dashboard');
  });
});
