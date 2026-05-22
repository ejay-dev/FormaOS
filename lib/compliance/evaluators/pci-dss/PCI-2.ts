/**
 * PCI-2 — Secure configurations.
 *
 * Hardening baselines for cardholder environment systems are
 * infrastructure-level artefacts. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'PCI-2',
  'PCI-2 requires hardened configuration baselines for CDE systems — FormaOS does not model per-host hardening posture, so a compliance officer must attest baselines are applied and monitored.',
);

export { meta, evaluate };
