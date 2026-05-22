/**
 * GDPR-VEND-1 — Vendor data processing agreements.
 *
 * No vendor / DPA table exists. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GDPR-VEND-1',
  'GDPR-VEND-1 requires a vendor register with DPA status — FormaOS does not model vendor DPAs, so a compliance officer must attest agreements are in place for processors.',
);

export { meta, evaluate };
