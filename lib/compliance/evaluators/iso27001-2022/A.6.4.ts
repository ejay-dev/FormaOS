/**
 * ISO/IEC 27001:2022 A.6.4 — "Disciplinary process"
 *
 * A.6.4 requires a documented disciplinary policy communicated to staff — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.6.4',
  'A.6.4 requires a documented disciplinary policy communicated to staff — manual attestation.',
);

export { evaluate, meta };
