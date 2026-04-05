/** @jest-environment node */
jest.mock('server-only', () => ({}));

function createBuilder(result: any = { data: null, error: null, count: null }) {
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

jest.mock('@/lib/observability/structured-logger', () => ({
  automationLogger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('@/lib/automation/workflow-types', () => ({
  normalizeWorkflowStatus: jest.fn((status: any, enabled: any) => {
    if (status === 'archived') return 'archived';
    return enabled ? 'active' : 'inactive';
  }),
}));

function getClient() {
  return require('@/lib/supabase/admin').__client;
}

import {
  saveWorkflowDefinition,
  getWorkflowDefinition,
  listWorkflows,
  getWorkflowExecutionHistory,
  getExecutionDetail,
  createWorkflowExecution,
  updateWorkflowExecution,
  createWorkflowApproval,
  getPendingApprovals,
  processApprovalDecision,
  listTimedOutApprovals,
  markApprovalTimedOut,
  createWorkflow,
  updateWorkflow,
  getWorkflow,
  deleteWorkflow,
  getActiveWorkflowsByTrigger,
  createExecution,
  updateExecution,
  getExecution,
  listExecutions,
} from '@/lib/automation/workflow-store';

const makeDef = (overrides: any = {}) => ({
  id: 'wf-1',
  name: 'Test WF',
  description: 'desc',
  version: 1,
  org_id: 'org-1',
  enabled: true,
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  trigger: { type: 'manual' },
  steps: [],
  variables: {},
  tags: [],
  status: 'active',
  ...overrides,
});

const makeRow = (overrides: any = {}) => ({
  row_id: 'r1',
  id: 'wf-1',
  org_id: 'org-1',
  name: 'Test WF',
  description: 'desc',
  version: 1,
  definition: {
    trigger: { type: 'manual' },
    steps: [],
    variables: {},
    tags: [],
    status: 'active',
  },
  enabled: true,
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const makeExecRow = (overrides: any = {}) => ({
  id: 'exec-1',
  workflow_id: 'wf-1',
  org_id: 'org-1',
  workflow_version: 1,
  trigger_event: {},
  status: 'running',
  started_at: '2024-01-01T00:00:00Z',
  completed_at: null,
  error: null,
  execution_trace: { steps: [], logs: [] },
  current_step_id: null,
  context_snapshot: {},
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

describe('saveWorkflowDefinition', () => {
  it('inserts a new version', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1)
        return createBuilder({ data: [makeRow()], error: null });
      return createBuilder({ data: makeRow({ version: 2 }), error: null });
    });

    const result = await saveWorkflowDefinition(makeDef());
    expect(result).toHaveProperty('id', 'wf-1');
    expect(getClient().from).toHaveBeenCalledWith('workflow_definitions');
  });

  it('throws on insert error', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return createBuilder({ data: [], error: null });
      return createBuilder({ data: null, error: { message: 'insert failed' } });
    });
    await expect(saveWorkflowDefinition(makeDef())).rejects.toThrow(
      'insert failed',
    );
  });
});

describe('getWorkflowDefinition', () => {
  it('returns mapped definition', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeRow(), error: null }),
    );
    const result = await getWorkflowDefinition('wf-1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('wf-1');
  });

  it('returns null when not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    expect(await getWorkflowDefinition('wf-99')).toBeNull();
  });

  it('accepts version param', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeRow({ version: 3 }), error: null }),
    );
    const result = await getWorkflowDefinition('wf-1', 3);
    expect(result!.version).toBe(3);
  });
});

describe('listWorkflows', () => {
  it('returns deduplicated workflows', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          makeRow({ id: 'wf-1', version: 1 }),
          makeRow({ id: 'wf-1', version: 2 }),
          makeRow({ id: 'wf-2', version: 1 }),
        ],
        error: null,
        count: 3,
      }),
    );
    const { workflows, total } = await listWorkflows('org-1');
    expect(workflows.length).toBe(2); // deduplicated by id
    expect(total).toBe(2);
  });

  it('returns empty on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'err' } }),
    );
    const { workflows, total } = await listWorkflows('org-1');
    expect(workflows).toEqual([]);
    expect(total).toBe(0);
  });
});

