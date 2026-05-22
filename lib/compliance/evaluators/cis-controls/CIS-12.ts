/**
 * CIS-12 — Network infrastructure management.
 *
 * Firewall rules / segmentation diagrams are not stored in FormaOS.
 * Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-12',
  'CIS-12 requires network configuration and segmentation evidence — FormaOS does not model firewall rules or network diagrams, so a compliance officer must attest the network is managed securely.',
);

export { meta, evaluate };
