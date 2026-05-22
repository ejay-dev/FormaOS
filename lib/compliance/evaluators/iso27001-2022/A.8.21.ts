/**
 * ISO/IEC 27001:2022 A.8.21 — "Security of network services"
 *
 * A.8.21 requires a network-services inventory with security mechanisms documented — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.21',
  'A.8.21 requires a network-services inventory with security mechanisms documented — manual attestation.',
);

export { evaluate, meta };
