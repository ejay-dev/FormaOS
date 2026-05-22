/**
 * ISO/IEC 27001:2022 A.5.35 — "Independent review of information security"
 *
 * A.5.35 requires an independent reviewer report (internal audit or external) — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.35',
  'A.5.35 requires an independent reviewer report (internal audit or external) — manual attestation.',
);

export { evaluate, meta };
