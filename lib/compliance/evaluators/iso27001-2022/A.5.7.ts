/**
 * ISO/IEC 27001:2022 A.5.7 — "Threat intelligence"
 *
 * A.5.7 requires evidence of threat-intelligence triage; no threat_feed table exists yet — flag for follow-up.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.7',
  'A.5.7 requires evidence of threat-intelligence triage; no threat_feed table exists yet — flag for follow-up.',
);

export { evaluate, meta };
