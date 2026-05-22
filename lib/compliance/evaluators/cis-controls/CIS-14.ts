/**
 * CIS-14 — Security awareness and skills training.
 *
 * No training_records table exists in FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-14',
  'CIS-14 requires workforce training records and phishing-simulation evidence — FormaOS does not model training completion, so a compliance officer must attest the program is running.',
);

export { meta, evaluate };
