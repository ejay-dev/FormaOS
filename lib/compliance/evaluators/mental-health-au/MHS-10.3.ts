/**
 * MHS-10.3 — Delivery of care: Assessment and review (NSMHS 2010
 * Standard 10.3).
 *
 * Manual attestation: comprehensive biopsychosocial assessments and
 * scheduled/triggered care reviews are clinical-record activities not
 * modelled as structured org_* rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-10.3',
  'Comprehensive biopsychosocial assessment including risk, agreed care-plan review intervals with evidence of scheduled and triggered reviews, and assessment outcomes shared with the consumer and (with consent) carers — manual attestation.',
);

export { evaluate, meta };
