/**
 * NDIS-4.1 — Safe environment for the delivery of supports.
 *
 * Phase 1 (manual-attestation): environmental risk assessments for
 * service-delivery locations, emergency procedures, equipment
 * maintenance log. FormaOS has no environment-inspection model;
 * Phase 2 needs schema work before automated signal is feasible.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-4.1',
  'NDIS-4.1 requires environmental risk assessments for service-delivery locations, emergency procedures, and an equipment maintenance log. Manual-attestation pending Phase 2 schema work (no environment-inspection model exists yet).',
);

export { meta, evaluate };
