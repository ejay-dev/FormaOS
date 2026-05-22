/**
 * ISO/IEC 27001:2022 A.8.6 — "Capacity management"
 *
 * A.8.6 requires capacity-utilisation reports — no capacity-metrics table exists yet, manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.6',
  'A.8.6 requires capacity-utilisation reports — no capacity-metrics table exists yet, manual attestation.',
);

export { evaluate, meta };
