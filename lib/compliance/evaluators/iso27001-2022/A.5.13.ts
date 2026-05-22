/**
 * ISO/IEC 27001:2022 A.5.13 — "Labelling of information"
 *
 * A.5.13 requires labelling procedures and tooling evidence (DLP tags, header markings) — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.13',
  'A.5.13 requires labelling procedures and tooling evidence (DLP tags, header markings) — manual attestation.',
);

export { evaluate, meta };
