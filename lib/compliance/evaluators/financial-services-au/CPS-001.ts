/**
 * CPS-001 — Operational Risk Management (APRA CPS 230).
 *
 * DB-signal: org_risks freshness — elevated (critical/high) risks
 * reviewed within 90 days, routine within 365 days. Empty register →
 * fail (CPS 230 mandates a documented operational-risk register).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateRiskFreshness } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateRiskFreshness({
    controlCode: 'CPS-001',
    orgId: ctx.orgId,
    db: ctx.db,
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'CPS-001',
  evaluator: evaluate,
};

export { evaluate };
