import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
  ControlResult,
} from './types';

export type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
  ControlResult,
  EvaluationStatus,
  EvidenceRef,
  ControlGap,
} from './types';

const registry = new Map<string, ControlEvaluatorMeta>();

function key(framework: ControlEvaluatorMeta['framework'], controlCode: string) {
  return `${framework}::${controlCode}`;
}

export function registerEvaluator(meta: ControlEvaluatorMeta): void {
  registry.set(key(meta.framework, meta.controlCode), meta);
}

export function getEvaluator(
  framework: ControlEvaluatorMeta['framework'],
  controlCode: string,
): ControlEvaluator | null {
  return registry.get(key(framework, controlCode))?.evaluator ?? null;
}

export function hasEvaluator(
  framework: ControlEvaluatorMeta['framework'],
  controlCode: string,
): boolean {
  return registry.has(key(framework, controlCode));
}

export function listEvaluators(
  framework?: ControlEvaluatorMeta['framework'],
): ControlEvaluatorMeta[] {
  const entries = Array.from(registry.values());
  return framework ? entries.filter((m) => m.framework === framework) : entries;
}

export function clearRegistry(): void {
  registry.clear();
}

export async function evaluateControl(
  framework: ControlEvaluatorMeta['framework'],
  controlCode: string,
  ctx: ControlEvaluatorContext,
): Promise<ControlResult> {
  const evaluator = getEvaluator(framework, controlCode);
  if (!evaluator) {
    return {
      controlCode,
      status: 'not_evaluated',
      evidenceRefs: [],
      gaps: [],
      confidence: 0,
      reason: 'No evaluator registered for this control',
      evaluatedAt: new Date().toISOString(),
    };
  }
  return evaluator(ctx);
}
