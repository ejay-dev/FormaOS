/**
 * CPS-002 — Business Continuity Planning (APRA CPS 230).
 *
 * DB-signal: org_registers type='business_continuity_plan' reviewed
 * within 365 days. No register row → manual attestation.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateRegisterCadence } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateRegisterCadence({
    controlCode: 'CPS-002',
    orgId: ctx.orgId,
    db: ctx.db,
    registerType: 'business_continuity_plan',
    reviewWindowDays: 365,
    missingRegisterMessage:
      'No business-continuity-plan register entry (org_registers type=business_continuity_plan). Test the BCP annually and record it (APRA CPS 230) — manual attestation until tagged.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'CPS-002',
  evaluator: evaluate,
};

export { evaluate };
