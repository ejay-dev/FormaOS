import {
  WorkflowEngine,
  WORKFLOW_TEMPLATES,
  type AutomationContext,
} from '@/lib/workflow-engine';

jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(),
}));
jest.mock('@/lib/activity/feed', () => ({
  logActivity: jest.fn(),
}));
jest.mock('@/lib/notifications/engine', () => ({
  notify: jest.fn(),
}));
jest.mock('@/lib/observability/structured-logger', () => ({
  automationLogger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
}));

describe('WORKFLOW_TEMPLATES structure', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(WORKFLOW_TEMPLATES)).toBe(true);
    expect(WORKFLOW_TEMPLATES.length).toBeGreaterThan(0);
  });

  it.each(WORKFLOW_TEMPLATES)('template "$name" has required fields', (tpl) => {
    expect(tpl.name).toBeTruthy();
    expect(tpl.description).toBeTruthy();
    expect(typeof tpl.trigger).toBe('string');
    expect(typeof tpl.enabled).toBe('boolean');
    expect(Array.isArray(tpl.actions)).toBe(true);
    expect(tpl.actions.length).toBeGreaterThan(0);
  });

  it('contains expected trigger types', () => {
    const triggers = WORKFLOW_TEMPLATES.map((t) => t.trigger);
    expect(triggers).toContain('member_added');
    expect(triggers).toContain('certificate_expiring');
    expect(triggers).toContain('task_overdue');
    expect(triggers).toContain('task_completed');
  });

  it('Overdue Task Escalation has conditions', () => {
    const overdue = WORKFLOW_TEMPLATES.find(
      (t) => t.trigger === 'task_overdue',
    );
    expect(overdue).toBeDefined();
    expect(overdue!.conditions).toEqual({ daysOverdue: 3 });
  });
});

describe('WorkflowEngine.evaluateConditions', () => {
  let engine: WorkflowEngine;
  const evaluate = (
    conditions: Record<string, any>,
    context: AutomationContext,
  ) => (engine as any).evaluateConditions(conditions, context);

  const ctx: AutomationContext = {
    orgId: 'org-1',
    userId: 'user-1',
    metadata: { role: 'admin', score: 75, tags: ['compliance', 'audit'] },
  };

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  it('simple equality match', () => {
    expect(evaluate({ orgId: 'org-1' }, ctx)).toBe(true);
  });

  it('simple equality mismatch', () => {
    expect(evaluate({ orgId: 'org-2' }, ctx)).toBe(false);
  });

  it.each([
    ['eq', 'metadata.role', 'admin', true],
    ['eq', 'metadata.role', 'viewer', false],
    ['neq', 'metadata.role', 'viewer', true],
    ['neq', 'metadata.role', 'admin', false],
    ['gt', 'metadata.score', 50, true],
    ['gt', 'metadata.score', 100, false],
    ['gte', 'metadata.score', 75, true],
    ['gte', 'metadata.score', 76, false],
    ['lt', 'metadata.score', 100, true],
    ['lt', 'metadata.score', 50, false],
    ['lte', 'metadata.score', 75, true],
    ['lte', 'metadata.score', 74, false],
  ] as const)(
    '%s operator: path=%s expected=%s → %s',
    (op, path, expected, result) => {
      expect(evaluate({ [path]: { [op]: expected } }, ctx)).toBe(result);
    },
  );

  it('contains with array value', () => {
    expect(evaluate({ 'metadata.tags': { contains: 'compliance' } }, ctx)).toBe(
      true,
    );
    expect(evaluate({ 'metadata.tags': { contains: 'missing' } }, ctx)).toBe(
      false,
    );
  });

  it('contains with string value', () => {
    expect(evaluate({ 'metadata.role': { contains: 'adm' } }, ctx)).toBe(true);
    expect(evaluate({ 'metadata.role': { contains: 'xyz' } }, ctx)).toBe(false);
  });

  it('in operator', () => {
    expect(evaluate({ 'metadata.role': { in: ['admin', 'owner'] } }, ctx)).toBe(
      true,
    );
    expect(evaluate({ 'metadata.role': { in: ['viewer'] } }, ctx)).toBe(false);
  });

  it('notIn operator', () => {
    expect(evaluate({ 'metadata.role': { notIn: ['viewer'] } }, ctx)).toBe(
      true,
    );
    expect(evaluate({ 'metadata.role': { notIn: ['admin'] } }, ctx)).toBe(
      false,
    );
  });

  it('exists operator (true)', () => {
    expect(evaluate({ 'metadata.role': { exists: true } }, ctx)).toBe(true);
    expect(evaluate({ 'metadata.missing': { exists: true } }, ctx)).toBe(false);
  });

  it('exists operator (false)', () => {
    expect(evaluate({ 'metadata.missing': { exists: false } }, ctx)).toBe(true);
    expect(evaluate({ 'metadata.role': { exists: false } }, ctx)).toBe(false);
  });

  it('unknown operator returns false', () => {
    expect(evaluate({ 'metadata.score': { regex: '.*' } }, ctx)).toBe(false);
  });

  it('multiple conditions ANDed', () => {
    expect(
      evaluate({ orgId: 'org-1', 'metadata.role': { eq: 'admin' } }, ctx),
    ).toBe(true);
    expect(
      evaluate({ orgId: 'org-1', 'metadata.role': { eq: 'viewer' } }, ctx),
    ).toBe(false);
  });

  it('deep missing path returns false for eq', () => {
    expect(evaluate({ 'metadata.nonexistent.deep': { eq: 'x' } }, ctx)).toBe(
      false,
    );
  });
});

describe('WorkflowEngine.getContextValue', () => {
  let engine: WorkflowEngine;
  const getValue = (context: any, path: string) =>
    (engine as any).getContextValue(context, path);

  beforeEach(() => {
    engine = new WorkflowEngine();
  });

  it('resolves top-level properties', () => {
    expect(getValue({ orgId: 'org-1' }, 'orgId')).toBe('org-1');
  });

  it('resolves nested properties', () => {
    expect(getValue({ metadata: { role: 'admin' } }, 'metadata.role')).toBe(
      'admin',
    );
  });

  it('resolves deeply nested', () => {
    expect(getValue({ a: { b: { c: 42 } } }, 'a.b.c')).toBe(42);
  });

  it('returns undefined for missing paths', () => {
    expect(getValue({}, 'missing')).toBeUndefined();
  });

  it('returns undefined through null', () => {
    expect(getValue({ a: null }, 'a.b')).toBeUndefined();
  });

  it('returns undefined through primitive', () => {
    expect(getValue({ a: 'string' }, 'a.b')).toBeUndefined();
  });
});
