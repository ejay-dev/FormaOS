/**
 * CIS-03 — Data protection (classification, encryption, retention).
 *
 * Encryption is enforced at the infrastructure layer (Supabase / TLS)
 * and not exposed as per-tenant signal. Data classification has no
 * dedicated table. Manual attestation is the honest answer.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'CIS-03',
  'CIS-03 requires data classification and encryption coverage — FormaOS encrypts at the platform layer but does not model per-tenant classification, so a compliance officer must attest the program is in place.',
);

export { meta, evaluate };
