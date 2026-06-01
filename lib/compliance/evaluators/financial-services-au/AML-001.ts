/**
 * AML-001 — AML/CTF Program Maintenance (AML/CTF Act 2006 s81).
 *
 * DB-signal: org_policies whose title matches AML / CTF, active/published
 * and reviewed within 365 days. No matching policy → fail (the AML/CTF
 * program document is absent).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluatePolicyCadence } from './_shared';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluatePolicyCadence({
    controlCode: 'AML-001',
    orgId: ctx.orgId,
    db: ctx.db,
    keywords: /\baml\b|\bctf\b|anti[-_ ]?money[-_ ]?laundering|counter[-_ ]?terrorism financing/,
    reviewWindowDays: 365,
    missingPolicyMessage:
      'No org_policies titled as an AML/CTF program. Maintain and annually review the AML/CTF program including Part A and Part B (AML/CTF Act 2006 s81).',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: 'AML-001',
  evaluator: evaluate,
};

export { evaluate };
