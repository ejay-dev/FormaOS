/**
 * PCI-1 — Network security controls.
 *
 * Firewall rules / network diagrams are not modelled in FormaOS.
 * Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'PCI-1',
  'PCI-1 requires firewall rulesets and network segmentation diagrams — FormaOS does not model network configuration, so a compliance officer must attest the CDE boundary is enforced.',
);

export { meta, evaluate };
