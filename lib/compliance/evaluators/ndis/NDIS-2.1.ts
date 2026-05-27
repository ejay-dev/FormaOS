/**
 * NDIS-2.1 — Governance and operational management.
 *
 * Phase 2 (Audit 2026-05-27): manual-attestation. FormaOS org_policies
 * exists but doesn't tag policies by NDIS-governance-category yet, so
 * a faithful automated predicate would over-match. ⚠️ Phase 3 candidate
 * once policy taxonomy is enriched.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-2.1',
  'NDIS-2.1 requires annual governance-policy review + board oversight cadence. Manual-attestation pending Phase 3 policy taxonomy work.',
);

export { meta, evaluate };
