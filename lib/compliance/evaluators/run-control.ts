/**
 * Run a single registered evaluator with framework-pack semantics.
 *
 * Audit compliance-004 (2026-05-22): the existing `evaluateControl`
 * helper in `./index` returns the typed `ControlResult` used by the
 * unit evaluator tests. This module re-exports it under the
 * runner-style API documented in the framework spec
 * (`runControlEvaluation`) and adds a try/catch fence so a buggy
 * evaluator can never crash the framework-evaluation pipeline.
 */

import { getEvaluator } from './index';
import type {
  ControlEvaluatorContext,
  ControlResult,
  FrameworkSlug,
} from './types';

export async function runControlEvaluation(
  ctx: ControlEvaluatorContext,
  frameworkSlug: FrameworkSlug,
  controlCode: string,
): Promise<ControlResult> {
  const evaluatedAt = new Date().toISOString();
  const evaluator = getEvaluator(frameworkSlug, controlCode);
  if (!evaluator) {
    return {
      controlCode,
      status: 'not_evaluated',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_evaluator_registered',
          message: `No automated evaluator registered for ${frameworkSlug}:${controlCode}.`,
          severity: 'low',
        },
      ],
      confidence: 0,
      reason: `No automated evaluator registered for ${frameworkSlug}:${controlCode}`,
      evaluatedAt,
    };
  }
  try {
    return await evaluator(ctx);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      controlCode,
      status: 'not_evaluated',
      evidenceRefs: [],
      gaps: [
        {
          code: 'evaluator_threw',
          message: `Evaluator for ${frameworkSlug}:${controlCode} threw: ${message}`,
          severity: 'high',
        },
      ],
      confidence: 0,
      reason: `Evaluator threw: ${message}`,
      evaluatedAt,
    };
  }
}
