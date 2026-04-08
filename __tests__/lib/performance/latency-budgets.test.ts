jest.mock('@/lib/observability/structured-logger', () => ({
  apiLogger: { warn: jest.fn() },
}));

import {
  checkBudgetViolation,
  getBudget,
  getJobTimeout,
  logBudgetViolation,
  trackLatency,
  withTimeout,
  withJobTimeout,
  LATENCY_BUDGETS,
  JOB_TIMEOUTS,
} from '@/lib/performance/latency-budgets';

const { apiLogger } = require('@/lib/observability/structured-logger');

beforeEach(() => jest.clearAllMocks());

describe('checkBudgetViolation', () => {
  it('returns false when endpoint has no budget', () => {
    expect(checkBudgetViolation('unknown/endpoint', 9999)).toBe(false);
  });

  it('returns false when latency is within p95 budget', () => {
    expect(checkBudgetViolation('auth/session', 50)).toBe(false);
  });

  it('returns true when latency exceeds p95 budget', () => {
    expect(checkBudgetViolation('auth/session', 150)).toBe(true);
  });

  it('checks against p99 when specified', () => {
    // auth/session p99 = 200
    expect(checkBudgetViolation('auth/session', 150, 'p99')).toBe(false);
    expect(checkBudgetViolation('auth/session', 250, 'p99')).toBe(true);
  });

  it('returns false at exact budget boundary', () => {
    expect(checkBudgetViolation('auth/session', 100)).toBe(false);
  });
});

describe('getBudget', () => {
  it('returns budget for known endpoint', () => {
    const budget = getBudget('auth/session');
    expect(budget).toEqual({ p95: 100, p99: 200 });
  });

  it('returns null for unknown endpoint', () => {
    expect(getBudget('nonexistent')).toBeNull();
  });
});

describe('getJobTimeout', () => {
  it('returns timeout for known job', () => {
    expect(getJobTimeout('compliance_score_update')).toBe(30000);
  });

  it('returns default for unknown job', () => {
    expect(getJobTimeout('mystery_job')).toBe(60000);
  });

  it('returns enterprise_export timeout', () => {
    expect(getJobTimeout('enterprise_export')).toBe(300000);
  });
});

describe('logBudgetViolation', () => {
  it('logs warning severity for p95 violations', () => {
    logBudgetViolation('auth/session', 150, { p95: 100, p99: 200 });
    expect(apiLogger.warn).toHaveBeenCalledWith(
      'latency_budget_exceeded:auth/session',
      expect.objectContaining({
        latencyMs: 150,
        severity: 'warning',
        exceedsP95By: 50,
        exceedsP99By: 0,
      }),
    );
  });

  it('logs critical severity for p99 violations', () => {
    logBudgetViolation('auth/session', 300, { p95: 100, p99: 200 });
    expect(apiLogger.warn).toHaveBeenCalledWith(
      'latency_budget_exceeded:auth/session',
      expect.objectContaining({
        severity: 'critical',
        exceedsP99By: 100,
      }),
    );
  });
});

describe('trackLatency', () => {
  it('returns withinBudget true for unknown endpoints', () => {
    expect(trackLatency('unknown', 9999)).toEqual({ withinBudget: true });
  });

  it('returns withinBudget true when under p95', () => {
    const result = trackLatency('auth/session', 50);
    expect(result.withinBudget).toBe(true);
    expect(result.budget).toEqual({ p95: 100, p99: 200 });
    expect(apiLogger.warn).not.toHaveBeenCalled();
  });

  it('returns withinBudget false and logs when over p95', () => {
    const result = trackLatency('auth/session', 150);
    expect(result.withinBudget).toBe(false);
    expect(apiLogger.warn).toHaveBeenCalled();
  });
});

describe('withTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns promise result when it resolves before timeout', async () => {
    const result = withTimeout(Promise.resolve('ok'), 5000, 'test-job');
    jest.advanceTimersByTime(100);
    await expect(result).resolves.toBe('ok');
  });

  it('returns timeout object when promise is too slow', async () => {
    const slow = new Promise(() => {}); // never resolves
    const result = withTimeout(slow, 100, 'slow-job');
    jest.advanceTimersByTime(200);
    await expect(result).resolves.toEqual({
      timeout: true,
      jobName: 'slow-job',
    });
  });

  it('propagates errors from the promise', async () => {
    const failing = Promise.reject(new Error('boom'));
    const result = withTimeout(failing, 5000, 'fail-job');
    jest.advanceTimersByTime(100);
    await expect(result).rejects.toThrow('boom');
  });
});

describe('withJobTimeout', () => {
  it('uses configured timeout for known job types', async () => {
    const job = () => Promise.resolve(42);
    const result = await withJobTimeout('compliance_score_update', job);
    expect(result).toBe(42);
  });

  it('uses default timeout for unknown job types', async () => {
    const job = () => Promise.resolve('done');
    const result = await withJobTimeout('unknown_job', job);
    expect(result).toBe('done');
  });
});

describe('constants', () => {
  it('LATENCY_BUDGETS has entries', () => {
    expect(Object.keys(LATENCY_BUDGETS).length).toBeGreaterThan(10);
  });

  it('JOB_TIMEOUTS has a default entry', () => {
    expect(JOB_TIMEOUTS.default).toBe(60000);
  });
});
