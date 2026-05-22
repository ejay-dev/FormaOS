/**
 * HIPAA-ADM-3 — Workforce training.
 *
 * No training_records table. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'HIPAA-ADM-3',
  'HIPAA-ADM-3 requires workforce HIPAA training records — FormaOS does not model training completion, so a compliance officer must attest the program is run with tracking.',
);

export { meta, evaluate };
