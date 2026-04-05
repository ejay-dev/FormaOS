jest.mock('@/lib/observability/structured-logger', () => ({
  automationLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  WorkflowContext,
  applyConditionOperator,
  durationToMs,
} from '@/lib/automation/workflow-context';

describe('applyConditionOperator', () => {
  it('eq matches equal values', () => {
    expect(applyConditionOperator('eq', 'foo', 'foo')).toBe(true);
    expect(applyConditionOperator('eq', 'foo', 'bar')).toBe(false);
  });

  it('neq matches non-equal values', () => {
    expect(applyConditionOperator('neq', 'foo', 'bar')).toBe(true);
    expect(applyConditionOperator('neq', 'foo', 'foo')).toBe(false);
  });

  it('gt compares numerically', () => {
    expect(applyConditionOperator('gt', 10, 5)).toBe(true);
    expect(applyConditionOperator('gt', 5, 10)).toBe(false);
  });

  it('lt compares numerically', () => {
    expect(applyConditionOperator('lt', 5, 10)).toBe(true);
    expect(applyConditionOperator('lt', 10, 5)).toBe(false);
  });

  it('gte compares numerically', () => {
    expect(applyConditionOperator('gte', 10, 10)).toBe(true);
    expect(applyConditionOperator('gte', 9, 10)).toBe(false);
  });

  it('lte compares numerically', () => {
    expect(applyConditionOperator('lte', 10, 10)).toBe(true);
    expect(applyConditionOperator('lte', 11, 10)).toBe(false);
  });

  it('contains checks string inclusion', () => {
    expect(applyConditionOperator('contains', 'hello world', 'world')).toBe(
      true,
    );
    expect(applyConditionOperator('contains', 'hello', 'world')).toBe(false);
  });

  it('contains checks array inclusion', () => {
    expect(applyConditionOperator('contains', ['a', 'b'], 'a')).toBe(true);
    expect(applyConditionOperator('contains', ['a', 'b'], 'c')).toBe(false);
  });

  it('not_contains for strings', () => {
    expect(applyConditionOperator('not_contains', 'hello', 'world')).toBe(true);
    expect(applyConditionOperator('not_contains', 'hello world', 'world')).toBe(
      false,
    );
  });

  it('not_contains for arrays', () => {
    expect(applyConditionOperator('not_contains', ['a', 'b'], 'c')).toBe(true);
    expect(applyConditionOperator('not_contains', ['a', 'b'], 'a')).toBe(false);
  });

  it('in checks value in array', () => {
    expect(applyConditionOperator('in', 'a', ['a', 'b'])).toBe(true);
    expect(applyConditionOperator('in', 'c', ['a', 'b'])).toBe(false);
  });

  it('not_in checks value not in array', () => {
    expect(applyConditionOperator('not_in', 'c', ['a', 'b'])).toBe(true);
    expect(applyConditionOperator('not_in', 'a', ['a', 'b'])).toBe(false);
  });

  it('exists checks for non-null/undefined/empty', () => {
    expect(applyConditionOperator('exists', 'hello', undefined)).toBe(true);
    expect(applyConditionOperator('exists', null, undefined)).toBe(false);
    expect(applyConditionOperator('exists', undefined, undefined)).toBe(false);
    expect(applyConditionOperator('exists', '', undefined)).toBe(false);
  });

  it('not_exists checks for null/undefined/empty', () => {
    expect(applyConditionOperator('not_exists', null, undefined)).toBe(true);
    expect(applyConditionOperator('not_exists', 'hello', undefined)).toBe(
      false,
    );
  });

  it('matches tests regex', () => {
    expect(applyConditionOperator('matches', 'hello123', '\\d+')).toBe(true);
    expect(applyConditionOperator('matches', 'hello', '\\d+')).toBe(false);
  });

  it('returns false for invalid regex in matches', () => {
    expect(applyConditionOperator('matches', 'test', '[')).toBe(false);
  });

  it('returns false for unknown operator', () => {
    expect(applyConditionOperator('unknown' as any, 'a', 'b')).toBe(false);
  });
});

describe('durationToMs', () => {
  it('returns number directly', () => {
    expect(durationToMs(5000)).toBe(5000);
  });

  it('parses seconds string', () => {
    expect(durationToMs('30s')).toBe(30_000);
  });

  it('parses minutes string', () => {
    expect(durationToMs('5m')).toBe(300_000);
  });

  it('parses hours string', () => {
    expect(durationToMs('2h')).toBe(7_200_000);
  });

  it('parses days string', () => {
    expect(durationToMs('1d')).toBe(86_400_000);
  });

  it('parses weeks string', () => {
    expect(durationToMs('1w')).toBe(604_800_000);
  });

  it('returns 0 for invalid string', () => {
    expect(durationToMs('invalid')).toBe(0);
  });

  it('parses object with seconds', () => {
    expect(durationToMs({ amount: 10, unit: 'seconds' })).toBe(10_000);
  });

  it('parses object with minutes', () => {
    expect(durationToMs({ amount: 2, unit: 'minutes' })).toBe(120_000);
  });

  it('parses object with hours', () => {
    expect(durationToMs({ amount: 1, unit: 'hours' })).toBe(3_600_000);
  });

  it('parses object with days', () => {
    expect(durationToMs({ amount: 1, unit: 'days' })).toBe(86_400_000);
  });

  it('parses object with weeks', () => {
    expect(durationToMs({ amount: 1, unit: 'weeks' })).toBe(604_800_000);
  });
});

describe('WorkflowContext', () => {
  function makeCtx(overrides?: Record<string, unknown>) {
    return new WorkflowContext({
      trigger: { type: 'manual', data: { key: 'value' } },
      actor: { userId: 'u1', email: 'a@b.com' },
      ...(overrides as any),
    });
  }

  it('constructs with defaults', () => {
    const ctx = makeCtx();
    const exec = ctx.getExecution();
    expect(exec.id).toBe('ephemeral');
    expect(exec.status).toBe('running');
  });

  describe('variables', () => {
    it('sets and gets global variables', () => {
      const ctx = makeCtx();
      ctx.setVariable('x', 42);
      expect(ctx.getVariable('x')).toBe(42);
    });

    it('sets and gets local scoped variables', () => {
      const ctx = makeCtx();
      ctx.pushScope({});
      ctx.setVariable('y', 'local', 'local');
      expect(ctx.getVariable('y')).toBe('local');
      ctx.popScope();
      expect(ctx.getVariable('y')).toBeUndefined();
    });

    it('local scope shadows global', () => {
      const ctx = makeCtx();
      ctx.setVariable('x', 'global');
      ctx.pushScope({ x: 'local' });
      expect(ctx.getVariable('x')).toBe('local');
      ctx.popScope();
      expect(ctx.getVariable('x')).toBe('global');
    });
  });

  describe('stepOutputs', () => {
    it('records and retrieves object outputs', () => {
      const ctx = makeCtx();
      ctx.recordStepOutput('step1', { result: 'ok' });
      const out = ctx.getStepOutput('step1') as any;
      expect(out.result).toBe('ok');
    });

    it('records scalar outputs wrapped in object', () => {
      const ctx = makeCtx();
      ctx.recordStepOutput('step2', 'hello');
      const out = ctx.getStepOutput('step2') as any;
      expect(out.output).toBe('hello');
    });
  });

  describe('resolve', () => {
    it('returns non-string values as-is', () => {
      const ctx = makeCtx();
      expect(ctx.resolve(42)).toBe(42);
      expect(ctx.resolve(null)).toBe(null);
    });

    it('resolves standalone template expression', () => {
      const ctx = makeCtx();
      ctx.setVariable('x', 100);
      expect(ctx.resolve('{{ vars.x }}')).toBe(100);
    });

    it('resolves inline template expressions', () => {
      const ctx = makeCtx();
      ctx.setVariable('name', 'World');
      expect(ctx.resolve('Hello {{ vars.name }}!')).toBe('Hello World!');
    });

    it('returns strings without templates unchanged', () => {
      const ctx = makeCtx();
      expect(ctx.resolve('plain string')).toBe('plain string');
    });
  });

  describe('evaluate', () => {
    it('evaluates literals', () => {
      const ctx = makeCtx();
      expect(ctx.evaluate('true')).toBe(true);
      expect(ctx.evaluate('false')).toBe(false);
      expect(ctx.evaluate('null')).toBe(null);
      expect(ctx.evaluate('undefined')).toBe(undefined);
    });

    it('evaluates numbers', () => {
      const ctx = makeCtx();
      expect(ctx.evaluate('42')).toBe(42);
      expect(ctx.evaluate('-3.14')).toBe(-3.14);
    });

    it('evaluates quoted strings', () => {
      const ctx = makeCtx();
      expect(ctx.evaluate('"hello"')).toBe('hello');
      expect(ctx.evaluate("'world'")).toBe('world');
    });

    it('evaluates references to trigger data', () => {
      const ctx = makeCtx();
      expect(ctx.evaluate('trigger.data.key')).toBe('value');
    });

    it('evaluates builtin function coalesce', () => {
      const ctx = makeCtx();
      expect(ctx.evaluate('coalesce(null, "", "fallback")')).toBe('fallback');
    });

    it('returns undefined for empty expression', () => {
      const ctx = makeCtx();
      expect(ctx.evaluate('')).toBeUndefined();
    });
  });

  describe('evaluateConditions', () => {
    it('AND combinator requires all true', () => {
      const ctx = makeCtx();
      ctx.setVariable('x', 10);
      const result = ctx.evaluateConditions(
        [
          { field: 'vars.x', operator: 'gt', value: 5 },
          { field: 'vars.x', operator: 'lt', value: 20 },
        ],
        'and',
      );
      expect(result).toBe(true);
    });

    it('OR combinator requires any true', () => {
      const ctx = makeCtx();
      ctx.setVariable('x', 10);
      const result = ctx.evaluateConditions(
        [
          { field: 'vars.x', operator: 'gt', value: 100 },
          { field: 'vars.x', operator: 'lt', value: 20 },
        ],
        'or',
      );
      expect(result).toBe(true);
    });
  });

  describe('resolveObject', () => {
    it('recursively resolves templates in objects', () => {
      const ctx = makeCtx();
      ctx.setVariable('name', 'test');
      const result = ctx.resolveObject({
        label: '{{ vars.name }}',
        nested: { v: '{{ vars.name }}' },
      });
      expect(result).toEqual({ label: 'test', nested: { v: 'test' } });
    });

    it('recursively resolves templates in arrays', () => {
      const ctx = makeCtx();
      ctx.setVariable('x', 'val');
      const result = ctx.resolveObject(['{{ vars.x }}', 'static']);
      expect(result).toEqual(['val', 'static']);
    });
  });

  describe('getRuntimeState', () => {
    it('returns a snapshot copy', () => {
      const ctx = makeCtx();
      ctx.setVariable('a', 1);
      const state = ctx.getRuntimeState();
      expect(state.variables.a).toBe(1);
    });
  });

  describe('recordTrace', () => {
    it('pushes to execution trace', () => {
      const ctx = makeCtx();
      ctx.recordTrace({
        stepId: 's1',
        status: 'completed',
        startedAt: '',
        finishedAt: '',
      } as any);
      expect(ctx.getExecution().execution_trace.steps).toHaveLength(1);
    });
  });
});
