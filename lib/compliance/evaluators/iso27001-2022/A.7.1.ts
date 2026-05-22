/**
 * ISO/IEC 27001:2022 A.7.1 — "Physical security perimeters"
 *
 * A.7.1 requires perimeter design evidence or a documented NA decision (cloud-only) — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.1',
  'A.7.1 requires perimeter design evidence or a documented NA decision (cloud-only) — manual attestation.',
);

export { evaluate, meta };
