/**
 * Tests for lib/automation/workflow-executor.ts
 * Workflow execution engine — action steps, conditions, parallel, loops, delays, approvals
 */

// ── helpers ──────────────────────────────────────────────
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

// ── mocks ────────────────────────────────────────────────
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

jest.mock('@/lib/trigger/client', () => ({
  triggerTaskIfConfigured: jest.fn().mockResolvedValue(true),
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

// Mock global fetch for webhook action
const mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
global.fetch = mockFetch as any;

// ── imports ─────────────────────────────────────────────
import {
  executeWorkflow,
  startWorkflowExecution,
  resumeWorkflowExecution,
} from '@/lib/automation/workflow-executor';

// ── test data ──────────────────────────────────────────
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

// ── suite ───────────────────────────────────────────────
describe('workflow-executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateExecution.mockReset();
    mockCreateWorkflowExecution.mockReset();
    mockCreateExecution.mockResolvedValue(makeExecution());
    mockCreateWorkflowExecution.mockResolvedValue(makeExecution());
  });

  describe('executeWorkflow', () => {
    it('executes a simple action step (send_notification)', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );

      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'send_notification',
          config: { userId: 'u1', title: 'Test', message: 'Hello' },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
      expect(result.trace.steps.length).toBeGreaterThanOrEqual(1);
    });

    it('executes send_email action', async () => {
      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'send_email',
          config: { to: 'user@test.com', subject: 'Hello' },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('executes create_task action', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: { id: 'task-1' }, error: null }),
      );

      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'create_task',
          config: {
            title: 'New Task',
            description: 'Do stuff',
            priority: 'high',
          },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('executes update_status action', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );

      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'update_status',
          config: { table: 'tasks', recordId: 'r1', status: 'complete' },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('executes update_field action', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );

      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'update_field',
          config: {
            table: 'controls',
            recordId: 'r1',
            field: 'status',
            value: 'done',
          },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('skips update_status when missing table/recordId', async () => {
      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'update_status',
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

    it('executes escalate action', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: [{ user_id: 'admin1' }, { user_id: 'admin2' }],
          error: null,
        }),
      );

      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'escalate',
          config: { title: 'Escalation', message: 'Help needed' },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('executes webhook action', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'webhook',
          config: {
            url: 'https://example.com/hook',
            method: 'POST',
            body: { foo: 'bar' },
          },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('executes log_activity action', async () => {
      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'log_activity',
          config: {
            action: 'created',
            resourceType: 'task',
            resourceId: 't1',
            resourceName: 'Test Task',
          },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('executes set_variable action', async () => {
      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'set_variable',
          config: { name: 'myVar', value: 42 },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('handles unsupported action gracefully', async () => {
      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'nonexistent_action_xyz',
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

    it('skips disabled steps', async () => {
      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'send_email',
          config: { to: 'x@x.com' },
          enabled: false,
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
      const skipped = result.trace.steps.find((s: any) => s.stepId === 's1');
      expect(skipped?.status).toBe('skipped');
    });

    it('handles action step failure with onError=continue', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'db error' } }),
      );

      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'create_task',
          config: { title: 'fail' },
          onError: 'continue',
        },
        {
          id: 's2',
          type: 'action',
          action: 'send_email',
          config: { to: 'x@x.com' },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      // s1 fails but s2 still runs, workflow completes
      expect(result.execution.status).toBe('completed');
    });

    it('handles action step failure with onError=stop (default)', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'kaboom' } }),
      );

      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'create_task',
          config: { title: 'fail' },
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('failed');
    });

    it('executes condition step (then branch)', async () => {
      const workflow = makeWorkflow([
        {
          id: 'cond1',
          type: 'condition',
          conditions: [
            { field: 'trigger.data.value', operator: 'eq', value: true },
          ],
          combinator: 'and',
          thenSteps: [
            {
              id: 'then1',
              type: 'action',
              action: 'send_email',
              config: { to: 'x@x.com' },
            },
          ],
          elseSteps: [],
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: { value: true } } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('executes delay step with short duration inline', async () => {
      const workflow = makeWorkflow([
        {
          id: 'd1',
          type: 'delay',
          duration: '100ms',
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('handles delay step with zero/negative duration', async () => {
      const workflow = makeWorkflow([
        {
          id: 'd1',
          type: 'delay',
          duration: '0s',
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: {} } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });

    it('executes loop step', async () => {
      const workflow = makeWorkflow([
        {
          id: 'loop1',
          type: 'loop',
          collection: 'trigger.data.items',
          itemVariable: 'item',
          maxIterations: 3,
          steps: [
            {
              id: 'loop-action',
              type: 'action',
              action: 'send_email',
              config: { to: 'x@x.com' },
            },
          ],
        },
      ]);

      const result = await executeWorkflow(
        workflow,
        { trigger: { type: 'manual', data: { items: ['a', 'b', 'c'] } } },
        { persist: false },
      );

      expect(result.execution.status).toBe('completed');
    });
  });

  describe('startWorkflowExecution', () => {
    it('creates and returns workflow execution record', async () => {
      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'send_email',
          config: { to: 'x@x.com' },
        },
      ]);

      const exec = await startWorkflowExecution(
        workflow,
        { source: 'test' },
        { userId: 'u1', userEmail: 'test@test.com' },
      );

      expect(exec).toHaveProperty('id');
      expect(exec).toHaveProperty('status');
    });
  });

  describe('resumeWorkflowExecution', () => {
    it('resumes from a specific step', async () => {
      const execution = makeExecution({ status: 'waiting_approval' });
      const workflow = makeWorkflow([
        {
          id: 's1',
          type: 'action',
          action: 'send_email',
          config: { to: 'x@x.com' },
        },
      ]);

      const exec = await resumeWorkflowExecution(execution, workflow, 's1', {
        approved: true,
      });

      expect(exec).toHaveProperty('id');
    });
  });
});
