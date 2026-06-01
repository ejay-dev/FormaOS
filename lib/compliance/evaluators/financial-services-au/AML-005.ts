/**
 * AML-005 — AML/CTF Staff Training (AML/CTF Act 2006 s81(3)).
 *
 * Manual attestation: the training program, completion records, and
 * assessment results are HR/LMS artefacts not modelled as FormaOS rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AML-005',
  'AML/CTF awareness training program with initial and ongoing completion records and assessment results for all relevant employees (AML/CTF Act 2006 s81(3)) — manual attestation.',
);

export { evaluate, meta };
