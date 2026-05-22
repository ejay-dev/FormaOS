/**
 * ISO/IEC 27001:2022 A.8.17 — "Clock synchronization"
 *
 * A.8.17 requires NTP / clock-sync evidence — no time-sync telemetry exists yet, manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.17',
  'A.8.17 requires NTP / clock-sync evidence — no time-sync telemetry exists yet, manual attestation.',
);

export { evaluate, meta };
