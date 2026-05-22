/**
 * ISO/IEC 27001:2022 A.8.34 — "Protection of information systems during audit testing"
 *
 * A.8.34 requires audit-test coordination records — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.34',
  'A.8.34 requires audit-test coordination records — manual attestation.',
);

export { evaluate, meta };
