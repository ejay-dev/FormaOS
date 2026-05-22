/**
 * HIPAA-PHY-2 — Workstation security.
 *
 * Device/MDM posture is enforced at the IT layer (MDM provider), not
 * recorded in FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'HIPAA-PHY-2',
  'HIPAA-PHY-2 requires workstation security (screen lock, MDM, secure disposal) — FormaOS does not ingest endpoint posture, so a compliance officer must attest device safeguards are enforced.',
);

export { meta, evaluate };
