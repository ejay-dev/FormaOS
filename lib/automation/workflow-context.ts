import { automationLogger } from '@/lib/observability/structured-logger';
import type {
  Condition,
  Duration,
  ExecutionResult,
  WorkflowExecutionContextInput,
  WorkflowExecutionRecord,
  WorkflowRuntimeState,
} from './workflow-types';

const TEMPLATE_PATTERN = /\{\{\s*([^}]+?)\s*\}\}/g;

type ScopeFrame = Record<string, unknown>;

function getPathValue(source: unknown, path: string): unknown {
  if (!path) {
    return source;
  }

  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  return normalized.split('.').reduce<unknown>((value, segment) => {
    if (value == null || typeof value !== 'object') {
      return undefined;
    }

    return (value as Record<string, unknown>)[segment];
  }, source);
}

function splitArguments(input: string): string[] {
  const args: string[] = [];
  let buffer = '';
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (const char of input) {
    if (quote) {
      buffer += char;
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
      continue;
    }

    if (char === '(') {
      depth += 1;
      buffer += char;
      continue;
    }

    if (char === ')') {
      depth = Math.max(0, depth - 1);
      buffer += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      args.push(buffer.trim());
      buffer = '';
      continue;
    }

    buffer += char;
  }

  if (buffer.trim()) {
    args.push(buffer.trim());
  }

  return args;
}

export class WorkflowContext {
  private readonly scopes: ScopeFrame[] = [];
  private readonly runtime: WorkflowRuntimeState;
  private readonly execution: WorkflowExecutionRecord;
  private readonly trigger: WorkflowExecutionContextInput['trigger'];
  private readonly actor: WorkflowExecutionContextInput['actor'];

  constructor(input: WorkflowExecutionContextInput) {
    this.trigger = {
      ...input.trigger,
      timestamp: input.trigger.timestamp ?? new Date().toISOString(),
    };
    this.execution =
      input.execution ??
      ({
        id: 'ephemeral',
        workflow_id: 'ephemeral',
        workflow_version: 1,
        org_id: 'unknown',
        status: 'running',
        started_at: new Date().toISOString(),
        trigger_event: input.trigger.data,
        execution_trace: { steps: [] },
      } satisfies WorkflowExecutionRecord);
    this.actor = input.actor;
    this.runtime = {
      variables: { ...(input.variables ?? {}) },
      stepOutputs: { ...(input.stepOutputs ?? {}) },
      env: {
        orgName: process.env.NEXT_PUBLIC_APP_NAME ?? 'FormaOS',
        ...(input.env ?? {}),
      },
    };
  }

  getExecution(): WorkflowExecutionRecord {
    return this.execution;
  }

  getRuntimeState(): WorkflowRuntimeState {
    return {
      variables: { ...this.runtime.variables },
      stepOutputs: { ...this.runtime.stepOutputs },
      env: { ...this.runtime.env },
    };
  }

  pushScope(scope: ScopeFrame): void {
    this.scopes.push(scope);
  }

  popScope(): void {
    this.scopes.pop();
  }

  setVariable(name: string, value: unknown, scope: 'global' | 'local' = 'global'): void {
    if (scope === 'local' && this.scopes.length > 0) {
      this.scopes[this.scopes.length - 1][name] = value;
      return;
    }

    this.runtime.variables[name] = value;
  }

  getVariable(name: string): unknown {
    for (let index = this.scopes.length - 1; index >= 0; index -= 1) {
      if (name in this.scopes[index]) {
        return this.scopes[index][name];
      }
    }

    return this.runtime.variables[name];
  }

  recordStepOutput(stepId: string, output: unknown): void {
    if (output && typeof output === 'object' && !Array.isArray(output)) {
      this.runtime.stepOutputs[stepId] = {
        ...(output as Record<string, unknown>),
        output,
      };
      return;
    }

    this.runtime.stepOutputs[stepId] = {
      output,
    };
  }

  recordTrace(result: ExecutionResult): void {
    this.execution.execution_trace.steps.push(result);
  }

  getStepOutput(stepId: string): unknown {
    return this.runtime.stepOutputs[stepId];
  }

  resolve(value: unknown): unknown {
    if (typeof value !== 'string') {
      return value;
    }

    const standalone = value.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (standalone) {
      return this.evaluate(standalone[1]);
    }

    if (!value.includes('{{')) {
      return value;
    }

    return value.replace(TEMPLATE_PATTERN, (_match, expression: string) => {
      const resolved = this.evaluate(expression);
      return resolved == null ? '' : String(resolved);
    });
  }

