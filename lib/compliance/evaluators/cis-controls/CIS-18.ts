/**
 * CIS-18 — Penetration testing.
 *
 * Annual pen-test reports are PDF artefacts uploaded outside FormaOS.
 * Manual attestation until a pen_test_results table exists.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-18',
  'CIS-18 requires annual penetration-test evidence — FormaOS does not store pen-test reports as structured rows, so a compliance officer must attest the test is complete and findings are tracked.',
);

export { meta, evaluate };
