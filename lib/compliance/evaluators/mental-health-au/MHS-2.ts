/**
 * MHS-2 — Safety (NSMHS 2010 Standard 2).
 *
 * DB-signal: org_incidents over the last 12 months — high/critical
 * incidents still open fail the control; incidents open beyond 30 days
 * yield partial. No incident rows → manual attestation (absence of rows
 * is not evidence of a safe environment).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateIncidentSafety } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateIncidentSafety({
    controlCode: 'MHS-2',
    orgId: ctx.orgId,
    db: ctx.db,
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'MHS-2',
  evaluator: evaluate,
};

export { evaluate };
