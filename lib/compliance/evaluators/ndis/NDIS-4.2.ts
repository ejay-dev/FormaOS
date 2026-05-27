/**
 * NDIS-4.2 — Participant money and property.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. Financial-handling
 * records aren't modelled in the FormaOS schema; participant money
 * management would require segregated-account schema + transaction
 * records before automation is feasible.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-4.2',
  'NDIS-4.2 requires documented financial-handling policy + segregated accounting where the provider handles participant money/property. Manual-attestation pending Phase 3 financial-record schema.',
);

export { meta, evaluate };
