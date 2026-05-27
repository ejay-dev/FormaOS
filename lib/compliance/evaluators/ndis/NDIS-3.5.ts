/**
 * NDIS-3.5 — Transitions to or from a provider.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. Transition checklists
 * + warm-handover records aren't a distinct artefact in the FormaOS
 * schema yet.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-3.5',
  'NDIS-3.5 requires documented transition checklists + warm-handover records. Manual-attestation pending Phase 3 schema work.',
);

export { meta, evaluate };
