/**
 * Trust Packet runtime-derived claims (High-19).
 *
 * Replaces the previous hardcoded `encryption_at_rest: true,
 * encryption_in_transit: true` literals in the trust packet payload
 * with values that are actually derived from runtime configuration.
 *
 * The values shipped today are still mostly true-by-construction
 * (Supabase Storage IS always encrypted at rest, all TLS termination
 * happens at Vercel/CloudFront), but routing them through this module
 * gives us one place to honestly downgrade a claim if a future change
 * breaks it (e.g. self-hosted storage, disabled HSTS).
 */

import { createHmac, timingSafeEqual } from 'crypto';

import type { OrgSsoConfig } from '@/lib/sso/saml';

export interface TrustClaims {
  role_based_access: boolean;
  audit_logging: boolean;
  encryption_at_rest: boolean;
  encryption_in_transit: boolean;
  sso_provisioned: boolean;
  mfa_available: boolean;
  // Provenance fields make the claim traceable in vendor due diligence.
  computed_at: string;
  computed_from: 'runtime';
}

export function computeTrustClaims(args: {
  hasAuditLogs: boolean;
  hasMfaEnabled: boolean;
  ssoConfig: OrgSsoConfig | null;
}): TrustClaims {
  // Supabase Storage encrypts every object at rest with AES-256 unless
  // explicitly disabled. We don't currently expose a switch to disable
  // it, but we still source the value from a config flag so a future
  // self-hosted-storage path can downgrade the claim honestly.
  const storageEncryptedAtRest =
    process.env.FORMAOS_STORAGE_ENCRYPTED_AT_REST !== 'false';

  // Vercel and CloudFront terminate TLS for every request that reaches
  // production routes. HSTS is set in proxy.ts. Sourcing from env keeps
  // the claim downgradable if we ever serve plaintext (e.g. a WS
  // sidecar without TLS).
  const tlsEverywhere =
    process.env.FORMAOS_TLS_EVERYWHERE !== 'false';

  return {
    role_based_access: true,
    audit_logging: args.hasAuditLogs,
    encryption_at_rest: storageEncryptedAtRest,
    encryption_in_transit: tlsEverywhere,
    // Truth in advertising: SSO is "provisioned" only if the org has an
    // actual configured + enabled SAML record, not merely "they're on
    // an enterprise plan".
    sso_provisioned: Boolean(args.ssoConfig?.enabled),
    mfa_available: args.hasMfaEnabled,
    computed_at: new Date().toISOString(),
    computed_from: 'runtime',
  };
}

/**
 * HMAC-SHA256 signature for trust packets (High-19).
 *
 * Cheaper than JWS w/ JWKS but still gives recipients a way to verify
 * the packet was issued by FormaOS and not modified in transit. Public
 * verification is exposed at /api/trust-packet/verify.
 *
 * Long-term upgrade path: swap to RS256/EdDSA + JWKS when there is
 * partner demand for offline verification without contacting FormaOS.
 */
function getSigningSecret(): string {
  // Fall back to SUPABASE_SERVICE_ROLE_KEY in dev so the route works
  // out-of-the-box without yet another env var. Production must set
  // TRUST_PACKET_SIGNING_KEY explicitly — a missing key is a fail.
  const explicit = process.env.TRUST_PACKET_SIGNING_KEY?.trim();
  if (explicit) return explicit;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'TRUST_PACKET_SIGNING_KEY is required in production for trust packet signing',
    );
  }

  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-trust-packet-key';
}

export function signTrustPacket(payload: unknown): {
  algorithm: 'hmac-sha256';
  signature: string;
} {
  const canonical = JSON.stringify(payload);
  const signature = createHmac('sha256', getSigningSecret())
    .update(canonical)
    .digest('hex');
  return { algorithm: 'hmac-sha256', signature };
}

export function verifyTrustPacketSignature(
  payload: unknown,
  signatureHex: string,
): boolean {
  const expected = signTrustPacket(payload).signature;
  if (expected.length !== signatureHex.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signatureHex, 'hex'),
    );
  } catch {
    return false;
  }
}
