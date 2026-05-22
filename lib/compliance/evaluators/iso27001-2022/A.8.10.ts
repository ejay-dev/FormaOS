/**
 * ISO/IEC 27001:2022 A.8.10 — "Information deletion"
 *
 * A.8.10 requires evidence of retention / purge job execution — manual attestation pending retention_executions instrumentation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.10',
  'A.8.10 requires evidence of retention / purge job execution — manual attestation pending retention_executions instrumentation.',
);

export { evaluate, meta };
