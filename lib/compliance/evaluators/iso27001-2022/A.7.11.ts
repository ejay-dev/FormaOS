/**
 * ISO/IEC 27001:2022 A.7.11 — "Supporting utilities"
 *
 * A.7.11 requires UPS / utility evidence or a documented NA decision (cloud-only) — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.11',
  'A.7.11 requires UPS / utility evidence or a documented NA decision (cloud-only) — manual attestation.',
);

export { evaluate, meta };
