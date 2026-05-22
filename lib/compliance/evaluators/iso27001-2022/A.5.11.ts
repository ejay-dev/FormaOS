/**
 * ISO/IEC 27001:2022 A.5.11 — "Return of assets"
 *
 * A.5.11 requires offboarding asset-return confirmations — no structured asset-return table exists yet, manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.11',
  'A.5.11 requires offboarding asset-return confirmations — no structured asset-return table exists yet, manual attestation.',
);

export { evaluate, meta };