  resolveObject<T>(input: T): T {
    if (Array.isArray(input)) {
      return input.map((item) => this.resolveObject(item)) as T;
    }

    if (input && typeof input === 'object') {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>).map(([key, value]) => [
          key,
          this.resolveObject(value),
        ]),
      ) as T;
    }

    return this.resolve(input) as T;
  }

  evaluate(expression: string): unknown {
    const trimmed = expression.trim();

    if (!trimmed) {
      return undefined;
    }

    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (trimmed === 'undefined') return undefined;

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }

    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }

    const fnMatch = trimmed.match(/^([a-zA-Z_]\w*)\((.*)\)$/);
    if (fnMatch) {
      const [, fnName, rawArgs] = fnMatch;
      const args = splitArguments(rawArgs).map((arg) => this.evaluate(arg));
      return this.invokeBuiltin(fnName, args);
    }

    return this.resolveReference(trimmed);
  }

  evaluateConditions(
    conditions: Condition[],
    combinator: 'and' | 'or' = 'and',
  ): boolean {
    const results = conditions.map((condition) => {
      const actual = this.evaluate(condition.field);
      const expected = condition.value === undefined ? undefined : this.resolve(condition.value);
      return applyConditionOperator(condition.operator, actual, expected);
    });

    return combinator === 'or' ? results.some(Boolean) : results.every(Boolean);
  }

  private invokeBuiltin(name: string, args: unknown[]): unknown {
    switch (name) {
      case 'now':
        return new Date().toISOString();
      case 'formatDate': {
        const value = args[0];
        const date = value ? new Date(String(value)) : new Date();
        if (Number.isNaN(date.getTime())) {
          return '';
        }

        const format = String(args[1] ?? 'iso');
        if (format === 'date') {
          return date.toISOString().slice(0, 10);
        }
        if (format === 'locale') {
          return date.toLocaleString();
        }
        return date.toISOString();
      }
      case 'jsonPath': {
        const [source, path] = args;
        return getPathValue(source, String(path ?? ''));
      }
      case 'coalesce':
        return args.find((arg) => arg !== null && arg !== undefined && arg !== '');
      case 'count':
        return Array.isArray(args[0]) ? args[0].length : 0;
      case 'sum': {
        const [collection, path] = args;
        if (!Array.isArray(collection)) {
          return 0;
        }

        return collection.reduce((total, item) => {
          const raw = path ? getPathValue(item, String(path)) : item;
          return total + Number(raw ?? 0);
        }, 0);
      }
      default:
        automationLogger.warn('Unknown workflow expression function', { name });
        return undefined;
    }
  }

  private resolveReference(reference: string): unknown {
    const sources: Record<string, unknown> = {
      trigger: this.trigger,
      steps: this.runtime.stepOutputs,
      env: this.runtime.env,
      execution: this.execution,
      vars: this.runtime.variables,
      variables: this.runtime.variables,
      actor: this.actor,
      org: { id: this.execution.org_id, name: this.runtime.env.orgName },
    };

    const [root, ...rest] = reference.split('.');

    if (root in sources) {
      return getPathValue(sources[root], rest.join('.'));
    }

    const scoped = this.getVariable(root);
    if (rest.length === 0) {
      return scoped;
    }

    return getPathValue(scoped, rest.join('.'));
  }
}

export function applyConditionOperator(
  operator: Condition['operator'],
  actual: unknown,
  expected: unknown,
): boolean {
  switch (operator) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'gt':
      return Number(actual) > Number(expected);
    case 'lt':
      return Number(actual) < Number(expected);
    case 'gte':
      return Number(actual) >= Number(expected);
    case 'lte':
      return Number(actual) <= Number(expected);
    case 'contains':
      return Array.isArray(actual)
        ? actual.includes(expected)
        : String(actual ?? '').includes(String(expected ?? ''));
    case 'not_contains':
      return Array.isArray(actual)
        ? !actual.includes(expected)
        : !String(actual ?? '').includes(String(expected ?? ''));
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'not_in':
      return Array.isArray(expected) && !expected.includes(actual);
    case 'exists':
      return actual !== null && actual !== undefined && actual !== '';
    case 'not_exists':
      return actual === null || actual === undefined || actual === '';
    case 'matches': {
      try {
        return new RegExp(String(expected ?? '')).test(String(actual ?? ''));
      } catch (error) {
        automationLogger.warn('Invalid workflow regex', {
          expected,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    }
    default:
      return false;
  }
}

export function durationToMs(duration: Duration): number {
  if (typeof duration === 'number') {
    return duration;
  }

  if (typeof duration === 'string') {
    const match = duration.match(/^(\d+)([smhdw])$/);
    if (!match) {
      return 0;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    return durationToMs({
      amount,
      unit:
        unit === 's'
          ? 'seconds'
          : unit === 'm'
            ? 'minutes'
            : unit === 'h'
              ? 'hours'
              : unit === 'd'
                ? 'days'
                : 'weeks',
    });
  }

  const multiplier =
    duration.unit === 'seconds'
      ? 1000
      : duration.unit === 'minutes'
        ? 60_000
        : duration.unit === 'hours'
          ? 3_600_000
          : duration.unit === 'days'
            ? 86_400_000
            : 604_800_000;

  return duration.amount * multiplier;
}
