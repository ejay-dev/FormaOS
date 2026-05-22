/**
 * ISO/IEC 27001:2022 A.8.12 — "Data leakage prevention"
 *
 * A.8.12 requires DLP rule and block reports — no DLP integration exists yet, manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.12',
  'A.8.12 requires DLP rule and block reports — no DLP integration exists yet, manual attestation.',
);

export { evaluate, meta };
