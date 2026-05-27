import 'server-only';

import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// R3/R4 follow-up (Audit 2026-05-27) — external anchor for the audit
// hash chain via Sigstore Rekor.
//
// Why: even with R3's keyed HMAC chain, a sufficiently-motivated insider
// with both DB write access AND the per-org HMAC key could still rewrite
// the chain end-to-end and replay all subsequent writes. The external
// anchor lifts that ceiling — submitting the top-of-chain hash to a
// public transparency log (Sigstore Rekor) creates an immutable,
// third-party-witnessed record of the chain state at a specific moment.
// A rewrite after the anchor lands would need to also forge or remove
// a Rekor entry, which is outside our trust domain.
//
// Trust root: Sigstore Rekor (rekor.sigstore.dev). Public, free, no
// account required for submission. Operated by the Linux Foundation /
// Sigstore project. Inclusion proofs are publicly verifiable.
//
// Signing keys: each submission uses an ephemeral ECDSA-P256 keypair.
// The private key is generated in-memory, used for one signature, then
// discarded. The public key is recorded alongside the Rekor entry so
// verifiers can re-check the signature later. Key continuity is NOT
// part of the security model — the trust root is Rekor's append-only
// log, not the persistence of any signing key.
//
// Feature flag: AUDIT_CHAIN_ANCHOR_ENABLED=true to enable submission.
// Without the flag, recordAnchor is a no-op (returns null) so existing
// tests + cold-path code don't accidentally hit the network.

const REKOR_API_BASE =
  process.env.AUDIT_CHAIN_ANCHOR_REKOR_URL?.trim() ||
  'https://rekor.sigstore.dev';
const REKOR_VIEW_BASE =
  process.env.AUDIT_CHAIN_ANCHOR_REKOR_VIEW_URL?.trim() ||
  'https://search.sigstore.dev';

export type AnchorSubmission = {
  orgId: string;
  topEntryHash: string; // hex sha256 of the top audit_log row
  topSequenceNumber: number;
};

export type AnchorResult = {
  rekorEntryUuid: string;
  rekorEntryUrl: string;
  signaturePem: string;
  publicKeyPem: string;
  signedAt: string;
};

function isEnabled(): boolean {
  return (
    (process.env.AUDIT_CHAIN_ANCHOR_ENABLED ?? '').toLowerCase() === 'true'
  );
}

/**
 * Generate an ephemeral ECDSA-P256 keypair. Returns PEM-encoded
 * strings so the signature payload can embed them directly.
 */
export function generateEphemeralSigningKey(): {
  privateKeyPem: string;
  publicKeyPem: string;
} {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return {
    privateKeyPem: privateKey,
    publicKeyPem: publicKey,
  };
}

/**
 * Sign the top-entry hash with the given private key. Returns
 * a base64-encoded ECDSA-SHA256 signature (DER-encoded as Rekor
 * expects).
 */
export function signTopHash(topEntryHash: string, privateKeyPem: string): string {
  // topEntryHash is already a SHA-256 hex digest. Rekor wants a
  // signature over the canonical bytes of the hash, not over a
  // re-hash. We sign the hex string directly.
  const signer = crypto.createSign('SHA256');
  signer.update(topEntryHash, 'utf8');
  signer.end();
  return signer.sign({ key: privateKeyPem, dsaEncoding: 'der' }).toString('base64');
}

/**
 * Verify a signature against the public key + signed payload.
 * Used by scripts/verify-rekor-anchor.mjs and re-exported for tests.
 */
export function verifySignature(
  topEntryHash: string,
  signatureBase64: string,
  publicKeyPem: string,
): boolean {
  const verifier = crypto.createVerify('SHA256');
  verifier.update(topEntryHash, 'utf8');
  verifier.end();
  try {
    return verifier.verify(
      { key: publicKeyPem, dsaEncoding: 'der' },
      Buffer.from(signatureBase64, 'base64'),
    );
  } catch {
    return false;
  }
}

/**
 * Submit a hashedrekord entry to Sigstore Rekor. Returns the entry
 * UUID + view URL on success. Caller is responsible for handling
 * network failures.
 */
