/**
 * AML-002 — Customer Due Diligence (AML/CTF Act 2006 Part 2).
 *
 * Manual attestation: KYC/CDD procedures, a verification-records
 * sample, and the enhanced-CDD log are customer-onboarding artefacts
 * not modelled as FormaOS rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AML-002',
  'Risk-based CDD procedures, a customer identity-verification records sample, and the enhanced-CDD log (AML/CTF Act 2006 Part 2) — manual attestation.',
);

export { evaluate, meta };
