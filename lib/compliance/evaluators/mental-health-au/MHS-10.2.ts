/**
 * MHS-10.2 — Delivery of care: Entry (NSMHS 2010 Standard 10.2).
 *
 * Manual attestation: the intake/entry process, on-entry rights
 * information and waitlist management are clinical-record activities not
 * modelled as structured org_* rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-10.2',
  'Documented intake/entry process recording presenting needs, risk screening and consent, on-entry provision of service and rights information, and recorded entry-decision/waitlist management — manual attestation.',
);

export { evaluate, meta };
