/** @jest-environment node */
/**
 * Audit 2026-05-27 (Tier 2.B) — client Rekor anchor verifier tests.
 *
 * Drives the verifier with a fake fetcher so we don't hit the real
 * rekor.sigstore.dev during CI. Round-trips a real ECDSA P-256 signature
 * via node:crypto to confirm the DER → raw conversion + SubtleCrypto
 * verify path actually validates a genuine signature.
 */

import {
  generateKeyPairSync,
  createSign,
  randomBytes,
  createHash,
} from 'node:crypto';
import {
  verifyRekorAnchor,
  derEcdsaToRaw,
} from '@/lib/audit/verify-rekor-anchor-client';

function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

function makeRekorEntryBody(args: {
  expectedHash: string;
  signatureDerB64: string;
  publicKeyPemB64: string;
}) {
  return Buffer.from(
    JSON.stringify({
      kind: 'hashedrekord',
      apiVersion: '0.0.1',
      spec: {
        data: { hash: { algorithm: 'sha256', value: args.expectedHash } },
        signature: {
          content: args.signatureDerB64,
          publicKey: { content: args.publicKeyPemB64 },
        },
      },
    }),
    'utf8',
  ).toString('base64');
}

describe('derEcdsaToRaw()', () => {
  it('parses a real DER ECDSA P-256 signature into 64 raw bytes', () => {
    const { publicKey: _pub, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });
    const signer = createSign('SHA256');
    signer.update('test message');
    signer.end();
    const der = signer.sign({ key: privateKey, dsaEncoding: 'der' });
    const raw = derEcdsaToRaw(new Uint8Array(der), 32);
    expect(raw.length).toBe(64);
  });

  it('throws on a non-SEQUENCE DER blob', () => {
    expect(() => derEcdsaToRaw(new Uint8Array([0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]))).toThrow(
      /SEQUENCE/,
    );
  });
});

describe('verifyRekorAnchor()', () => {
  function makeFetcher(body: string, opts: Partial<{ status: number; ok: boolean }> = {}) {
    return async (_url: string): Promise<Response> =>
      ({
        ok: opts.ok ?? true,
        status: opts.status ?? 200,
        json: async () => ({
          'uuid-1': {
            body,
            integratedTime: 1716800000,
            logIndex: 42,
            logID: 'mock-log-id',
          },
        }),
      } as unknown as Response);
  }

  it('rejects a non-hex expected_top_hash', async () => {
    const out = await verifyRekorAnchor({
      uuid: 'uuid-1',
      expectedTopHash: 'not-hex',
      fetcher: makeFetcher('e30=' /* {} */),
    });
    expect(out.ok).toBe(false);
    expect(out.steps[0].status).toBe('fail');
  });

  it('fails when Rekor returns HTTP 404', async () => {
    const out = await verifyRekorAnchor({
      uuid: 'uuid-1',
      expectedTopHash: sha256Hex('whatever'),
      fetcher: makeFetcher('', { ok: false, status: 404 }),
    });
    expect(out.ok).toBe(false);
    expect(out.steps.find((s) => s.label === 'Rekor lookup')?.status).toBe('fail');
  });

  it('fails when the recorded hash does not match the expected hash', async () => {
    const expected = sha256Hex('top-of-chain');
    const wrong = sha256Hex('something-else');
    const body = makeRekorEntryBody({
      expectedHash: wrong,
      signatureDerB64: 'AA==',
      publicKeyPemB64: Buffer.from('-----BEGIN PUBLIC KEY-----\nAA==\n-----END PUBLIC KEY-----').toString(
        'base64',
      ),
    });
    const out = await verifyRekorAnchor({
      uuid: 'uuid-1',
      expectedTopHash: expected,
      fetcher: makeFetcher(body),
    });
    expect(out.ok).toBe(false);
    expect(out.steps.find((s) => s.label === 'Hash match')?.status).toBe('fail');
  });

  it('end-to-end: verifies a genuine ECDSA P-256 signature round-tripped through DER', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });
    const pubPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const expected = randomBytes(32).toString('hex');

    const signer = createSign('SHA256');
    signer.update(expected, 'utf8');
    signer.end();
    const sigDer = signer.sign({ key: privateKey, dsaEncoding: 'der' });

    const body = makeRekorEntryBody({
      expectedHash: expected,
      signatureDerB64: Buffer.from(sigDer).toString('base64'),
      publicKeyPemB64: Buffer.from(pubPem, 'utf8').toString('base64'),
    });

    const out = await verifyRekorAnchor({
      uuid: 'uuid-1',
      expectedTopHash: expected,
      fetcher: makeFetcher(body),
    });
    expect(out.ok).toBe(true);
    expect(out.summary.recorded_hash).toBe(expected);
    expect(out.steps.every((s) => s.status === 'pass')).toBe(true);
  });

  it('fails verification when the signature was made over a different message', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });
    const pubPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const expected = sha256Hex('claimed-top');

    // Sign a DIFFERENT message — verifier should reject.
    const signer = createSign('SHA256');
    signer.update('not-the-claimed-top', 'utf8');
    signer.end();
    const sigDer = signer.sign({ key: privateKey, dsaEncoding: 'der' });

    const body = makeRekorEntryBody({
      expectedHash: expected,
      signatureDerB64: Buffer.from(sigDer).toString('base64'),
      publicKeyPemB64: Buffer.from(pubPem, 'utf8').toString('base64'),
    });

    const out = await verifyRekorAnchor({
      uuid: 'uuid-1',
      expectedTopHash: expected,
      fetcher: makeFetcher(body),
    });
    expect(out.ok).toBe(false);
    expect(out.steps.find((s) => s.label === 'Signature verify')?.status).toBe('fail');
  });
});
