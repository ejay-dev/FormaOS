/**
 * ISO/IEC 27001:2022 A.5.25 — "Assessment and decision on information security events"
 *
 * A.5.25 requires a documented event-to-incident classification matrix — captured as a signed-off procedure; manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.25',
  'A.5.25 requires a documented event-to-incident classification matrix — captured as a signed-off procedure; manual attestation.',
);

export { evaluate, meta };
