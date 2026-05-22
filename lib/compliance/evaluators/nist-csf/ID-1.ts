/**
 * NIST CSF ID-1 — Asset inventory maintained.
 *
 * No asset_inventory table exists. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'ID-1',
  'ID-1 requires a living asset inventory with owners and classifications — FormaOS does not model assets as rows yet, so a compliance officer must attest the inventory is maintained.',
);

export { meta, evaluate };
