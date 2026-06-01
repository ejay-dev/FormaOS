/**
 * MHS-3 — Consumer and carer participation (NSMHS 2010 Standard 3).
 *
 * DB-signal: feedback/complaint entries in org_registers (type or
 * category = feedback OR complaint) within 12 months, flagging any open
 * beyond 30 days. No rows → manual attestation (participation may be
 * evidenced through committee representation tracked outside FormaOS).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateParticipationFeedback } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateParticipationFeedback({
    controlCode: 'MHS-3',
    orgId: ctx.orgId,
    db: ctx.db,
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'MHS-3',
  evaluator: evaluate,
};

export { evaluate };
