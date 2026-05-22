/**
 * HIPAA-TECH-3 — Integrity safeguards.
 *
 * ePHI integrity (checksums, change logging on sensitive tables) is
 * enforced at infrastructure / application code level — not exposed
 * as a per-tenant row in FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'HIPAA-TECH-3',
  'HIPAA-TECH-3 requires integrity controls (checksums, change logging) on ePHI — these are enforced at the application/database layer and not exposed per-tenant, so a compliance officer must attest the controls are in place.',
);

export { meta, evaluate };
