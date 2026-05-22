/**
 * CIS-01 — Inventory of enterprise assets.
 *
 * No structured asset inventory table exists in FormaOS today.
 * Falls back to manual attestation until an asset_inventory model
 * is introduced.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-01',
  'CIS-01 requires a maintained asset inventory — no asset_inventory table exists in FormaOS yet, so a compliance officer must attest the inventory exists outside the platform.',
);

export { meta, evaluate };
