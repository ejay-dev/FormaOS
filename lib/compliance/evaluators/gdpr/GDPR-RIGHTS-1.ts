/**
 * GDPR-RIGHTS-1 — Data subject request workflow.
 *
 * No DSAR (data subject access request) table exists in FormaOS.
 * Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GDPR-RIGHTS-1',
  'GDPR-RIGHTS-1 requires a DSAR workflow with SLA tracking — FormaOS does not model DSARs, so a compliance officer must attest requests are intaken, tracked, and fulfilled on time.',
);

export { meta, evaluate };
