/** @jest-environment jsdom */

import { featureFlags } from '@/lib/feature-flags';

describe('feature flags', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('allows founder testing overrides when founder state is present in localStorage', () => {
    window.localStorage.setItem('formaos_is_founder', 'true');

    featureFlags.setTestingMode({ enableAuditLogging: true });

    expect(
      JSON.parse(
        window.localStorage.getItem('formaos_feature_flags_testing') || '{}',
      ),
    ).toMatchObject({ enableAuditLogging: true });
  });
});
