/**
 * ISO/IEC 27001:2022 A.5.14 — "Information transfer"
 *
 * A.5.14 requires documented transfer rules / DPAs and encryption channel evidence — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.14',
  'A.5.14 requires documented transfer rules / DPAs and encryption channel evidence — manual attestation.',
);

export { evaluate, meta };
