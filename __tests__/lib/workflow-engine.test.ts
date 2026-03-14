/** @jest-environment node */

import { WorkflowEngine } from '@/lib/workflow-engine';
import {
  createMockMembership,
  createMockWorkflow,
} from '@/tests/factories';
import { mockSupabase } from '@/tests/helpers';

const supabase = mockSupabase();
const sendNotification = jest.fn();
const logActivity = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(async () => supabase.client),
}));

jest.mock('@/lib/notifications/engine', () => ({
  notify: (...args: unknown[]) => sendNotification(...args),
}));

jest.mock('@/lib/activity/feed', () => ({
  logActivity: (...args: unknown[]) => logActivity(...args),
}));

function seedRules(engine: WorkflowEngine, ...rules: ReturnType<typeof createMockWorkflow>[]) {
  const store = (engine as any).rules as Map<string, unknown>;
  store.clear();
  rules.forEach((rule) => store.set(rule.id, rule));
}

describe('WorkflowEngine', () => {
  beforeEach(() => {
    supabase.reset();
    sendNotification.mockReset();
    logActivity.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads only enabled organization rules from Supabase', async () => {
    const orgId = 'org-a';
    const engine = new WorkflowEngine();
    const rule = createMockWorkflow({ org_id: orgId, trigger: 'task_created' });

    supabase.queueResponse({
      match: { table: 'workflow_rules', action: 'select', expects: 'many' },
      response: { data: [rule], error: null },
    });

    await engine.loadRules(orgId);

    const operation = supabase.getLastOperation('workflow_rules');
    expect(operation?.filters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'eq', column: 'org_id', value: orgId }),
        expect.objectContaining({
          type: 'eq',
          column: 'enabled',
          value: true,
        }),
      ]),
    );

    await engine.executeTrigger('task_created', {
      orgId,
      userId: 'user-1',
      userEmail: 'user@example.com',
    });

    expect(sendNotification).toHaveBeenCalledTimes(1);
  });

  it('evaluates equality and operator-based conditions before executing actions', async () => {
    const engine = new WorkflowEngine();
    const rule = createMockWorkflow({
      org_id: 'org-a',
      conditions: {
        'resource.status': 'open',
        'metadata.score': { gte: 80 },
        'metadata.tags': { contains: 'security' },
        userEmail: { contains: '@example.com' },
        'metadata.priority': { in: ['high', 'critical'] },
        'resource.ownerId': { exists: true },
      },
    });

    seedRules(engine, rule);

    await engine.executeTrigger('task_created', {
      orgId: 'org-a',
      userId: 'user-1',
      userEmail: 'owner@example.com',
      resource: {
        id: 'task-1',
        status: 'open',
        ownerId: 'user-1',
      },
      metadata: {
        score: 92,
        tags: ['security', 'evidence'],
        priority: 'critical',
      },
    });

    expect(sendNotification).toHaveBeenCalledTimes(1);

    sendNotification.mockReset();

    await engine.executeTrigger('task_created', {
      orgId: 'org-a',
      userId: 'user-1',
      userEmail: 'owner@example.com',
      resource: {
        id: 'task-1',
        status: 'closed',
      },
      metadata: {
        score: 40,
        tags: ['ops'],
        priority: 'low',
      },
    });

    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('executes task creation, assignment, and status updates through Supabase', async () => {
    const engine = new WorkflowEngine();
    const rule = createMockWorkflow({
      org_id: 'org-a',
      actions: [
        {
          type: 'assign_task',
          config: {
            title: 'Assign review',
            description: 'Review the control',
            assignedTo: 'user-2',
            dueDate: '2026-03-20T00:00:00.000Z',
          },
        },
        {
          type: 'update_status',
          config: { table: 'org_tasks', status: 'completed' },
        },
        {
          type: 'create_task',
          config: {
            title: 'Follow up',
            description: 'Create evidence',
          },
        },
      ],
    });

    supabase.setResolver((operation) => {
      if (operation.action === 'insert') {
        return { data: operation.values, error: null };
      }
      if (operation.action === 'update') {
        return { data: operation.values, error: null };
      }
      return { data: null, error: null };
    });

    seedRules(engine, rule);

    await engine.executeTrigger('task_created', {
      orgId: 'org-a',
      userId: 'user-1',
      userEmail: 'user@example.com',
      resource: { id: 'task-99' },
    });

    const inserts = supabase.operations.filter(
      (operation) => operation.table === 'tasks' && operation.action === 'insert',
    );
    expect(inserts).toHaveLength(2);
    expect(inserts[0].values).toEqual(
      expect.objectContaining({
        org_id: 'org-a',
        assigned_to: 'user-2',
        title: 'Assign review',
      }),
    );
    expect(inserts[1].values).toEqual(
      expect.objectContaining({
        assigned_to: 'user-1',
        title: 'Follow up',
      }),
    );

    const update = supabase.operations.find(
      (operation) =>
        operation.table === 'org_tasks' && operation.action === 'update',
    );
    expect(update?.filters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'eq', column: 'id', value: 'task-99' }),
      ]),
    );
  });

  it('notifies organization admins when escalating a workflow', async () => {
    const engine = new WorkflowEngine();
    const membershipA = createMockMembership({
      organization_id: 'org-a',
      user_id: 'admin-1',
      role: 'owner',
    });
    const membershipB = createMockMembership({
      organization_id: 'org-a',
      user_id: 'admin-2',
      role: 'admin',
    });

    supabase.queueResponse({
      match: { table: 'org_members', action: 'select', expects: 'many' },
      response: {
        data: [
          { user_id: membershipA.user_id },
          { user_id: membershipB.user_id },
        ],
        error: null,
      },
    });

    seedRules(
      engine,
      createMockWorkflow({
        org_id: 'org-a',
        actions: [
          {
            type: 'escalate',
            config: {
              title: 'Escalation Required',
              message: 'Certificate overdue',
            },
          },
        ],
      }),
    );

    await engine.executeTrigger('task_created', {
      orgId: 'org-a',
      userId: 'user-1',
      userEmail: 'user@example.com',
    });

    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(sendNotification).toHaveBeenNthCalledWith(
      1,
      'org-a',
      ['admin-1'],
      expect.objectContaining({
        type: 'incident.escalated',
        title: 'Escalation Required',
        body: 'Certificate overdue',
        priority: 'high',
      }),
    );
  });

  it('skips disabled rules and rules from other organizations', async () => {
    const engine = new WorkflowEngine();
    const disabled = createMockWorkflow({
      id: 'disabled-rule',
      org_id: 'org-a',
      enabled: false,
    });
    const foreign = createMockWorkflow({
      id: 'foreign-rule',
      org_id: 'org-b',
    });

    seedRules(engine, disabled, foreign);

    await engine.executeTrigger('task_created', {
      orgId: 'org-a',
      userId: 'user-1',
      userEmail: 'user@example.com',
    });

    expect(sendNotification).not.toHaveBeenCalled();
    expect(logActivity).not.toHaveBeenCalled();
  });

  it('logs workflow errors and continues executing later matching rules', async () => {
    const engine = new WorkflowEngine();
    const brokenRule = createMockWorkflow({
      id: 'broken-rule',
      org_id: 'org-a',
      actions: [
        {
          type: 'send_notification',
          config: {
            title: 'Broken',
            message: 'Will fail',
          },
        },
      ],
    });
    const healthyRule = createMockWorkflow({
      id: 'healthy-rule',
      org_id: 'org-a',
      actions: [
        {
          type: 'create_task',
          config: {
            title: 'Recovery task',
            description: 'Continue processing',
          },
        },
      ],
    });

    sendNotification.mockRejectedValueOnce(new Error('notification outage'));
    seedRules(engine, brokenRule, healthyRule);

    await expect(
      engine.executeTrigger('task_created', {
        orgId: 'org-a',
        userId: 'user-1',
        userEmail: 'user@example.com',
      }),
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(
      '[workflow-engine] Failed to execute workflow broken-rule:',
      expect.any(Error),
    );
    expect(
      supabase.operations.some(
        (operation) =>
          operation.table === 'tasks' &&
          operation.action === 'insert' &&
          (operation.values as Record<string, unknown>).title === 'Recovery task',
      ),
    ).toBe(true);
  });
});
