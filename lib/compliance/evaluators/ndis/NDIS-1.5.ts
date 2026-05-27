/**
 * NDIS-1.5 — Violence, abuse, neglect, exploitation and discrimination.
 *
 * Phase 1 (manual-attestation): the NDIS Commission expects a documented
 * safeguarding policy, staff training, escalation pathway, and a
 * reportable-incident workflow that satisfies notification timeframes.
 * Phase 2 might join org_incidents + org_policies + org_training.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-1.5',
  'NDIS-1.5 requires a safeguarding policy, staff training on identifying and responding to abuse, a documented escalation pathway, and a reportable-incident workflow satisfying NDIS Commission timeframes. Manual-attestation pending Phase 2 predicate logic.',
);

export { meta, evaluate };
