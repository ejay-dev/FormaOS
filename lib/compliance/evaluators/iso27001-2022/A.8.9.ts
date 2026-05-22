/**
 * ISO/IEC 27001:2022 A.8.9 — "Configuration management"
 *
 * A.8.9 requires IaC baselines and drift telemetry — no config-drift table exists yet, manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.9',
  'A.8.9 requires IaC baselines and drift telemetry — no config-drift table exists yet, manual attestation.',
);

export { evaluate, meta };
