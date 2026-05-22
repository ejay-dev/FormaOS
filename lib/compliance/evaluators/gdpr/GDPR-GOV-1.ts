/**
 * GDPR-GOV-1 — Accountability documentation.
 *
 * The compliance register itself is the artefact GDPR demands; we
 * cannot prove its completeness from a single table. Manual
 * attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GDPR-GOV-1',
  'GDPR-GOV-1 requires an accountability register and audit trail — FormaOS holds individual pieces (policies, audit logs) but does not expose a single GDPR register, so a compliance officer must attest the documentation is complete.',
);

export { meta, evaluate };
