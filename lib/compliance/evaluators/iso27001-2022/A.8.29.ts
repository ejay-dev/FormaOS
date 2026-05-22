/**
 * ISO/IEC 27001:2022 A.8.29 — "Security testing in development and acceptance"
 *
 * A.8.29 requires SAST / DAST / SCA evidence exported from CI — manual attestation pending CI signal integration.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.29',
  'A.8.29 requires SAST / DAST / SCA evidence exported from CI — manual attestation pending CI signal integration.',
);

export { evaluate, meta };
