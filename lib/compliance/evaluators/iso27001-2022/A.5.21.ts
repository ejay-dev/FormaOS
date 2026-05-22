/**
 * ISO/IEC 27001:2022 A.5.21 — "Managing information security in the ICT supply chain"
 *
 * A.5.21 requires an ICT supply-chain inventory and risk assessment — no structured table exists yet, manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.21',
  'A.5.21 requires an ICT supply-chain inventory and risk assessment — no structured table exists yet, manual attestation.',
);

export { evaluate, meta };
