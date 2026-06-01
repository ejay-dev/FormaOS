/**
 * AFCA-002 — Internal Dispute Resolution (ASIC RG 271).
 *
 * DB-signal: complaints in org_registers (type=complaint OR
 * category=complaint) within 12 months, flagging any open beyond the
 * RG 271 30-calendar-day IDR response window. No complaint rows →
 * manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateComplaintHandling } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateComplaintHandling({
    controlCode: 'AFCA-002',
    orgId: ctx.orgId,
    db: ctx.db,
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'AFCA-002',
  evaluator: evaluate,
};

export { evaluate };
