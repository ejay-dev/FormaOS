/**
 * Tests for lib/billing/entitlement-drift-detector.ts
 */

jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'in',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'gte',
    'lte',
    'gt',
    'lt',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const mockAdmin: Record<string, any> = {
  from: jest.fn(() => createBuilder()),
};

jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(() => mockAdmin),
}));

jest.mock('@/lib/billing/entitlements', () => ({
  PLAN_ENTITLEMENTS: {
    basic: {
      enabled: ['audit_export', 'reports', 'framework_evaluations', 'team_limit'],
      limits: { team_limit: 10 },
    },
    pro: {
      enabled: [
        'audit_export',
        'reports',
        'framework_evaluations',
        'certifications',
        'team_limit',
        'ai_assistant',
        'capa_management',
        'custom_reports',
        'form_analytics',
      ],
      limits: { team_limit: 50 },
    },
    enterprise: {
      enabled: [
        'audit_export',
        'reports',
        'framework_evaluations',
        'certifications',
        'team_limit',
        'ai_assistant',
        'capa_management',
        'custom_reports',
        'form_analytics',
        'workflow_automation',
        'sso_saml',
        'directory_sync',
        'retention_governance',
      ],
      limits: { team_limit: null },
    },
  },
  syncEntitlementsForPlan: jest.fn(),
}));

