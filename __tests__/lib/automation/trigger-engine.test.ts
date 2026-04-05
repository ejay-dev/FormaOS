/**
 * @jest-environment node
 */

/* ------------------------------------------------------------------ */
/*  Supabase builder helper                                           */
/* ------------------------------------------------------------------ */
function createBuilder(
  result: { data?: any; error?: any } = { data: null, error: null },
) {
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

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */
jest.mock('server-only', () => ({}));

const mockInsertOrgTaskCompat = jest.fn();
jest.mock('@/lib/tasks/persistence', () => ({
  insertOrgTaskCompat: (...args: any[]) => mockInsertOrgTaskCompat(...args),
}));

const mockUpdateComplianceScore = jest.fn();
jest.mock('@/lib/automation/compliance-score-engine', () => ({
  updateComplianceScore: (...args: any[]) => mockUpdateComplianceScore(...args),
}));

jest.mock('@/lib/observability/structured-logger', () => ({
  automationLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/supabase/admin', () => {
  const c: Record<string, any> = { from: jest.fn(() => createBuilder()) };
  return {
    createSupabaseAdminClient: jest.fn(() => c),
    __client: c,
  };
});

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import {
  processTrigger,
  type TriggerEvent,
} from '@/lib/automation/trigger-engine';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function makeEvent(overrides: Partial<TriggerEvent>): TriggerEvent {
  return {
    type: 'evidence_expiry',
    organizationId: 'org-1',
    triggeredAt: new Date(),
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('trigger-engine – processTrigger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsertOrgTaskCompat.mockResolvedValue({
      data: { id: 'task-1' },
      error: null,
    });
    mockUpdateComplianceScore.mockResolvedValue(undefined);
  });

  /* ---------- recursion guard ---------- */
  it('returns error when recursion depth exceeds maximum', async () => {
    const result = await processTrigger(makeEvent({}), 5);
    expect(result.errors).toContain('Max trigger recursion depth reached (5)');
    expect(result.tasksCreated).toBe(0);
  });

  /* ---------- evidence_expiry ---------- */
  describe('evidence_expiry', () => {
    it('creates renewal task and notifies members', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'org_evidence')
          return createBuilder({
            data: {
              file_name: 'SOC2.pdf',
              org_tasks: { linked_policy_id: 'p1' },
            },
          });
        if (table === 'org_members')
          return createBuilder({
            data: [{ user_id: 'u1' }, { user_id: 'u2' }],
          });
        return createBuilder();
      });

      const result = await processTrigger(
        makeEvent({ metadata: { evidenceId: 'ev-1' } }),
      );

      expect(result.tasksCreated).toBe(1);
      expect(result.notificationsSent).toBe(2);
      expect(mockInsertOrgTaskCompat).toHaveBeenCalled();
    });

    it('errors when evidenceId missing', async () => {
      const result = await processTrigger(makeEvent({ metadata: {} }));
      expect(result.errors).toContain('Evidence ID missing in metadata');
    });

    it('errors when evidence not found', async () => {
      getClient().from.mockImplementation(() => createBuilder({ data: null }));
      const result = await processTrigger(
        makeEvent({ metadata: { evidenceId: 'ev-1' } }),
      );
      expect(result.errors).toContain('Evidence not found');
    });

    it('errors when task insertion fails', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'org_evidence')
          return createBuilder({
            data: { file_name: 'F.pdf', org_tasks: null },
          });
        return createBuilder();
      });
      mockInsertOrgTaskCompat.mockRejectedValue(new Error('insert fail'));
      const result = await processTrigger(
        makeEvent({ metadata: { evidenceId: 'ev-1' } }),
      );
      expect(result.errors[0]).toContain('Failed to create renewal task');
    });

    it('errors when task row not returned', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'org_evidence')
          return createBuilder({
            data: { file_name: 'F.pdf', org_tasks: null },
          });
        return createBuilder();
      });
      mockInsertOrgTaskCompat.mockResolvedValue({ data: null, error: null });
      const result = await processTrigger(
        makeEvent({ metadata: { evidenceId: 'ev-1' } }),
      );
      expect(result.errors).toContain(
        'Failed to create renewal task: task row was not returned',
      );
    });
  });

  /* ---------- policy_review_due ---------- */
  describe('policy_review_due', () => {
    it('creates review task and notifies members', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'org_policies')
          return createBuilder({ data: { title: 'Privacy Policy' } });
        if (table === 'org_members')
          return createBuilder({ data: [{ user_id: 'u1' }] });
        return createBuilder();
      });
      const result = await processTrigger(
        makeEvent({
          type: 'policy_review_due',
          metadata: { policyId: 'pol-1' },
        }),
      );
      expect(result.tasksCreated).toBe(1);
      expect(result.notificationsSent).toBe(1);
    });

    it('errors when policyId missing', async () => {
      const result = await processTrigger(
        makeEvent({ type: 'policy_review_due', metadata: {} }),
      );
      expect(result.errors).toContain('Policy ID missing in metadata');
    });

    it('errors when policy not found', async () => {
      getClient().from.mockImplementation(() => createBuilder({ data: null }));
      const result = await processTrigger(
        makeEvent({
          type: 'policy_review_due',
          metadata: { policyId: 'pol-1' },
        }),
      );
      expect(result.errors).toContain('Policy not found');
    });
  });

  /* ---------- control_failed / control_incomplete ---------- */
  describe('control_failed/control_incomplete', () => {
    beforeEach(() => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'compliance_controls')
          return createBuilder({ data: { title: 'Access Control' } });
        if (table === 'org_tasks')
          return createBuilder({ data: { id: 'task-2' } });
        if (table === 'org_members')
          return createBuilder({ data: [{ user_id: 'u1' }] });
        return createBuilder();
      });
    });

    it('creates critical remediation for control_failed', async () => {
      const result = await processTrigger(
        makeEvent({
          type: 'control_failed',
          metadata: { controlId: 'c-1', status: 'failed' },
        }),
      );
      expect(result.tasksCreated).toBe(1);
      expect(result.notificationsSent).toBe(1);
    });

    it('creates high-priority remediation for control_incomplete', async () => {
      const result = await processTrigger(
        makeEvent({
          type: 'control_incomplete',
          metadata: { controlId: 'c-1', status: 'incomplete' },
        }),
      );
      expect(result.tasksCreated).toBe(1);
    });

    it('errors when controlId missing', async () => {
      const result = await processTrigger(
        makeEvent({ type: 'control_failed', metadata: {} }),
      );
      expect(result.errors).toContain('Control ID missing in metadata');
    });

    it('errors when control not found', async () => {
      getClient().from.mockImplementation(() => createBuilder({ data: null }));
      const result = await processTrigger(
        makeEvent({ type: 'control_failed', metadata: { controlId: 'c-1' } }),
      );
      expect(result.errors).toContain('Control not found');
    });

    it('errors when task insert returns error', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'compliance_controls')
          return createBuilder({ data: { title: 'AC' } });
        if (table === 'org_tasks')
          return createBuilder({ data: null, error: { message: 'db fail' } });
        return createBuilder();
      });
      const result = await processTrigger(
        makeEvent({ type: 'control_failed', metadata: { controlId: 'c-1' } }),
      );
      expect(result.errors).toContain(
        'Failed to create remediation task: db fail',
      );
    });
  });

  /* ---------- org_onboarding ---------- */
  describe('org_onboarding', () => {
    it('creates onboarding tasks and notifies owner', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'organizations')
          return createBuilder({
            data: { industry: 'healthcare', name: 'Org' },
          });
        if (table === 'org_members')
          return createBuilder({ data: { user_id: 'u1' } });
        return createBuilder();
      });
      const result = await processTrigger(
        makeEvent({ type: 'org_onboarding' }),
      );
      expect(result.tasksCreated).toBe(4);
      expect(result.notificationsSent).toBe(1);
    });

    it('records errors for failed task inserts', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'organizations')
          return createBuilder({ data: { industry: 'other', name: 'Org' } });
        if (table === 'org_members') return createBuilder({ data: null });
        return createBuilder();
      });
      mockInsertOrgTaskCompat.mockRejectedValue(new Error('fail'));
      const result = await processTrigger(
        makeEvent({ type: 'org_onboarding' }),
      );
      expect(result.errors.length).toBe(4);
      expect(result.tasksCreated).toBe(0);
    });
  });

  /* ---------- onboarding_milestone ---------- */
  it('handles onboarding_milestone by updating status', async () => {
    getClient().from.mockImplementation(() => createBuilder());
    const result = await processTrigger(
      makeEvent({
        type: 'onboarding_milestone',
        metadata: { milestone: 'profile_complete' },
      }),
    );
    expect(result.errors).toHaveLength(0);
  });

  /* ---------- industry_configured ---------- */
  describe('industry_configured', () => {
    it('triggers compliance scoring when industry is set', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { industry: 'healthcare' } }),
      );
      const result = await processTrigger(
        makeEvent({
          type: 'industry_configured',
          metadata: { industry: 'healthcare' },
        }),
      );
      expect(result.workflowsExecuted).toBe(1);
      expect(mockUpdateComplianceScore).toHaveBeenCalledWith('org-1');
    });

    it('does not trigger scoring when industry is other', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { industry: 'other' } }),
      );
      const result = await processTrigger(
        makeEvent({
          type: 'industry_configured',
          metadata: { industry: 'other' },
        }),
      );
      expect(result.workflowsExecuted).toBe(0);
    });
  });

  /* ---------- frameworks_provisioned ---------- */
  it('creates task and notifies owner for frameworks_provisioned', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({ data: { user_id: 'u1' } });
      return createBuilder();
    });
    const result = await processTrigger(
      makeEvent({
        type: 'frameworks_provisioned',
        metadata: { frameworks: ['soc2', 'iso27001'] },
      }),
    );
    expect(result.tasksCreated).toBe(1);
    expect(result.workflowsExecuted).toBe(1);
    expect(result.notificationsSent).toBe(1);
  });

  /* ---------- industry_pack_applied ---------- */
  it('updates compliance score and notifies for industry_pack_applied', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'org_members')
        return createBuilder({ data: { user_id: 'u1' } });
      return createBuilder();
    });
    const result = await processTrigger(
      makeEvent({
        type: 'industry_pack_applied',
        metadata: { industry: 'fintech', packName: 'PCI Pack' },
      }),
    );
    expect(result.workflowsExecuted).toBe(1);
    expect(result.notificationsSent).toBe(1);
  });

  /* ---------- risk_score_change ---------- */
  describe('risk_score_change', () => {
    it('creates escalation task for critical risk increase', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'org_members')
          return createBuilder({ data: [{ user_id: 'u1' }] });
        return createBuilder();
      });
      const result = await processTrigger(
        makeEvent({
          type: 'risk_score_change',
          metadata: { previousRisk: 'medium', newRisk: 'critical', score: 95 },
        }),
      );
      expect(result.tasksCreated).toBe(1);
      expect(result.notificationsSent).toBe(1);
    });

    it('does nothing for risk decrease', async () => {
      const result = await processTrigger(
        makeEvent({
          type: 'risk_score_change',
          metadata: { previousRisk: 'high', newRisk: 'low', score: 20 },
        }),
      );
      expect(result.tasksCreated).toBe(0);
      expect(result.notificationsSent).toBe(0);
    });

    it('errors when risk data is missing', async () => {
      const result = await processTrigger(
        makeEvent({ type: 'risk_score_change', metadata: {} }),
      );
      expect(result.errors).toContain('Risk level data missing in metadata');
    });
  });

  /* ---------- task_overdue ---------- */
  describe('task_overdue', () => {
    it('notifies assigned user and escalates when significantly overdue', async () => {
      const pastDue = new Date(
        Date.now() - 5 * 24 * 60 * 60 * 1000,
      ).toISOString();
      getClient().from.mockImplementation((table: string) => {
        if (table === 'org_tasks')
          return createBuilder({
            data: {
              id: 't1',
              title: 'Task A',
              status: 'pending',
              due_date: pastDue,
              assigned_to: 'u1',
              priority: 'high',
            },
          });
        if (table === 'org_members')
          return createBuilder({ data: [{ user_id: 'u2' }] });
        return createBuilder();
      });
      const result = await processTrigger(
        makeEvent({ type: 'task_overdue', metadata: { taskId: 't1' } }),
      );
      expect(result.notificationsSent).toBeGreaterThanOrEqual(2);
    });

    it('errors when taskId missing', async () => {
      const result = await processTrigger(
        makeEvent({ type: 'task_overdue', metadata: {} }),
      );
      expect(result.errors).toContain('Task ID missing in metadata');
    });

    it('returns early for completed tasks', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 't1', status: 'completed' } }),
      );
      const result = await processTrigger(
        makeEvent({ type: 'task_overdue', metadata: { taskId: 't1' } }),
      );
      expect(result.notificationsSent).toBe(0);
    });
  });

  /* ---------- certification_expiring ---------- */
  describe('certification_expiring', () => {
    it('creates renewal task and notifies members', async () => {
      getClient().from.mockImplementation((table: string) => {
        if (table === 'org_certifications')
          return createBuilder({ data: { id: 'cert-1', name: 'ISO' } });
        if (table === 'org_tasks')
          return createBuilder({ data: { id: 'task-x' } });
        if (table === 'org_members')
          return createBuilder({ data: [{ user_id: 'u1' }] });
        return createBuilder();
      });
      const result = await processTrigger(
        makeEvent({
          type: 'certification_expiring',
          metadata: { certificationId: 'cert-1', daysUntilExpiry: 20 },
        }),
      );
      expect(result.tasksCreated).toBe(1);
      expect(result.notificationsSent).toBe(1);
    });

    it('errors when certificationId missing', async () => {
      const result = await processTrigger(
        makeEvent({ type: 'certification_expiring', metadata: {} }),
      );
      expect(result.errors).toContain('Certification ID missing in metadata');
    });

    it('errors when certification not found', async () => {
      getClient().from.mockImplementation(() => createBuilder({ data: null }));
      const result = await processTrigger(
        makeEvent({
          type: 'certification_expiring',
          metadata: { certificationId: 'cert-1' },
        }),
      );
      expect(result.errors).toContain('Certification not found');
    });
  });

  /* ---------- general error handling ---------- */
  it('catches top-level errors in processTrigger', async () => {
    getClient().from.mockImplementation(() => {
      throw new Error('boom');
    });
    const result = await processTrigger(
      makeEvent({ type: 'evidence_expiry', metadata: { evidenceId: 'e1' } }),
    );
    expect(result.errors).toContain('boom');
  });
});
