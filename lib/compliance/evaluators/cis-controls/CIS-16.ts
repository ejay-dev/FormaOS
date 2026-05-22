/**
 * CIS-16 — Application software security.
 *
 * Secure-SDLC, code review, and dependency-scan coverage are not
 * exposed as per-tenant signal in FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-16',
  'CIS-16 requires secure-SDLC, code review, and dependency-scanning evidence — these live in the engineering tool-chain (GitHub, etc.) outside FormaOS, so a compliance officer must attest the program is running.',
);

export { meta, evaluate };
