/**
 * ISO/IEC 27001:2022 A.7.3 — "Securing offices, rooms and facilities"
 *
 * A.7.3 requires office security evidence or a documented NA decision — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.3',
  'A.7.3 requires office security evidence or a documented NA decision — manual attestation.',
);

export { evaluate, meta };
