/**
 * HIPAA-TECH-4 — Transmission security.
 *
 * TLS / encryption-in-transit is enforced by the FormaOS deployment
 * layer (Vercel + Supabase) — not exposed as a per-tenant signal.
 * Manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { meta, evaluator: evaluate } = makeManualEvaluator(
  'HIPAA-TECH-4',
  'HIPAA-TECH-4 requires transmission encryption — FormaOS enforces TLS at the platform layer but does not expose per-tenant transport coverage, so a compliance officer must attest the network is encrypted in transit.',
);

export { meta, evaluate };
