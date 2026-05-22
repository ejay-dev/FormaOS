/**
 * ISO/IEC 27001:2022 A.7.12 — "Cabling security"
 *
 * A.7.12 requires cabling-protection evidence or a documented NA decision — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.12',
  'A.7.12 requires cabling-protection evidence or a documented NA decision — manual attestation.',
);

export { evaluate, meta };
