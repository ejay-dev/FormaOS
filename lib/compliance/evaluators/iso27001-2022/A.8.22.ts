/**
 * ISO/IEC 27001:2022 A.8.22 — "Segregation of networks"
 *
 * A.8.22 requires network-segregation diagrams (VPC/subnet topology) — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.22',
  'A.8.22 requires network-segregation diagrams (VPC/subnet topology) — manual attestation.',
);

export { evaluate, meta };
