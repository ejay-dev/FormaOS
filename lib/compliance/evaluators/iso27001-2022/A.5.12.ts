/**
 * ISO/IEC 27001:2022 A.5.12 — "Classification of information"
 *
 * A.5.12 requires an approved classification scheme — captured as a signed-off policy artefact; manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.12',
  'A.5.12 requires an approved classification scheme — captured as a signed-off policy artefact; manual attestation.',
);

export { evaluate, meta };
