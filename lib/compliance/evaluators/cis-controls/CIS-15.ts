/**
 * CIS-15 — Service provider management.
 *
 * Vendor inventory + SOC2 attestations are not modelled as rows in
 * FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-15',
  'CIS-15 requires a vendor register with security attestations — FormaOS does not model vendor inventory yet, so a compliance officer must attest the vendor program is in place.',
);

export { meta, evaluate };
