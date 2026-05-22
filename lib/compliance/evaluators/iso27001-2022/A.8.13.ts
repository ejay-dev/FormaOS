/**
 * ISO/IEC 27001:2022 A.8.13 — "Information backup"
 *
 * A.8.13 requires backup schedules and restore-test results — no backup-test table exists yet, manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.13',
  'A.8.13 requires backup schedules and restore-test results — no backup-test table exists yet, manual attestation.',
);

export { evaluate, meta };
