/**
 * MHS-10.1 — Delivery of care: Access (NSMHS 2010 Standard 10.1).
 *
 * Manual attestation: published access criteria, after-hours/crisis
 * access arrangements and access-time monitoring are not modelled as
 * structured rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'MHS-10.1',
  'Published service-access criteria and operating hours, after-hours/crisis access arrangements, evidence of least-restrictive and equitable access, and monitoring of access times and barriers — manual attestation.',
);

export { evaluate, meta };