async function submitToRekor(
  topEntryHash: string,
  signatureBase64: string,
  publicKeyPem: string,
  signal?: AbortSignal,
): Promise<{ uuid: string; viewUrl: string }> {
  const body = {
    kind: 'hashedrekord',
    apiVersion: '0.0.1',
    spec: {
      signature: {
        content: signatureBase64,
        publicKey: {
          content: Buffer.from(publicKeyPem, 'utf8').toString('base64'),
        },
      },
      data: {
        hash: {
          algorithm: 'sha256',
          value: topEntryHash,
        },
      },
    },
  };

  const response = await fetch(`${REKOR_API_BASE}/api/v1/log/entries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Rekor submission failed: HTTP ${response.status} ${detail.slice(0, 200)}`,
    );
  }

  // Rekor returns { "<entry_uuid>": { ... } } — extract the first key.
  const payload = (await response.json()) as Record<string, unknown>;
  const entries = Object.keys(payload);
  if (entries.length === 0) {
    throw new Error('Rekor returned empty response');
  }
  const uuid = entries[0];
  return {
    uuid,
    viewUrl: `${REKOR_VIEW_BASE}/?uuid=${encodeURIComponent(uuid)}`,
  };
}

/**
 * End-to-end anchor flow: sign the top hash, submit to Rekor, record
 * the result in audit_chain_anchors. Returns null when the feature
 * flag is off so callers can compose this in cron-style loops without
 * branching.
 */
export async function recordAnchor(
  submission: AnchorSubmission,
  options: { signal?: AbortSignal; provider?: 'sigstore-rekor' | 'internal-test' } = {},
): Promise<AnchorResult | null> {
  if (!isEnabled()) return null;

  if (!/^[0-9a-f]{64}$/i.test(submission.topEntryHash)) {
    throw new Error('recordAnchor: topEntryHash must be a 64-char hex SHA-256');
  }
  if (!Number.isInteger(submission.topSequenceNumber) || submission.topSequenceNumber < 1) {
    throw new Error('recordAnchor: topSequenceNumber must be a positive integer');
  }

  const { privateKeyPem, publicKeyPem } = generateEphemeralSigningKey();
  const signatureBase64 = signTopHash(submission.topEntryHash, privateKeyPem);

  const provider = options.provider ?? 'sigstore-rekor';

  let uuid: string;
  let viewUrl: string;
  if (provider === 'internal-test') {
    // Test path — skip the network call, fabricate a synthetic uuid.
    uuid = `test-${crypto.randomBytes(8).toString('hex')}`;
    viewUrl = `internal-test://${uuid}`;
  } else {
    const result = await submitToRekor(
      submission.topEntryHash,
      signatureBase64,
      publicKeyPem,
      options.signal,
    );
    uuid = result.uuid;
    viewUrl = result.viewUrl;
  }

  const signedAt = new Date().toISOString();

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('audit_chain_anchors').insert({
    org_id: submission.orgId,
    anchored_at: signedAt,
    top_sequence_number: submission.topSequenceNumber,
    top_entry_hash: submission.topEntryHash,
    external_anchor_id: uuid,
    external_provider: provider,
    external_anchor_url: viewUrl,
  });
  if (error) {
    throw new Error(`audit_chain_anchors insert failed: ${error.message}`);
  }

  return {
    rekorEntryUuid: uuid,
    rekorEntryUrl: viewUrl,
    signaturePem: signatureBase64,
    publicKeyPem,
    signedAt,
  };
}

/**
 * Resolve the latest chain state per org. Used by the anchor cron + by
 * one-shot tests.
 */
export async function getChainTopForOrg(
  orgId: string,
): Promise<{ topEntryHash: string; topSequenceNumber: number } | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('audit_log')
    .select('entry_hash, sequence_number')
    .eq('org_id', orgId)
    .not('entry_hash', 'is', null)
    .order('sequence_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getChainTopForOrg failed: ${error.message}`);
  if (!data) return null;
  return {
    topEntryHash: data.entry_hash as string,
    topSequenceNumber: data.sequence_number as number,
  };
}
