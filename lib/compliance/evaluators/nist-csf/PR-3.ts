/**
 * NIST CSF PR-3 — Security awareness training.
 *
 * No training_records table exists in FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'PR-3',
  'PR-3 requires workforce training completion records — FormaOS does not model training, so a compliance officer must attest the program is run with tracking.',
);

export { meta, evaluate };
