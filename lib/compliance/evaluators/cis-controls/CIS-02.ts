/**
 * CIS-02 — Inventory of software assets.
 *
 * No software inventory / allowlist table exists in FormaOS today.
 * Manual attestation until a software_inventory model is introduced.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-02',
  'CIS-02 requires a software inventory and allowlist — FormaOS does not model installed-software rows yet, so a compliance officer must attest the inventory and allowlist exist outside the platform.',
);

export { meta, evaluate };
