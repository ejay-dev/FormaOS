/**
 * AFS-004 — Conflicts of Interest Management (s912A(1)(aa) Corporations
 * Act 2001).
 *
 * DB-signal: org_registers type='conflict_of_interest' reviewed within
 * 90 days. No register row → manual attestation (the register may be
 * held outside FormaOS).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateRegisterCadence } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateRegisterCadence({
    controlCode: 'AFS-004',
    orgId: ctx.orgId,
    db: ctx.db,
    registerType: 'conflict_of_interest',
    reviewWindowDays: 90,
    missingRegisterMessage:
      'No conflicts-of-interest register entry (org_registers type=conflict_of_interest). Maintain and review the conflicts register quarterly (s912A(1)(aa) Corporations Act 2001) — manual attestation until tagged.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'AFS-004',
  evaluator: evaluate,
};

export { evaluate };
