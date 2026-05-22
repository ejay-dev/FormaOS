/**
 * PCI-3 — Protect stored cardholder data.
 *
 * No cardholder-data flag / inventory exists in FormaOS. Manual
 * attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'PCI-3',
  'PCI-3 requires evidence that stored cardholder data is encrypted and retention is bounded — FormaOS does not flag cardholder data per-tenant, so a compliance officer must attest the controls are in place.',
);

export { meta, evaluate };