describe('getWorkflowExecutionHistory', () => {
  it('returns execution summaries', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [makeExecRow({ workflow_definitions: { name: 'WF1' } })],
        error: null,
      }),
    );
    const result = await getWorkflowExecutionHistory('wf-1');
    expect(result.length).toBe(1);
    expect(result[0]).toHaveProperty('workflowName', 'WF1');
  });

  it('returns empty on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    expect(await getWorkflowExecutionHistory('wf-1')).toEqual([]);
  });
});

describe('getExecutionDetail', () => {
  it('returns mapped execution record', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeExecRow(), error: null }),
    );
    const result = await getExecutionDetail('exec-1');
    expect(result!.id).toBe('exec-1');
  });

  it('returns null when not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    expect(await getExecutionDetail('exec-99')).toBeNull();
  });
});

describe('createWorkflowExecution', () => {
  it('inserts and returns execution record', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeExecRow(), error: null }),
    );
    const result = await createWorkflowExecution(makeDef() as any, {
      key: 'val',
    });
    expect(result.id).toBe('exec-1');
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    await expect(createWorkflowExecution(makeDef() as any, {})).rejects.toThrow(
      'fail',
    );
  });
});

describe('updateWorkflowExecution', () => {
  it('updates execution record', async () => {
    getClient().from.mockImplementation(() => createBuilder());
    await expect(
      updateWorkflowExecution('exec-1', { status: 'completed' as any }),
    ).resolves.toBeUndefined();
  });
});

describe('createWorkflowApproval', () => {
  it('inserts and maps approval', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: {
          id: 'appr-1',
          execution_id: 'exec-1',
          step_id: 's1',
          approvers: ['u1'],
          status: 'pending',
          approved_by: null,
          approved_at: null,
          timeout_at: null,
          decision: null,
          comment: null,
        },
        error: null,
      }),
    );
    const result = await createWorkflowApproval({
      executionId: 'exec-1',
      stepId: 's1',
      approvers: ['u1'],
    });
    expect(result.id).toBe('appr-1');
    expect(result.status).toBe('pending');
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    await expect(
      createWorkflowApproval({
        executionId: 'e1',
        stepId: 's1',
        approvers: ['u1'],
      }),
    ).rejects.toThrow('fail');
  });
});

describe('getPendingApprovals', () => {
  it('returns pending approval list', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          {
            id: 'appr-1',
            execution_id: 'exec-1',
            step_id: 's1',
            approvers: [],
            status: 'pending',
            approved_by: null,
            approved_at: null,
            timeout_at: null,
            decision: null,
            comment: null,
            workflow_executions: { org_id: 'org-1' },
          },
        ],
        error: null,
      }),
    );
    const result = await getPendingApprovals('org-1');
    expect(result.length).toBe(1);
  });

  it('returns empty on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'err' } }),
    );
    expect(await getPendingApprovals('org-1')).toEqual([]);
  });
});

describe('processApprovalDecision', () => {
  it('updates approval with decision', async () => {
    getClient().from.mockImplementation(() => createBuilder());
    await expect(
      processApprovalDecision({
        executionId: 'exec-1',
        stepId: 's1',
        decision: 'approve',
        decidedBy: 'u1',
      } as any),
    ).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    await expect(
      processApprovalDecision({
        executionId: 'e1',
        stepId: 's1',
        decision: 'reject',
        decidedBy: 'u1',
      } as any),
    ).rejects.toThrow('fail');
  });
});

describe('listTimedOutApprovals', () => {
  it('returns timed out approvals', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          {
            id: 'a1',
            execution_id: 'e1',
            step_id: 's1',
            approvers: [],
            status: 'pending',
            approved_by: null,
            approved_at: null,
            timeout_at: '2024-01-01',
            decision: null,
            comment: null,
          },
        ],
        error: null,
      }),
    );
    const result = await listTimedOutApprovals('2024-06-01');
    expect(result.length).toBe(1);
  });
});

describe('markApprovalTimedOut', () => {
  it('updates approval status to timed_out', async () => {
    getClient().from.mockImplementation(() => createBuilder());
    await expect(markApprovalTimedOut('appr-1')).resolves.toBeUndefined();
  });
});

