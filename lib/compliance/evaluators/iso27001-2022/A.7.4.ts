/**
 * ISO/IEC 27001:2022 A.7.4 — "Physical security monitoring"
 *
 * A.7.4 requires alarm / CCTV evidence or a documented NA decision — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.4',
  'A.7.4 requires alarm / CCTV evidence or a documented NA decision — manual attestation.',
);

export { evaluate, meta };
