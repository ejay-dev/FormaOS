/**
 * NDIS-2.7 — Human resource management.
 *
 * Phase 1 (manual-attestation): NDIS Worker Screening Check current for
 * every relevant worker, role-specific competency evidence, supervision
 * records. Phase 2 could check staff/credentials freshness — FormaOS
 * has lib/care-scorecard/credential-monitor for adjacent signal.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'NDIS-2.7',
  'NDIS-2.7 requires NDIS Worker Screening Check current for every relevant worker, role-specific competency evidence, and supervision records. Manual-attestation pending Phase 2 predicate against the staff/credential tables.',
);

export { meta, evaluate };
