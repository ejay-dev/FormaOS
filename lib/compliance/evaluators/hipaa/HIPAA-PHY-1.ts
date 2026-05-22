/**
 * HIPAA-PHY-1 — Facility access controls.
 *
 * Facility badging and visitor logs are physical-world artefacts not
 * captured by FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'HIPAA-PHY-1',
  'HIPAA-PHY-1 covers physical facility access (badges, visitor logs) — FormaOS does not ingest physical-security telemetry, so a compliance officer must attest facility access is controlled.',
);

export { meta, evaluate };
