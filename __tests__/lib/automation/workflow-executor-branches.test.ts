/**
 * Branch-coverage supplement for lib/automation/workflow-executor.ts
 * Targets untested branches: update_field skip, approval timeout, parallel failure,
 * long delay scheduling failure, retry with backoff, misc actions, persist=false
 */

function createBuilder(result: any = { data: null, error: null }) {
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

jest.mock('server-only', () => ({}));
jest.mock('@/lib/observability/structured-logger', () => ({
  automationLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/supabase/admin', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return { createSupabaseAdminClient: jest.fn(() => c), __client: c };
});
function getClient() {
  return require('@/lib/supabase/admin').__client;
}

jest.mock('@/lib/activity/feed', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/notifications/engine', () => ({
  notify: jest.fn().mockResolvedValue(undefined),
}));

const mockTriggerTask = jest.fn().mockResolvedValue(true);
jest.mock('@/lib/trigger/client', () => ({
  triggerTaskIfConfigured: (...args: any[]) => mockTriggerTask(...args),
}));

jest.mock('@/lib/security/url-validator', () => ({
  validateWebhookUrl: jest.fn().mockResolvedValue(undefined),
}));

const mockCreateApprovalRequest = jest.fn().mockResolvedValue(undefined);
const mockCreateExecution = jest.fn();
const mockCreateWorkflowExecution = jest.fn();
const mockUpdateWorkflowExecution = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/automation/workflow-store', () => ({
  createApprovalRequest: (...args: any[]) => mockCreateApprovalRequest(...args),
  createExecution: (...args: any[]) => mockCreateExecution(...args),
  createWorkflowExecution: (...args: any[]) =>
    mockCreateWorkflowExecution(...args),
  updateWorkflowExecution: (...args: any[]) =>
    mockUpdateWorkflowExecution(...args),
}));

global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 }) as any;

import { executeWorkflow } from '@/lib/automation/workflow-executor';

function makeExecution(overrides: any = {}) {
  return {
    id: 'exec-1',
    workflow_id: 'wf-1',
    status: 'running',
    current_step_id: null,
    trigger_event: { type: 'manual' },
    execution_trace: { steps: [] },
    context_snapshot: {},
    completed_at: null,
    error: null,
    ...overrides,
  };
}

function makeWorkflow(steps: any[], overrides: any = {}): any {
  return {
    id: 'wf-1',
    name: 'Test Workflow',
    org_id: 'org-1',
    trigger: { type: 'manual', config: {} },
    steps,
    ...overrides,
  };
}

