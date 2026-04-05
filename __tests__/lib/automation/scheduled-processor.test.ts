/**
 * Tests for lib/automation/scheduled-processor.ts
 *
 * Tests runScheduledAutomation and runScheduledCheck which run 7 check
 * functions in parallel (expiring evidence, policy reviews, overdue tasks,
 * expiring certifications, compliance scores, billing reconciliation,
 * entitlement drift).
 */

jest.mock('server-only', () => ({}));

// ── Supabase admin mock ──────────────────────────────────────────────────────

function createBuilder(result = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

// ── Dependency mocks ────────────────────────────────────────────────────────

jest.mock('@/lib/automation/trigger-engine', () => ({
  processTrigger: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/automation/compliance-score-engine', () => ({
  updateComplianceScore: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/billing/nightly-reconciliation', () => ({
  runBillingReconciliation: jest.fn().mockResolvedValue({
    checked: 10,
    discrepancies: [],
    autoFixed: 2,
    errors: [],
    duration: 100,
  }),
}));

jest.mock('@/lib/billing/entitlement-drift-detector', () => ({
  scanAllForEntitlementDrift: jest.fn().mockResolvedValue({
    scanned: 50,
    withDrift: 3,
    autoFixed: 1,
    errors: [],
  }),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  automationLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import {
  runScheduledAutomation,
  runScheduledCheck,
} from '@/lib/automation/scheduled-processor';

beforeEach(() => {
  jest.clearAllMocks();
  // Default: all DB queries return empty data (no items to process)
  getClient().from.mockImplementation(() =>
    createBuilder({ data: [], error: null }),
  );
});

describe('runScheduledAutomation', () => {
  it('runs all 7 checks and returns aggregate results', async () => {
    const result = await runScheduledAutomation();

    expect(result.checksRun).toBe(7);
    expect(result.errors).toEqual([]);
    // triggersExecuted includes: billing autoFixed(2) + entitlement autoFixed(1)
    expect(result.triggersExecuted).toBeGreaterThanOrEqual(3);
  });

  it('collects errors from failed checks', async () => {
    // Make all DB queries fail
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'DB down' } }),
    );

    const result = await runScheduledAutomation();

    expect(result.checksRun).toBe(7);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles expiring evidence and triggers renewals', async () => {
    const evidence = [
      {
        id: 'ev-1',
        organization_id: 'org-1',
        file_name: 'cert.pdf',
        created_at: '2023-01-01',
      },
    ];

    let callIdx = 0;
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_evidence') {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({ data: evidence, error: null });
        return createBuilder({ data: null, error: null }); // update call
      }
      return createBuilder({ data: [], error: null });
    });

    const result = await runScheduledAutomation();

    const { processTrigger } = require('@/lib/automation/trigger-engine');
    expect(processTrigger).toHaveBeenCalled();
    expect(result.triggersExecuted).toBeGreaterThanOrEqual(1);
  });

  it('handles policy reviews due', async () => {
    const policies = [
      {
        id: 'pol-1',
        organization_id: 'org-1',
        title: 'Data Policy',
        last_updated_at: '2023-01-01',
      },
    ];

    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_policies')
        return createBuilder({ data: policies, error: null });
      return createBuilder({ data: [], error: null });
    });

    const result = await runScheduledAutomation();
    expect(result.checksRun).toBe(7);
  });

  it('handles overdue tasks', async () => {
    const tasks = [
      {
        id: 'task-1',
        organization_id: 'org-1',
        title: 'Review',
        due_date: '2023-01-01',
        priority: 'high',
        assigned_to: 'user-1',
      },
    ];

    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_tasks')
        return createBuilder({ data: tasks, error: null });
      return createBuilder({ data: [], error: null });
    });

    const result = await runScheduledAutomation();
    expect(result.checksRun).toBe(7);
  });

  it('handles compliance score updates for organizations', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'organizations') {
        return createBuilder({ data: [{ id: 'org-1' }], error: null });
      }
      if (table === 'org_control_evaluations') {
        return createBuilder({ data: null, error: null });
      }
      return createBuilder({ data: [], error: null });
    });

    await runScheduledAutomation();

    const {
      updateComplianceScore,
    } = require('@/lib/automation/compliance-score-engine');
    expect(updateComplianceScore).toHaveBeenCalled();
  });

  it('handles billing reconciliation errors', async () => {
    const {
      runBillingReconciliation,
    } = require('@/lib/billing/nightly-reconciliation');
    runBillingReconciliation.mockRejectedValueOnce(
      new Error('Stripe API down'),
    );

    const result = await runScheduledAutomation();

    expect(result.checksRun).toBe(7);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('Stripe API down')]),
    );
  });

  it('handles entitlement drift check errors', async () => {
    const {
      scanAllForEntitlementDrift,
    } = require('@/lib/billing/entitlement-drift-detector');
    scanAllForEntitlementDrift.mockRejectedValueOnce(new Error('Scan failed'));

    const result = await runScheduledAutomation();

    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('Scan failed')]),
    );
  });
});

describe('runScheduledCheck', () => {
  it('runs evidence check', async () => {
    const result = await runScheduledCheck('evidence');
    expect(result).toHaveProperty('triggersExecuted');
    expect(result).toHaveProperty('errors');
  });

  it('runs policies check', async () => {
    const result = await runScheduledCheck('policies');
    expect(result).toHaveProperty('triggersExecuted');
  });

  it('runs tasks check', async () => {
    const result = await runScheduledCheck('tasks');
    expect(result).toHaveProperty('triggersExecuted');
  });

  it('runs certifications check', async () => {
    const result = await runScheduledCheck('certifications');
    expect(result).toHaveProperty('triggersExecuted');
  });

  it('runs scores check', async () => {
    const result = await runScheduledCheck('scores');
    expect(result).toHaveProperty('triggersExecuted');
  });

  it('throws for unknown check type', async () => {
    await expect(runScheduledCheck('unknown' as any)).rejects.toThrow(
      'Unknown check type',
    );
  });
});
