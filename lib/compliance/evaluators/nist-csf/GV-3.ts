/**
 * NIST CSF GV-3 — Supply chain oversight.
 *
 * Vendor inventory + security addenda are not modelled. Manual
 * attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GV-3',
  'GV-3 requires a vendor register with security requirements in contracts — FormaOS does not model vendor inventory yet, so a compliance officer must attest the supply-chain program is in place.',
);

export { meta, evaluate };
