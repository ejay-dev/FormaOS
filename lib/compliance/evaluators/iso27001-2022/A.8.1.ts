/**
 * ISO/IEC 27001:2022 A.8.1 — "User end point devices"
 *
 * A.8.1 requires MDM compliance reports across managed devices — no MDM integration table exists yet, manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.1',
  'A.8.1 requires MDM compliance reports across managed devices — no MDM integration table exists yet, manual attestation.',
);

export { evaluate, meta };