describe('createWorkflow', () => {
  it('creates and saves a new workflow', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      if (callIdx === 1) return createBuilder({ data: [], error: null });
      return createBuilder({ data: makeRow(), error: null });
    });
    const result = await createWorkflow('org-1', 'user-1', {
      name: 'New WF',
      trigger: { type: 'manual' },
      steps: [],
    } as any);
    expect(result).toHaveProperty('id');
  });
});

describe('updateWorkflow', () => {
  it('updates existing workflow with new version', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      // getWorkflowDefinition calls (select, eq, order, limit/maybeSingle)
      if (callIdx <= 2) return createBuilder({ data: makeRow(), error: null });
      // Insert call
      return createBuilder({ data: makeRow({ version: 2 }), error: null });
    });
    const result = await updateWorkflow('wf-1', 'org-1', {
      name: 'Updated',
    } as any);
    expect(result).toHaveProperty('id');
  });

  it('throws when workflow not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(updateWorkflow('wf-99', 'org-1', {} as any)).rejects.toThrow(
      'not found',
    );
  });
});

describe('getWorkflow', () => {
  it('returns workflow if org matches', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeRow(), error: null }),
    );
    const result = await getWorkflow('wf-1', 'org-1');
    expect(result).not.toBeNull();
  });

  it('returns null if org does not match', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeRow({ org_id: 'org-2' }), error: null }),
    );
    expect(await getWorkflow('wf-1', 'org-1')).toBeNull();
  });
});

describe('deleteWorkflow', () => {
  it('deletes by id and org', async () => {
    getClient().from.mockImplementation(() => createBuilder({ error: null }));
    await expect(deleteWorkflow('wf-1', 'org-1')).resolves.toBeUndefined();
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ error: { message: 'cannot delete' } }),
    );
    await expect(deleteWorkflow('wf-1', 'org-1')).rejects.toThrow(
      'cannot delete',
    );
  });
});

describe('getActiveWorkflowsByTrigger', () => {
  it('returns active workflows filtered by trigger type', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          makeRow({ id: 'wf-1' }),
          makeRow({
            id: 'wf-2',
            definition: { ...makeRow().definition, status: 'archived' },
          }),
        ],
        error: null,
        count: 2,
      }),
    );
    const result = await getActiveWorkflowsByTrigger('org-1', 'manual');
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

describe('createExecution', () => {
  it('delegates to createWorkflowExecution', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeExecRow(), error: null }),
    );
    const result = await createExecution(makeDef() as any, { foo: 'bar' });
    expect(result.id).toBe('exec-1');
  });
});

describe('getExecution', () => {
  it('delegates to getExecutionDetail', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: makeExecRow(), error: null }),
    );
    const result = await getExecution('exec-1');
    expect(result!.id).toBe('exec-1');
  });
});

describe('listExecutions', () => {
  it('returns paginated execution list', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [makeExecRow({ workflow_definitions: { name: 'WF1' } })],
        error: null,
        count: 1,
      }),
    );
    const { executions, total } = await listExecutions('org-1', { limit: 10 });
    expect(executions.length).toBe(1);
    expect(total).toBe(1);
  });

  it('returns empty on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    const { executions, total } = await listExecutions('org-1');
    expect(executions).toEqual([]);
    expect(total).toBe(0);
  });
});

describe('updateExecution', () => {
  it('updates execution via detail lookup + update', async () => {
    let callIdx = 0;
    getClient().from.mockImplementation(() => {
      callIdx++;
      // getExecutionDetail
      if (callIdx === 1)
        return createBuilder({ data: makeExecRow(), error: null });
      // updateWorkflowExecution
      return createBuilder();
    });
    await expect(
      updateExecution('exec-1', {
        status: 'completed' as any,
        completedAt: '2024-01-01',
      }),
    ).resolves.toBeUndefined();
  });

  it('does nothing if execution not found', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: null }),
    );
    await expect(
      updateExecution('exec-99', { status: 'completed' as any }),
    ).resolves.toBeUndefined();
  });
});
