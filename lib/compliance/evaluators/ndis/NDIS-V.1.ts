/**
 * NDIS-V.1 — Specialist Behaviour Support registration.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. Provider registration
 * status with the NDIS Commission is an external fact not modelled in
 * the FormaOS schema; manual attestation is the right pattern.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-V.1',
  'NDIS Verification Module V.1 requires Specialist Behaviour Support Provider registration with the NDIS Commission where applicable. Manual-attestation against the provider\'s current registration certificate.',
);

export { meta, evaluate };
