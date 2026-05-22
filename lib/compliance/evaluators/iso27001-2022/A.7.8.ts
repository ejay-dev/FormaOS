/**
 * ISO/IEC 27001:2022 A.7.8 — "Equipment siting and protection"
 *
 * A.7.8 requires equipment-siting evidence or a documented NA decision — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.8',
  'A.7.8 requires equipment-siting evidence or a documented NA decision — manual attestation.',
);

export { evaluate, meta };
