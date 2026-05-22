/**
 * GDPR-VEND-2 — Cross-border transfer oversight.
 *
 * Transfer mechanisms (SCCs, adequacy decisions) are paper artefacts.
 * Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GDPR-VEND-2',
  'GDPR-VEND-2 requires documented cross-border transfer mechanisms (SCCs, adequacy decisions) — FormaOS does not model transfers, so a compliance officer must attest the safeguards are documented.',
);

export { meta, evaluate };
