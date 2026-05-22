/**
 * NIST CSF RC-2 — Post-incident improvements.
 *
 * Retrospectives and improvement backlogs are facilitated artefacts
 * not modelled as structured rows in FormaOS. Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'RC-2',
  'RC-2 requires post-incident retrospectives and improvement backlogs — FormaOS records org_capa_items but does not enforce retrospective workflow, so a compliance officer must attest reviews happen after each incident.',
);

export { meta, evaluate };
