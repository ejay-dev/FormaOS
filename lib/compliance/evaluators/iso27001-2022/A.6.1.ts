/**
 * ISO/IEC 27001:2022 A.6.1 — "Screening"
 *
 * A.6.1 requires background-screening records held in HR systems outside FormaOS — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.6.1',
  'A.6.1 requires background-screening records held in HR systems outside FormaOS — manual attestation.',
);

export { evaluate, meta };
