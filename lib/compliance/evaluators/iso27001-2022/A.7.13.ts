/**
 * ISO/IEC 27001:2022 A.7.13 — "Equipment maintenance"
 *
 * A.7.13 requires maintenance logs or a documented NA decision — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.13',
  'A.7.13 requires maintenance logs or a documented NA decision — manual attestation.',
);

export { evaluate, meta };
