/**
 * Audit 2026-05-27 (Tier 2.B) — client-side port of
 * scripts/verify-rekor-anchor.mjs.
 *
 * Verifies a FormaOS audit-chain anchor against Sigstore Rekor from the
 * browser. Pulls the named Rekor entry over public HTTPS (no auth),
 * decodes the embedded ECDSA P-256 public key + signature, and
 * re-verifies the signature over the claimed top-of-chain hash via
 * SubtleCrypto.
 *
 * WebCrypto verifies ECDSA signatures in raw (r||s) format. Rekor stores
 * DER-encoded ASN.1 signatures, so we parse the DER envelope first.
 */

import type { VerificationStep } from './verify-export-merkle-client';

export type RekorVerificationResult = {
  ok: boolean;
  steps: VerificationStep[];
  summary: {
    uuid: string;
    expected_hash: string;
    recorded_hash: string | null;
    integrated_at: string | null;
    log_index: number | null;
    log_id: string | null;
  };
};

const DEFAULT_REKOR_BASE = 'https://rekor.sigstore.dev';

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      'SubtleCrypto unavailable — this verifier requires a secure context (https or localhost).',
    );
  }
  return subtle;
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  // Node fallback (jest)
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function pemToDer(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
  return base64ToBytes(body);
}

/**
 * Parse a DER-encoded ECDSA signature (SEQUENCE of two INTEGERs r, s)
 * into the raw 64-byte concatenation WebCrypto expects for ECDSA P-256.
 *
 * Implemented inline because we can't import a Node ASN.1 lib in the
 * browser bundle and the parse is tiny.
 */
export function derEcdsaToRaw(der: Uint8Array, componentLen = 32): Uint8Array {
  if (der.length < 8 || der[0] !== 0x30) {
    throw new Error('DER signature: expected SEQUENCE tag.');
  }
  let offset = 2;
  // Skip the optional long-form length byte
  if ((der[1] & 0x80) !== 0) {
    const sizeBytes = der[1] & 0x7f;
    offset = 2 + sizeBytes;
  }

  if (der[offset] !== 0x02) {
    throw new Error('DER signature: expected INTEGER (r).');
  }
  const rLen = der[offset + 1];
  let r = der.slice(offset + 2, offset + 2 + rLen);
  offset += 2 + rLen;

  if (der[offset] !== 0x02) {
    throw new Error('DER signature: expected INTEGER (s).');
  }
  const sLen = der[offset + 1];
  let s = der.slice(offset + 2, offset + 2 + sLen);

  // Strip leading 0x00 padding (DER INTEGERs are signed; positive
  // values with high bit set carry a leading zero).
  while (r.length > componentLen && r[0] === 0x00) r = r.slice(1);
  while (s.length > componentLen && s[0] === 0x00) s = s.slice(1);

  // Left-pad to componentLen with zeros for SubtleCrypto.
  const out = new Uint8Array(componentLen * 2);
  out.set(r, componentLen - r.length);
  out.set(s, componentLen * 2 - s.length);
  return out;
}

const HEX_64 = /^[0-9a-f]{64}$/i;

export type RekorFetcher = (url: string) => Promise<Response>;

