import 'server-only';

import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// R3 (Audit 2026-05-27): per-org HMAC key lifecycle for the v3-hmac audit
// chain. Each org gets a randomly-generated 32-byte HMAC key the first
// time we write a v3 audit row for them. The raw key is encrypted at
// rest with the platform-level AUDIT_CHAIN_HMAC_KEY using AES-256-GCM
// (same envelope shape as lib/integrations/config-crypto.ts) and stored
// in public.audit_chain_secrets.
//
// Decryption requires:
//   * service_role on the DB (the table denies all non-service-role access)
//   * AUDIT_CHAIN_HMAC_KEY in the Node env (separate from
//     SUPABASE_SERVICE_ROLE_KEY so a single leaked credential can't
//     simultaneously rewrite the chain and decrypt the keys).
//
// The functions in this module are the ONLY legitimate callers of the
// envelope decryption — every other write path should call
// resolveChainSecret() and pass the raw key into audit_log_append_v3.

const ENCRYPTION_ALG = 'aes-256-gcm';
const KEY_LENGTH_BYTES = 32;

type EncryptedKeyEnvelope = {
  __encrypted: true;
  alg: 'aes-256-gcm';
  v: 1;
  iv: string; // base64
  tag: string; // base64
  data: string; // base64
};

function resolveWrappingKey(): Buffer {
  const explicit = process.env.AUDIT_CHAIN_HMAC_KEY?.trim();
  if (explicit) {
    return crypto.createHash('sha256').update(explicit).digest();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'AUDIT_CHAIN_HMAC_KEY is required in production for the R3 keyed audit chain. Provision a fresh 32-byte secret distinct from SUPABASE_SERVICE_ROLE_KEY and INTEGRATION_CONFIG_KEY.',
    );
  }
  // Dev fallback — never use in prod.
  return crypto.createHash('sha256').update('formaos-dev-audit-chain-hmac-secret').digest();
}

function encryptKey(rawKey: Buffer): EncryptedKeyEnvelope {
  const wrappingKey = resolveWrappingKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALG, wrappingKey, iv);
  const ciphertext = Buffer.concat([cipher.update(rawKey), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    __encrypted: true,
    alg: 'aes-256-gcm',
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
  };
}

function decryptKey(envelopeJson: string): Buffer {
  const envelope = JSON.parse(envelopeJson) as EncryptedKeyEnvelope;
  if (envelope.__encrypted !== true || envelope.alg !== 'aes-256-gcm') {
    throw new Error('audit_chain_secrets row has unrecognised envelope shape');
  }
  const wrappingKey = resolveWrappingKey();
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALG,
    wrappingKey,
    Buffer.from(envelope.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final(),
  ]);
  if (plaintext.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `audit_chain_secrets envelope decrypted to ${plaintext.length} bytes (expected ${KEY_LENGTH_BYTES})`,
    );
  }
  return plaintext;
}

export type ChainSecretRow = {
  org_id: string;
  encrypted_key: string;
  algorithm: string;
};

/**
 * Idempotently bootstrap a per-org HMAC key. Returns the raw key.
 *
 * - If a row already exists in audit_chain_secrets, decrypt and return.
 * - Otherwise generate a fresh 32-byte random key, encrypt with the
 *   AUDIT_CHAIN_HMAC_KEY envelope, INSERT (ON CONFLICT DO NOTHING), and
 *   re-read to avoid TOCTOU on the rare case of a concurrent first write.
 */
export async function ensureChainSecret(orgId: string): Promise<Buffer> {
  const admin = createSupabaseAdminClient();
  const existing = await readEnvelope(admin, orgId);
  if (existing) return decryptKey(existing);

  const fresh = crypto.randomBytes(KEY_LENGTH_BYTES);
  const envelope = encryptKey(fresh);
  const { error } = await admin
    .from('audit_chain_secrets')
    .insert({
      org_id: orgId,
      encrypted_key: JSON.stringify(envelope),
      algorithm: 'hmac-sha256',
    });

  // Conflict (race) → re-read and return the winner's key. Anything else
  // is a real error.
  if (error) {
    const code = (error as { code?: string }).code;
    if (code !== '23505') {
      throw new Error(`audit_chain_secrets insert failed: ${error.message}`);
    }
  }
  const finalEnvelope = await readEnvelope(admin, orgId);
  if (!finalEnvelope) {
    throw new Error(
      `audit_chain_secrets row vanished after insert for org ${orgId}`,
    );
  }
  return decryptKey(finalEnvelope);
}

/**
 * Read the existing key for an org. Returns null if no row exists —
 * callers that need a guaranteed key should use ensureChainSecret.
 */
export async function resolveChainSecret(
  orgId: string,
): Promise<Buffer | null> {
  const admin = createSupabaseAdminClient();
  const envelope = await readEnvelope(admin, orgId);
  return envelope ? decryptKey(envelope) : null;
}

async function readEnvelope(
  admin: SupabaseClient,
  orgId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from('audit_chain_secrets')
    .select('encrypted_key')
    .eq('org_id', orgId)
    .maybeSingle();
  if (error) {
    throw new Error(`audit_chain_secrets read failed: ${error.message}`);
  }
  return data?.encrypted_key ?? null;
}

// Exposed for unit tests — never call from production code paths.
export const __testOnly = {
  encryptKey,
  decryptKey,
  resolveWrappingKey,
};
