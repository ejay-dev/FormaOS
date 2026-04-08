/**
 * Tests for lib/analytics/churn-signals.ts
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: jest.fn(),
}));

function createBuilder(result: any = { data: null, error: null, count: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'gte',
    'lt',
    'lte',
    'in',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'head',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

const { createSupabaseAdminClient } = require('@/lib/supabase/admin');

import {
  getChurnRiskScore,
  getChurnSignals,
  getTrialHealthScore,
} from '@/lib/analytics/churn-signals';

beforeEach(() => jest.clearAllMocks());

describe('getChurnSignals', () => {
  it('returns critical login decline when > 50% drop', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        // 1st: recentLogins = 20, 2nd: priorLogins = 100 -> -80%
        if (callCount === 1)
          return createBuilder({ count: 20, data: null, error: null });
        if (callCount === 2)
          return createBuilder({ count: 100, data: null, error: null });
        // 3rd: weekActivity = 5
        if (callCount === 3)
          return createBuilder({ count: 5, data: null, error: null });
        // 4th: support tickets = 0
        if (callCount === 4)
          return createBuilder({ count: 0, data: null, error: null });
        // 5th: org data
        if (callCount === 5)
          return createBuilder({
            data: {
              created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
            },
            error: null,
          });
        return createBuilder({ count: 0, data: null, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const signals = await getChurnSignals('org-1');
    expect(
      signals.some(
        (s) => s.signal === 'login_decline' && s.severity === 'critical',
      ),
    ).toBe(true);
  });

  it('returns high login decline when 25-50% drop', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ count: 60, data: null, error: null }); // recent
        if (callCount === 2)
          return createBuilder({ count: 100, data: null, error: null }); // prior -> -40%
        if (callCount === 3)
          return createBuilder({ count: 5, data: null, error: null }); // week activity
        if (callCount === 4)
          return createBuilder({ count: 0, data: null, error: null }); // tickets
        if (callCount === 5)
          return createBuilder({
            data: { created_at: new Date().toISOString() },
            error: null,
          });
        return createBuilder({ count: 100, data: null, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const signals = await getChurnSignals('org-1');
    expect(
      signals.some(
        (s) => s.signal === 'login_decline' && s.severity === 'high',
      ),
    ).toBe(true);
  });

  it('returns no_recent_activity when 0 events in 7 days', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ count: 0, data: null, error: null });
        if (callCount === 2)
          return createBuilder({ count: 0, data: null, error: null });
        if (callCount === 3)
          return createBuilder({ count: 0, data: null, error: null }); // week = 0
        if (callCount === 4)
          return createBuilder({ count: 0, data: null, error: null });
        if (callCount === 5) return createBuilder({ data: null, error: null });
        return createBuilder({ count: 0, data: null, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const signals = await getChurnSignals('org-1');
    expect(signals.some((s) => s.signal === 'no_recent_activity')).toBe(true);
  });

  it('returns support_spike when > 5 tickets', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ count: 50, data: null, error: null });
        if (callCount === 2)
          return createBuilder({ count: 50, data: null, error: null });
        if (callCount === 3)
          return createBuilder({ count: 5, data: null, error: null });
        if (callCount === 4)
          return createBuilder({ count: 10, data: null, error: null }); // tickets > 5
        if (callCount === 5)
          return createBuilder({
            data: { created_at: new Date().toISOString() },
            error: null,
          });
        return createBuilder({ count: 0, data: null, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const signals = await getChurnSignals('org-1');
    expect(signals.some((s) => s.signal === 'support_spike')).toBe(true);
  });

  it('detects stalled onboarding for org aged 15-59 days with < 20 events', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount <= 4)
          return createBuilder({ count: 0, data: null, error: null });
        if (callCount === 5)
          return createBuilder({
            data: {
              created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
            },
            error: null,
          });
        if (callCount === 6)
          return createBuilder({ count: 5, data: null, error: null }); // total events < 20
        return createBuilder({ count: 0, data: null, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const signals = await getChurnSignals('org-1');
    expect(signals.some((s) => s.signal === 'stalled_onboarding')).toBe(true);
  });
});

describe('getChurnRiskScore', () => {
  it('returns weighted score capped at 100', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({ count: 0, data: null, error: null });
        if (callCount === 2)
          return createBuilder({ count: 0, data: null, error: null });
        if (callCount === 3)
          return createBuilder({ count: 0, data: null, error: null });
        if (callCount === 4)
          return createBuilder({ count: 0, data: null, error: null });
        if (callCount === 5) return createBuilder({ data: null, error: null });
        return createBuilder({ count: 0, data: null, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const score = await getChurnRiskScore('org-1');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getTrialHealthScore', () => {
  it('returns null when not on trial plan', async () => {
    const client = {
      from: jest.fn(() =>
        createBuilder({
          data: { created_at: new Date().toISOString(), plan: 'pro' },
          error: null,
        }),
      ),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const result = await getTrialHealthScore('org-1');
    expect(result).toBeNull();
  });

  it('returns null when org not found', async () => {
    const client = {
      from: jest.fn(() => createBuilder({ data: null, error: null })),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const result = await getTrialHealthScore('org-1');
    expect(result).toBeNull();
  });

  it('returns health score for trial org', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: {
              created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
              plan: 'trial',
            },
            error: null,
          });
        if (callCount === 2)
          return createBuilder({ count: 3, data: null, error: null }); // controls
        if (callCount === 3)
          return createBuilder({ count: 2, data: null, error: null }); // evidence
        if (callCount === 4)
          return createBuilder({ count: 4, data: null, error: null }); // members > 1
        return createBuilder({ count: 0, data: null, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const result = await getTrialHealthScore('org-1');
    expect(result).toBeDefined();
    expect(result!.daysInTrial).toBe(5);
    expect(result!.daysRemaining).toBe(9);
    expect(result!.activationPercent).toBe(100);
    expect(result!.milestones.created_control).toBe(true);
    expect(result!.milestones.uploaded_evidence).toBe(true);
    expect(result!.milestones.invited_team).toBe(true);
  });

  it('returns partial milestones', async () => {
    let callCount = 0;
    const client = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1)
          return createBuilder({
            data: {
              created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
              plan: 'trial',
            },
            error: null,
          });
        if (callCount === 2)
          return createBuilder({ count: 0, data: null, error: null }); // no controls
        if (callCount === 3)
          return createBuilder({ count: 0, data: null, error: null }); // no evidence
        if (callCount === 4)
          return createBuilder({ count: 1, data: null, error: null }); // only 1 member
        return createBuilder({ count: 0, data: null, error: null });
      }),
    };
    createSupabaseAdminClient.mockReturnValue(client);
    const result = await getTrialHealthScore('org-1');
    expect(result).toBeDefined();
    expect(result!.daysRemaining).toBe(0);
    expect(result!.activationPercent).toBe(0);
    expect(result!.milestones.created_control).toBe(false);
  });
});
