/**
 * AFS-008 — Client Money Handling (s981A-981M Corporations Act 2001).
 *
 * Manual attestation: trust-account reconciliations, the auditor's
 * report, and client-fund segregation controls are bank/audit
 * artefacts not modelled as FormaOS rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AFS-008',
  'Monthly trust-account reconciliations, client-money audit report, and segregation controls evidencing Chapter 7 client-money compliance (s981A-981M) — manual attestation.',
);

export { evaluate, meta };
