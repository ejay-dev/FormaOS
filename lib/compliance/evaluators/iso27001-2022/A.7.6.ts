/**
 * ISO/IEC 27001:2022 A.7.6 — "Working in secure areas"
 *
 * A.7.6 requires secure-area procedure evidence or a documented NA decision — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.6',
  'A.7.6 requires secure-area procedure evidence or a documented NA decision — manual attestation.',
);

export { evaluate, meta };
