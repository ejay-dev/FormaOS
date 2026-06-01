/**
 * MHS-6 — Consumers (NSMHS 2010 Standard 6).
 *
 * Manual attestation: individualised, recovery-oriented care plans and
 * shared-decision-making/consent records are not modelled as structured
 * rows in FormaOS today (care plans live outside org_* compliance
 * tables). Attested manually.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-6',
  'Individualised, recovery-oriented care plans developed with consumer involvement, informed-consent and shared-decision-making records, and evidence of timely access to a range of treatment and support — manual attestation.',
);

export { evaluate, meta };
