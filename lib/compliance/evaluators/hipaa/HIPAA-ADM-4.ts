/**
 * HIPAA-ADM-4 — Incident procedures.
 *
 * Incident response plans are signed PDFs not modelled as rows.
 * Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'HIPAA-ADM-4',
  'HIPAA-ADM-4 requires a tested HIPAA incident response procedure — FormaOS records org_incidents but not the procedure document, so a compliance officer must attest the runbook exists and has been tested.',
);

export { meta, evaluate };
