/**
 * NDIS-1.3 — Privacy and dignity.
 *
 * Phase 1 (manual-attestation): privacy policy + staff training on
 * confidentiality + information-handling procedures aligned with the
 * Australian Privacy Principles. FormaOS has policy + training tables;
 * Phase 2 could check policy.cadence + recent staff-training completions.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-1.3',
  'NDIS-1.3 requires a privacy policy, staff training on confidentiality, and information-handling procedures aligned with the Australian Privacy Principles. Phase 1 of the FormaOS NDIS pack is manual-attestation pending Phase 2 predicate logic against the org_policies + org_training tables.',
);

export { meta, evaluate };
