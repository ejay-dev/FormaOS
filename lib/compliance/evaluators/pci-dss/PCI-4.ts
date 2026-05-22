/**
 * PCI-4 — Encrypt transmission.
 *
 * TLS / certificate inventory is platform-layer. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'PCI-4',
  'PCI-4 requires TLS evidence and certificate inventory for cardholder data flows — FormaOS does not expose per-flow certificate inventory, so a compliance officer must attest transmission encryption is enforced.',
);

export { meta, evaluate };
