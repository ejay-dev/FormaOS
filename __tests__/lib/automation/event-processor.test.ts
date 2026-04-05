/**
 * Tests for lib/automation/event-processor.ts
 *
 * Exports: processEvent, monitorComplianceScoreChanges
 */

jest.mock('server-only', () => ({}));

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

jest.mock('@/lib/automation/trigger-engine', () => ({
  processTrigger: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('@/lib/automation/compliance-score-engine', () => ({
  updateComplianceScore: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  automationLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/tasks/persistence', () => ({
  insertOrgTaskCompat: jest
    .fn()
    .mockResolvedValue({ data: { id: 'new-task' }, error: null }),
}));

import {
  processEvent,
  monitorComplianceScoreChanges,
  type DatabaseEvent,
} from '@/lib/automation/event-processor';
import { processTrigger } from '@/lib/automation/trigger-engine';
import { updateComplianceScore } from '@/lib/automation/compliance-score-engine';

beforeEach(() => jest.clearAllMocks());

function makeEvent(overrides: Partial<DatabaseEvent>): DatabaseEvent {
  return {
    type: 'evidence_uploaded',
    organizationId: 'org-1',
    entityId: 'entity-1',
    entityType: 'evidence',
    timestamp: new Date(),
    ...overrides,
  };
}

describe('processEvent', () => {
  describe('evidence_uploaded', () => {
    it('updates compliance score and checks linked tasks', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'ev-1', org_tasks: null }, error: null }),
      );

      const result = await processEvent(
        makeEvent({ type: 'evidence_uploaded' }),
      );
      expect(result.triggered).toBe(true);
      expect(updateComplianceScore).toHaveBeenCalledWith('org-1');
    });

    it('auto-completes linked task when evidence uploaded', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: {
            id: 'ev-1',
            uploaded_by: 'user-1',
            org_tasks: { id: 'task-1', status: 'pending' },
          },
          error: null,
        }),
      );

      const result = await processEvent(
        makeEvent({ type: 'evidence_uploaded' }),
      );
      expect(result.triggered).toBe(true);
    });
  });

  describe('evidence_verified / evidence_rejected', () => {
    it('updates control evidence on verification', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );

      const result = await processEvent(
        makeEvent({ type: 'evidence_verified' }),
      );
      expect(result.triggered).toBe(true);
      expect(updateComplianceScore).toHaveBeenCalled();
    });

    it('triggers remediation workflow on rejection', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: { id: 'ev-1', file_name: 'doc.pdf' },
          error: null,
        }),
      );

      const result = await processEvent(
        makeEvent({ type: 'evidence_rejected' }),
      );
      expect(result.triggered).toBe(true);
      expect(processTrigger).toHaveBeenCalled();
    });
  });

  describe('control_status_updated', () => {
    it('triggers automation for non_compliant control', async () => {
      const result = await processEvent(
        makeEvent({
          type: 'control_status_updated',
          metadata: { newStatus: 'non_compliant', previousStatus: 'compliant' },
        }),
      );

      expect(result.triggered).toBe(true);
      expect(processTrigger).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'control_failed' }),
      );
    });

    it('triggers automation for at_risk control', async () => {
      const result = await processEvent(
        makeEvent({
          type: 'control_status_updated',
          metadata: { newStatus: 'at_risk', previousStatus: 'compliant' },
        }),
      );

      expect(result.triggered).toBe(true);
      expect(processTrigger).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'control_incomplete' }),
      );
    });

    it('does not trigger when status unchanged', async () => {
      const result = await processEvent(
        makeEvent({
          type: 'control_status_updated',
          metadata: { newStatus: 'compliant', previousStatus: 'compliant' },
        }),
      );

      expect(result.triggered).toBe(false);
    });
  });

  describe('task_completed', () => {
    it('generates next recurring task', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: {
            id: 'task-1',
            title: 'Review Policy',
            is_recurring: true,
            recurrence_days: 90,
            assigned_to: 'user-1',
            linked_policy_id: null,
          },
          error: null,
        }),
      );

      const result = await processEvent(makeEvent({ type: 'task_completed' }));
      expect(result.triggered).toBe(true);

      const { insertOrgTaskCompat } = require('@/lib/tasks/persistence');
      expect(insertOrgTaskCompat).toHaveBeenCalled();
    });

    it('returns false when task not found', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );

      const result = await processEvent(makeEvent({ type: 'task_completed' }));
      expect(result.triggered).toBe(false);
    });

    it('updates policy review date for policy-linked tasks', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx <= 2) {
          return createBuilder({
            data: {
              id: 'task-1',
              title: 'Review Policy ABC',
              is_recurring: false,
              linked_policy_id: 'pol-1',
            },
            error: null,
          });
        }
        return createBuilder({ data: { id: 'pol-1' }, error: null });
      });

      const result = await processEvent(makeEvent({ type: 'task_completed' }));
      expect(result.triggered).toBe(true);
    });
  });

  describe('task_created', () => {
    it('updates compliance score', async () => {
      const result = await processEvent(makeEvent({ type: 'task_created' }));
      expect(result.triggered).toBe(true);
      expect(updateComplianceScore).toHaveBeenCalled();
    });
  });

  describe('onboarding_completed', () => {
    it('triggers org_onboarding automation', async () => {
      const result = await processEvent(
        makeEvent({ type: 'onboarding_completed' }),
      );
      expect(result.triggered).toBe(true);
      expect(processTrigger).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'org_onboarding' }),
      );
    });
  });

  describe('subscription_activated', () => {
    it('does not trigger automation', async () => {
      const result = await processEvent(
        makeEvent({ type: 'subscription_activated' }),
      );
      expect(result.triggered).toBe(false);
    });
  });

  it('handles errors gracefully', async () => {
    (updateComplianceScore as jest.Mock).mockRejectedValueOnce(
      new Error('DB down'),
    );

    const result = await processEvent(makeEvent({ type: 'evidence_uploaded' }));
    expect(result.triggered).toBe(false);
  });
});

describe('monitorComplianceScoreChanges', () => {
  it('triggers alert when risk level changes', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { compliance_score: 60, details: { riskLevel: 'high' } },
        error: null,
      }),
    );

    await monitorComplianceScoreChanges('org-1', {
      score: 80,
      riskLevel: 'medium',
    });
    expect(processTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'risk_score_change' }),
    );
  });

  it('does nothing when risk level unchanged', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { compliance_score: 80, details: { riskLevel: 'medium' } },
        error: null,
      }),
    );

    await monitorComplianceScoreChanges('org-1', {
      score: 80,
      riskLevel: 'medium',
    });
    expect(processTrigger).not.toHaveBeenCalled();
  });

  it('returns early when no current evaluation exists', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );

    await monitorComplianceScoreChanges('org-1', {
      score: 80,
      riskLevel: 'medium',
    });
    expect(processTrigger).not.toHaveBeenCalled();
  });

  it('returns early when no previous score', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { compliance_score: 80, details: { riskLevel: 'medium' } },
        error: null,
      }),
    );

    await monitorComplianceScoreChanges('org-1');
    expect(processTrigger).not.toHaveBeenCalled();
  });
});