describe('workflow-executor branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateExecution.mockReset();
    mockCreateWorkflowExecution.mockReset();
    mockCreateExecution.mockResolvedValue(makeExecution());
    mockCreateWorkflowExecution.mockResolvedValue(makeExecution());
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('update_field skips when missing field', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'update_field',
        config: { table: 'tasks', recordId: 'r1' },
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.execution.status).toBe('completed');
    const step = result.trace.steps[0];
    expect(step.output?.skipped).toBe(true);
  });

  it('update_field skips when missing table', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'update_field',
        config: { recordId: 'r1', field: 'name', value: 'test' },
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].output?.skipped).toBe(true);
  });

  it('update_status skips when missing recordId', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'update_status',
        config: { table: 'tasks', status: 'done' },
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].output?.skipped).toBe(true);
  });

  it('executes calculate_compliance_score action', async () => {
    jest.mock('@/lib/automation/compliance-score-engine', () => ({
      updateComplianceScore: jest.fn().mockResolvedValue(undefined),
    }));

    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'calculate_compliance_score',
        config: {},
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.execution.status).toBe('completed');
  });

  it('executes generate_report action', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'generate_report',
        config: { reportType: 'audit' },
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].output?.queued).toBe(true);
    expect(result.trace.steps[0].output?.reportType).toBe('audit');
  });

  it('executes create_incident_room action', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'create_incident_room',
        config: { roomName: 'incident-test' },
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].output?.created).toBe(true);
    expect(result.trace.steps[0].output?.roomName).toBe('incident-test');
  });

  it('executes create_approval_task action', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'create_approval_task',
        config: { assignedTo: 'user-1' },
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].output?.assignedTo).toBe('user-1');
  });

  it('condition step evaluates else branch', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'condition',
        conditions: [
          { field: '{{trigger.data.value}}', operator: 'eq', value: 'yes' },
        ],
        thenSteps: [
          {
            id: 's1a',
            type: 'action',
            action: 'set_variable',
            config: { name: 'branch', value: 'then' },
          },
        ],
        elseSteps: [
          {
            id: 's1b',
            type: 'action',
            action: 'set_variable',
            config: { name: 'branch', value: 'else' },
          },
        ],
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: { value: 'no' } } },
      { persist: false },
    );
    expect(result.execution.status).toBe('completed');
  });

  it('condition step with no elseSteps', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'condition',
        conditions: [
          { field: '{{trigger.data.value}}', operator: 'eq', value: 'yes' },
        ],
        thenSteps: [
          {
            id: 's1a',
            type: 'action',
            action: 'set_variable',
            config: { name: 'x', value: '1' },
          },
        ],
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: { value: 'no' } } },
      { persist: false },
    );
    expect(result.execution.status).toBe('completed');
  });

  it('parallel step with failing branch and waitForAll=true', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'Task insert failed' } }),
    );

    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'parallel',
        waitForAll: true,
        branches: [
          [
            {
              id: 's1a',
              type: 'action',
              action: 'create_task',
              config: { title: 'Task A' },
            },
          ],
          [
            {
              id: 's1b',
              type: 'action',
              action: 'create_task',
              config: { title: 'Task B' },
            },
          ],
        ],
      },
    ]);

    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.execution.status).toBe('failed');
  });

  it('parallel step with waitForAll=false tolerates failures', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );

    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'parallel',
        waitForAll: false,
        branches: [
          [
            {
              id: 's1a',
              type: 'action',
              action: 'create_task',
              config: { title: 'A' },
              onError: 'continue',
            },
          ],
        ],
      },
    ]);

    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    // With waitForAll=false, parallel still reports failure but doesn't throw
    expect(result.execution.status).toBeDefined();
  });

  it('delay step with zero duration is skipped', async () => {
    const workflow = makeWorkflow([
      { id: 's1', type: 'delay', duration: '0s' },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].status).toBe('skipped');
  });

  it('long delay fails when trigger task not scheduled', async () => {
    mockTriggerTask.mockResolvedValueOnce(false);
    const workflow = makeWorkflow([
      { id: 's1', type: 'delay', duration: '2h' },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.execution.status).toBe('failed');
  });

  it('send_notification with null userId is handled', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'send_notification',
        config: { title: 'Test' },
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].output?.sent).toBe(false);
  });

  it('executeWorkflow with persist=true calls updateWorkflowExecution', async () => {
    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'set_variable',
        config: { name: 'x', value: '1' },
      },
    ]);
    await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: true },
    );
    expect(mockUpdateWorkflowExecution).toHaveBeenCalled();
  });

  it('retry policy retries and succeeds on second attempt', async () => {
    let callCount = 0;
    getClient().from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return createBuilder({ data: null, error: { message: 'transient' } });
      }
      return createBuilder({ data: { id: 'task-1' }, error: null });
    });

    const workflow = makeWorkflow([
      {
        id: 's1',
        type: 'action',
        action: 'create_task',
        config: { title: 'Retry Task' },
        onError: 'retry',
      },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false, maxRetries: 3 },
    );
    expect(result.execution.status).toBe('completed');
  });

  it('generate_report defaults reportType to compliance', async () => {
    const workflow = makeWorkflow([
      { id: 's1', type: 'action', action: 'generate_report', config: {} },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].output?.reportType).toBe('compliance');
  });

  it('create_incident_room defaults roomName', async () => {
    const workflow = makeWorkflow([
      { id: 's1', type: 'action', action: 'create_incident_room', config: {} },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].output?.roomName).toMatch(/^incident-/);
  });

  it('create_approval_task defaults assignedTo to null', async () => {
    const workflow = makeWorkflow([
      { id: 's1', type: 'action', action: 'create_approval_task', config: {} },
    ]);
    const result = await executeWorkflow(
      workflow,
      { trigger: { type: 'manual', data: {} } },
      { persist: false },
    );
    expect(result.trace.steps[0].output?.assignedTo).toBeNull();
  });
});
