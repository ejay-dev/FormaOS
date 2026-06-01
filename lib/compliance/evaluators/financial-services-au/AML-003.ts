/**
 * AML-003 — Transaction Monitoring (AML/CTF Act 2006 s41, s43).
 *
 * Manual attestation: monitoring-rule configuration, the alert-review
 * log, and SMR/TTR lodgement records live in the transaction-monitoring
 * system, not FormaOS.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AML-003',
  'Transaction-monitoring rule configuration, alert-review log, and SMR/TTR lodgement records (AML/CTF Act 2006 s41, s43) — manual attestation.',
);

export { evaluate, meta };
