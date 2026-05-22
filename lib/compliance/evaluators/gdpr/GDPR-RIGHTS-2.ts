/**
 * GDPR-RIGHTS-2 — Consent and lawful basis.
 *
 * No consent_records / lawful_basis table exists. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'GDPR-RIGHTS-2',
  'GDPR-RIGHTS-2 requires consent records and lawful basis register — FormaOS does not model consent capture/withdrawal, so a compliance officer must attest the workflow is in place.',
);

export { meta, evaluate };
