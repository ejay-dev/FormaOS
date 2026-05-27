/**
 * NDIS-2.6 — Incident management.
 *
 * Phase 1 (manual-attestation): documented incident-management system,
 * reportable-incident workflow that satisfies NDIS Commission notification
 * timeframes, incident register reviewed at least quarterly. Phase 2
 * could check org_incidents cadence + reportable_incidents filing
 * timeliness.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-2.6',
  'NDIS-2.6 requires a documented incident-management system, a reportable-incident workflow satisfying NDIS Commission notification timeframes, and an incident register reviewed at least quarterly. Manual-attestation pending Phase 2 timeliness checks against org_incidents.',
);

export { meta, evaluate };
