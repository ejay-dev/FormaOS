/**
 * ISO/IEC 27001:2022 A.8.20 — "Networks security"
 *
 * A.8.20 requires firewall-rule and segmentation evidence — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.20',
  'A.8.20 requires firewall-rule and segmentation evidence — manual attestation.',
);

export { evaluate, meta };
