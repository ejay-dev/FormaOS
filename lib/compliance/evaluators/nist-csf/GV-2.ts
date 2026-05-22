/**
 * NIST CSF GV-2 — Risk strategy established.
 *
 * Risk appetite statements are policy documents — FormaOS records
 * risks but not the appetite/tolerance framing. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GV-2',
  'GV-2 requires a documented risk appetite/tolerance — FormaOS records org_risks but not the appetite framing, so a compliance officer must attest the strategy is in place.',
);

export { meta, evaluate };
