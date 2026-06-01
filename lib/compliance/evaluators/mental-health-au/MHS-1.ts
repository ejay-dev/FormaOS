/**
 * MHS-1 — Rights and responsibilities (NSMHS 2010 Standard 1).
 *
 * Manual attestation: a displayed rights charter, on-entry distribution,
 * and rights training are documents/activities not modelled as rows in
 * FormaOS. Matching a title keyword in org_policies would not evidence
 * that the charter is displayed and acknowledged, so we attest manually.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-1',
  'Documented charter of consumer and carer rights and responsibilities (aligned with the Australian Charter of Healthcare Rights), evidence it is prominently displayed and provided on entry, and staff rights training records — manual attestation.',
);

export { evaluate, meta };
