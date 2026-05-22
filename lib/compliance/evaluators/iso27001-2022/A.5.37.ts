/**
 * ISO/IEC 27001:2022 A.5.37 — "Documented operating procedures"
 *
 * A.5.37 requires runbook artefacts; no central runbook index exists in the schema today — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.37',
  'A.5.37 requires runbook artefacts; no central runbook index exists in the schema today — manual attestation.',
);

export { evaluate, meta };