export async function verifyRekorAnchor(args: {
  uuid: string;
  expectedTopHash: string;
  rekorBase?: string;
  fetcher?: RekorFetcher;
}): Promise<RekorVerificationResult> {
  const steps: VerificationStep[] = [];
  const summary = {
    uuid: args.uuid,
    expected_hash: args.expectedTopHash,
    recorded_hash: null as string | null,
    integrated_at: null as string | null,
    log_index: null as number | null,
    log_id: null as string | null,
  };

  if (!HEX_64.test(args.expectedTopHash)) {
    steps.push({
      label: 'Input',
      status: 'fail',
      detail: 'expected hash must be a 64-character hex SHA-256.',
    });
    return { ok: false, steps, summary };
  }
  steps.push({ label: 'Input shape', status: 'pass' });

  const fetcher = args.fetcher ?? ((u) => fetch(u, { headers: { Accept: 'application/json' } }));
  const rekorBase = (args.rekorBase ?? DEFAULT_REKOR_BASE).replace(/\/$/, '');
  const url = `${rekorBase}/api/v1/log/entries/${encodeURIComponent(args.uuid)}`;

  let response: Response;
  try {
    response = await fetcher(url);
  } catch (err) {
    steps.push({
      label: 'Rekor lookup',
      status: 'fail',
      detail: `network error: ${(err as Error).message ?? err}`,
    });
    return { ok: false, steps, summary };
  }
  if (!response.ok) {
    steps.push({
      label: 'Rekor lookup',
      status: 'fail',
      detail: `HTTP ${response.status} from ${rekorBase}.`,
    });
    return { ok: false, steps, summary };
  }
  steps.push({ label: 'Rekor lookup', status: 'pass' });

  const payload = (await response.json()) as Record<string, RekorEntry>;
  const entry = payload[args.uuid];
  if (!entry || !entry.body) {
    steps.push({
      label: 'Rekor entry shape',
      status: 'fail',
      detail: 'Rekor returned no entry / missing body.',
    });
    return { ok: false, steps, summary };
  }
  summary.integrated_at = entry.integratedTime
    ? new Date(entry.integratedTime * 1000).toISOString()
    : null;
  summary.log_index = entry.logIndex ?? null;
  summary.log_id = entry.logID ?? null;

  let body: HashedRekordBody;
  try {
    body = JSON.parse(new TextDecoder().decode(base64ToBytes(entry.body))) as HashedRekordBody;
  } catch (err) {
    steps.push({
      label: 'Rekor body decode',
      status: 'fail',
      detail: `JSON parse: ${(err as Error).message ?? err}`,
    });
    return { ok: false, steps, summary };
  }
  if (body.kind !== 'hashedrekord') {
    steps.push({
      label: 'Rekor body kind',
      status: 'fail',
      detail: `expected hashedrekord, got ${body.kind}`,
    });
    return { ok: false, steps, summary };
  }
  steps.push({ label: 'Rekor body decoded', status: 'pass' });

  const recordedHash = body.spec?.data?.hash?.value ?? null;
  summary.recorded_hash = recordedHash;
  if (recordedHash !== args.expectedTopHash.toLowerCase()) {
    steps.push({
      label: 'Hash match',
      status: 'fail',
      detail: `Rekor recorded ${recordedHash ?? 'null'}; expected ${args.expectedTopHash}`,
    });
    return { ok: false, steps, summary };
  }
  steps.push({
    label: 'Hash match',
    status: 'pass',
    detail: `Rekor recorded the expected top-of-chain hash.`,
  });

  const sigBase64 = body.spec?.signature?.content;
  const pubKeyB64 = body.spec?.signature?.publicKey?.content;
  if (!sigBase64 || !pubKeyB64) {
    steps.push({
      label: 'Signature material',
      status: 'fail',
      detail: 'signature.content or publicKey.content missing.',
    });
    return { ok: false, steps, summary };
  }

  const signatureDer = base64ToBytes(sigBase64);
  const pubKeyPem = new TextDecoder().decode(base64ToBytes(pubKeyB64));
  const spkiDer = pemToDer(pubKeyPem);

  let signatureRaw: Uint8Array;
  try {
    signatureRaw = derEcdsaToRaw(signatureDer, 32);
  } catch (err) {
    steps.push({
      label: 'Signature decode',
      status: 'fail',
      detail: `DER parse: ${(err as Error).message ?? err}`,
    });
    return { ok: false, steps, summary };
  }

  let publicKey: CryptoKey;
  try {
    publicKey = await getSubtle().importKey(
      'spki',
      spkiDer.buffer as ArrayBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
  } catch (err) {
    steps.push({
      label: 'Public key import',
      status: 'fail',
      detail: `${(err as Error).message ?? err}`,
    });
    return { ok: false, steps, summary };
  }

  const signedBytes = new TextEncoder().encode(args.expectedTopHash);
  let ok: boolean;
  try {
    ok = await getSubtle().verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      signatureRaw.buffer as ArrayBuffer,
      signedBytes.buffer as ArrayBuffer,
    );
  } catch (err) {
    steps.push({
      label: 'Signature verify',
      status: 'fail',
      detail: `${(err as Error).message ?? err}`,
    });
    return { ok: false, steps, summary };
  }
  if (!ok) {
    steps.push({
      label: 'Signature verify',
      status: 'fail',
      detail: 'signature did not verify against the embedded public key.',
    });
    return { ok: false, steps, summary };
  }
  steps.push({
    label: 'Signature verify',
    status: 'pass',
    detail: 'signature verified against the embedded public key.',
  });

  return { ok: true, steps, summary };
}

type RekorEntry = {
  body: string;
  integratedTime?: number;
  logIndex?: number;
  logID?: string;
};

type HashedRekordBody = {
  kind: string;
  spec?: {
    data?: { hash?: { value?: string } };
    signature?: {
      content?: string;
      publicKey?: { content?: string };
    };
  };
};
