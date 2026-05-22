/**
 * ISO/IEC 27001:2022 A.5.6 — "Contact with special interest groups"
 *
 * A.5.6 requires evidence of active SIG / forum memberships maintained outside the platform — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.6',
  'A.5.6 requires evidence of active SIG / forum memberships maintained outside the platform — manual attestation.',
);

export { evaluate, meta };
