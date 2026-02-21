/** @jest-environment node */

import { evaluateFeatureDecision } from '@/lib/control-plane/flags';
import type { FeatureFlagRecord } from '@/lib/control-plane/types';

function buildFlag(overrides: Partial<FeatureFlagRecord>): FeatureFlagRecord {
  return {
    id: 'flag-id',
    flag_key: 'test_flag',
    description: null,
    environment: 'production',
    scope_type: 'global',
    scope_id: null,
    enabled: true,
    kill_switch: false,
    rollout_percentage: 100,
    variants: { control: 50, variant: 50 },
    default_variant: 'control',
    start_at: null,
    end_at: null,
    is_public: true,
    created_by: null,
    updated_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('evaluateFeatureDecision', () => {
  it('returns disabled when no flag exists', () => {
    const decision = evaluateFeatureDecision('missing', [], {});

    expect(decision.enabled).toBe(false);
    expect(decision.reason).toBe('not-configured');
  });

  it('respects kill switch', () => {
    const flag = buildFlag({ kill_switch: true, enabled: true });
    const decision = evaluateFeatureDecision('test_flag', [flag], {});

    expect(decision.enabled).toBe(false);
    expect(decision.reason).toBe('kill-switch');
  });

  it('prefers user scope over org and global', () => {
    const globalFlag = buildFlag({ scope_type: 'global', enabled: false });
    const orgFlag = buildFlag({
      id: 'org',
      scope_type: 'organization',
      scope_id: 'org-1',
      enabled: false,
    });
    const userFlag = buildFlag({
      id: 'user',
      scope_type: 'user',
      scope_id: 'user-1',
      enabled: true,
      rollout_percentage: 100,
    });

    const decision = evaluateFeatureDecision(
      'test_flag',
      [globalFlag, orgFlag, userFlag],
      { userId: 'user-1', orgId: 'org-1' },
    );

    expect(decision.enabled).toBe(true);
    expect(decision.scopeType).toBe('user');
  });

  it('enforces rollout percentages', () => {
    const flag = buildFlag({ rollout_percentage: 0 });

    const decision = evaluateFeatureDecision('test_flag', [flag], {
      userId: 'user-rollout-check',
    });

    expect(decision.enabled).toBe(false);
    expect(decision.reason).toBe('outside-rollout');
  });

  it('enforces schedule windows', () => {
    const futureStart = new Date(Date.now() + 60_000).toISOString();
    const flag = buildFlag({ start_at: futureStart, enabled: true });

    const decision = evaluateFeatureDecision('test_flag', [flag], {
      userId: 'user-1',
    });

    expect(decision.enabled).toBe(false);
    expect(decision.reason).toBe('outside-schedule');
  });
});
