/**
 * CIS-13 — Network monitoring and defense.
 *
 * IDS/IPS alert streams are not piped into FormaOS. Manual
 * attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-13',
  'CIS-13 requires network monitoring (IDS/IPS, traffic analysis) — FormaOS does not ingest network telemetry, so a compliance officer must attest the monitoring is active.',
);

export { meta, evaluate };
