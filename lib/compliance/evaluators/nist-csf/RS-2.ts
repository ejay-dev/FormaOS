/**
 * NIST CSF RS-2 — Incident communications.
 *
 * Stakeholder contact lists and comms templates are not modelled in
 * FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'RS-2',
  'RS-2 requires incident communication plans and stakeholder contacts — FormaOS does not model comms templates, so a compliance officer must attest the plan is in place.',
);

export { meta, evaluate };
