/**
 * ISO/IEC 27001:2022 A.7.2 — "Physical entry"
 *
 * A.7.2 requires badge / entry-control evidence or a documented NA decision — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.2',
  'A.7.2 requires badge / entry-control evidence or a documented NA decision — manual attestation.',
);

export { evaluate, meta };
