/**
 * MHS-8 — Governance, leadership and management (NSMHS 2010 Standard 8).
 *
 * DB-signal: org_policies — at least one current approved governance
 * policy (clinical governance / safety & quality / risk / privacy)
 * reviewed within 365 days. org_policies has no category column, so the
 * match is on title keywords. No matching policy → fail (the governance
 * artefact is absent), never a false pass.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluatePolicyCadence } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluatePolicyCadence({
    controlCode: 'MHS-8',
    orgId: ctx.orgId,
    db: ctx.db,
    keywords:
      /governance|clinical governance|quality|safety and quality|risk management|privacy|workforce/,
    reviewWindowDays: 365,
    missingPolicyMessage:
      'No governance policy found in org_policies (clinical governance, safety & quality, risk management, privacy or workforce). NSMHS Standard 8 requires a current, approved governance policy suite reviewed at least annually.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'MHS-8',
  evaluator: evaluate,
};

export { evaluate };
