/**
 * NIST CSF RS-1 — Incident response plan.
 *
 * Tabletop exercise reports are signed PDFs — not modelled in FormaOS.
 * Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'RS-1',
  'RS-1 requires a tested incident response plan with tabletop exercise evidence — FormaOS does not model exercise reports, so a compliance officer must attest the plan is current and tested.',
);

export { meta, evaluate };
