/**
 * NDIS-2.2 — Risk management.
 *
 * Phase 1 (manual-attestation): documented risk register reviewed at
 * least quarterly, treatment plans for residual risks, escalation
 * thresholds. Phase 2 could check org_risks.last_reviewed_at cadence.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-2.2',
  'NDIS-2.2 requires a risk register reviewed at least quarterly, with treatment plans for residual risks and documented escalation thresholds. Manual-attestation pending Phase 2 cadence checks against org_risks.',
);

export { meta, evaluate };
