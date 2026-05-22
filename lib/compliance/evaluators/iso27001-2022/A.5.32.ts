/**
 * ISO/IEC 27001:2022 A.5.32 — "Intellectual property rights"
 *
 * A.5.32 requires a software / IP licence register maintained outside the platform — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.32',
  'A.5.32 requires a software / IP licence register maintained outside the platform — manual attestation.',
);

export { evaluate, meta };
