/**
 * PCI-6 — Secure development.
 *
 * Secure-SDLC, code review, and vuln remediation evidence live in
 * the engineering tool-chain outside FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'PCI-6',
  'PCI-6 requires secure development evidence (SDLC, code review, vuln SLAs) — FormaOS does not capture pull-request or remediation telemetry, so a compliance officer must attest the program is running.',
);

export { meta, evaluate };
