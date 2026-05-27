/**
 * NDIS-1.1 — Person-centred supports.
 *
 * Phase 1 (manual-attestation): an NDIS auditor verifies the provider
 * documents person-centred planning processes, captures participant
 * goals/preferences, and reviews plans at least every six months. The
 * FormaOS schema models care plans but has no signal for "respects
 * culture, diversity, values and beliefs" — Phase 2 might infer from
 * participant-profile field completion + plan review cadence.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-1.1',
  'NDIS-1.1 requires evidence that each participant accesses supports respecting their culture, diversity, values and beliefs. Phase 1 of the FormaOS NDIS pack is manual-attestation: a compliance officer must attest that person-centred planning processes are documented and reviewed at least every six months.',
);

export { meta, evaluate };
