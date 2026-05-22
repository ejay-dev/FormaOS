/**
 * ISO/IEC 27001:2022 A.6.7 — "Remote working"
 *
 * A.6.7 requires evidence of a remote-working policy and MDM/VPN enforcement — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.6.7',
  'A.6.7 requires evidence of a remote-working policy and MDM/VPN enforcement — manual attestation.',
);

export { evaluate, meta };
