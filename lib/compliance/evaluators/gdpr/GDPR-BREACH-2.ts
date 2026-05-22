/**
 * GDPR-BREACH-2 — Notification readiness.
 *
 * Notification templates and 72h-clock workflow are not modelled as
 * rows. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GDPR-BREACH-2',
  'GDPR-BREACH-2 requires notification templates and a tested 72h workflow — FormaOS does not model templates or approval workflow, so a compliance officer must attest the process is ready.',
);

export { meta, evaluate };
