/**
 * MHS-7 — Carers (NSMHS 2010 Standard 7).
 *
 * Manual attestation: carer identification (with consent), carer
 * information/education and support arrangements are not modelled as
 * structured rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-7',
  'Carer identification with consumer consent, carer information/education and support arrangements consistent with privacy obligations, and carer involvement in care planning where consented — manual attestation.',
);

export { evaluate, meta };