jest.mock('@/lib/plans', () => ({
  PLAN_CATALOG: {
    basic: { limits: { maxUsers: 10 } },
    pro: { limits: { maxUsers: 50 } },
    enterprise: { limits: { maxUsers: Infinity } },
  },
  resolvePlanKey: jest.fn((key: string) => {
    if (['basic', 'pro', 'enterprise'].includes(key)) return key;
    return null;
  }),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  billingLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import {
  shouldAutoFixEntitlements,
  detectEntitlementDrift,
} from '@/lib/billing/entitlement-drift-detector';
import { syncEntitlementsForPlan } from '@/lib/billing/entitlements';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('shouldAutoFixEntitlements', () => {
  it('returns true for active status', () => {
    expect(shouldAutoFixEntitlements('active')).toBe(true);
  });

  it('returns true for trialing status', () => {
    expect(shouldAutoFixEntitlements('trialing')).toBe(true);
  });

  it('returns false for canceled status', () => {
    expect(shouldAutoFixEntitlements('canceled')).toBe(false);
  });

  it('returns false for null status', () => {
    expect(shouldAutoFixEntitlements(null)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(shouldAutoFixEntitlements('')).toBe(false);
  });
});

describe('detectEntitlementDrift', () => {
  it('returns no drift when subscription not found', async () => {
    mockAdmin.from = jest.fn(() => createBuilder({ data: null, error: null }));

    const result = await detectEntitlementDrift('org-1');
    expect(result.hasDrift).toBe(false);
    expect(result.corrections).toEqual([]);
  });

  it('returns no drift when plan key is invalid', async () => {
    const { resolvePlanKey } = require('@/lib/plans');
    resolvePlanKey.mockReturnValueOnce(null);

    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: { plan_key: 'unknown_plan', status: 'active' },
          error: null,
        });
      }
      return createBuilder();
    });

    const result = await detectEntitlementDrift('org-1');
    expect(result.hasDrift).toBe(false);
  });

  it('detects missing entitlements', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        // subscription
        return createBuilder({
          data: { plan_key: 'basic', status: 'active' },
          error: null,
        });
      }
      // entitlements - empty means all expected are missing
      return createBuilder({ data: [], error: null });
    });

    const result = await detectEntitlementDrift('org-1', false);
    expect(result.hasDrift).toBe(true);
    expect(result.corrections.some((c) => c.type === 'missing')).toBe(true);
  });

  it('detects disabled entitlements', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: { plan_key: 'basic', status: 'active' },
          error: null,
        });
      }
      return createBuilder({
        data: [
          { feature_key: 'audit_export', enabled: false, limit_value: null },
          { feature_key: 'reports', enabled: true, limit_value: null },
          {
            feature_key: 'framework_evaluations',
            enabled: true,
            limit_value: null,
          },
          { feature_key: 'team_limit', enabled: true, limit_value: 10 },
        ],
        error: null,
      });
    });

    const result = await detectEntitlementDrift('org-1', false);
    expect(result.hasDrift).toBe(true);
    const disabled = result.corrections.find((c) => c.type === 'disabled');
    expect(disabled).toBeTruthy();
    expect(disabled!.featureKey).toBe('audit_export');
  });

  it('detects limit mismatch', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: { plan_key: 'basic', status: 'active' },
          error: null,
        });
      }
      return createBuilder({
        data: [
          { feature_key: 'audit_export', enabled: true, limit_value: null },
          { feature_key: 'reports', enabled: true, limit_value: null },
          {
            feature_key: 'framework_evaluations',
            enabled: true,
            limit_value: null,
          },
          { feature_key: 'team_limit', enabled: true, limit_value: 999 }, // Wrong limit
        ],
        error: null,
      });
    });

    const result = await detectEntitlementDrift('org-1', false);
    expect(result.hasDrift).toBe(true);
    const mismatch = result.corrections.find(
      (c) => c.type === 'limit_mismatch',
    );
    expect(mismatch).toBeTruthy();
    expect(mismatch!.actual).toBe(999);
  });

  it('detects extra entitlements', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: { plan_key: 'basic', status: 'active' },
          error: null,
        });
      }
      return createBuilder({
        data: [
          { feature_key: 'audit_export', enabled: true, limit_value: null },
          { feature_key: 'reports', enabled: true, limit_value: null },
          {
            feature_key: 'framework_evaluations',
            enabled: true,
            limit_value: null,
          },
          { feature_key: 'team_limit', enabled: true, limit_value: 10 },
          { feature_key: 'super_premium', enabled: true, limit_value: null }, // Extra
        ],
        error: null,
      });
    });

    const result = await detectEntitlementDrift('org-1', false);
    expect(result.hasDrift).toBe(true);
    const extra = result.corrections.find((c) => c.type === 'extra');
    expect(extra).toBeTruthy();
    expect(extra!.featureKey).toBe('super_premium');
  });

  it('auto-fixes drift when enabled and status is active', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: { plan_key: 'basic', status: 'active' },
          error: null,
        });
      }
      // call 2: pre-fix entitlements (empty → all four basic features missing)
      if (callCount === 2) return createBuilder({ data: [], error: null });
      // call 3: post-sync re-fetch. syncEntitlementsForPlan is mocked, so we
      // simulate the DB state it would have produced — all basic features now
      // enabled. The detector re-verifies against this before marking fixed.
      return createBuilder({
        data: [
          { feature_key: 'audit_export', enabled: true, limit_value: null },
          { feature_key: 'reports', enabled: true, limit_value: null },
          {
            feature_key: 'framework_evaluations',
            enabled: true,
            limit_value: null,
          },
          { feature_key: 'team_limit', enabled: true, limit_value: 10 },
        ],
        error: null,
      });
    });

    const result = await detectEntitlementDrift('org-1', true);
    expect(result.autoFixed).toBe(true);
    expect(syncEntitlementsForPlan).toHaveBeenCalled();
    expect(result.corrections.every((c) => c.corrected)).toBe(true);
  });

  it('does NOT mark corrections fixed when sync fails to resolve them', async () => {
    // Regression guard for the old bug: the detector used to mark every
    // correction corrected=true even when sync left the drift in place.
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: { plan_key: 'basic', status: 'active' },
          error: null,
        });
      }
      // Pre-fix AND post-sync both empty → nothing was actually resolved.
      return createBuilder({ data: [], error: null });
    });

    const result = await detectEntitlementDrift('org-1', true);
    expect(syncEntitlementsForPlan).toHaveBeenCalled();
    expect(result.corrections.every((c) => c.corrected)).toBe(false);
    expect(result.autoFixed).toBe(false);
  });

  it('does not auto-fix when status is canceled', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: { plan_key: 'basic', status: 'canceled' },
          error: null,
        });
      }
      return createBuilder({ data: [], error: null });
    });

    const result = await detectEntitlementDrift('org-1', true);
    expect(result.autoFixed).toBe(false);
    expect(syncEntitlementsForPlan).not.toHaveBeenCalled();
  });

  it('throws on entitlement fetch error', async () => {
    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: { plan_key: 'basic', status: 'active' },
          error: null,
        });
      }
      return createBuilder({
        data: null,
        error: { message: 'DB connection error' },
      });
    });

    await expect(detectEntitlementDrift('org-1')).rejects.toThrow(
      'Failed to fetch entitlements',
    );
  });

  it('handles auto-fix failure gracefully', async () => {
    (syncEntitlementsForPlan as jest.Mock).mockRejectedValueOnce(
      new Error('sync failed'),
    );

    let callCount = 0;
    mockAdmin.from = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({
          data: { plan_key: 'basic', status: 'active' },
          error: null,
        });
      }
      return createBuilder({ data: [], error: null });
    });

    const result = await detectEntitlementDrift('org-1', true);
    // Should not throw, but corrections won't be marked as corrected
    expect(result.hasDrift).toBe(true);
    expect(result.autoFixed).toBe(false);
  });
});
