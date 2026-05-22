/**
 * GDPR-DATA-1 — Records of processing.
 *
 * No formal ROPA (records-of-processing-activities) table exists in
 * FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GDPR-DATA-1',
  'GDPR-DATA-1 requires a ROPA (records of processing activities) — FormaOS does not model processing activities as rows, so a compliance officer must attest the register is current.',
);

export { meta, evaluate };
