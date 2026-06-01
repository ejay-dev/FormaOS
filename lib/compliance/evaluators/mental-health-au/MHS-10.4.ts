/**
 * MHS-10.4 — Delivery of care: Treatment and support (NSMHS 2010
 * Standard 10.4).
 *
 * DB-signal: org_risks freshness — elevated (critical/high category)
 * clinical/consumer risks reviewed within 90 days, routine within 365
 * days. Empty register → fail (treatment matched to assessed risk
 * requires a documented risk register).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateRiskFreshness } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateRiskFreshness({
    controlCode: 'MHS-10.4',
    orgId: ctx.orgId,
    db: ctx.db,
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'MHS-10.4',
  evaluator: evaluate,
};

export { evaluate };
