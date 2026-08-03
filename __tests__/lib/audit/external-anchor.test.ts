/**
 * External-anchor (Audit 2026-05-27 R3/R4 follow-up) — unit tests.
 *
 * The submission flow (network call to Rekor + DB INSERT) is exercised
 * via the `internal-test` provider that fabricates a synthetic uuid
 * and skips the HTTP request — Rekor's API isn't a stable surface to
 * mock and we don't want network on every CI run. The crypto logic
 * (key generation, sign, verify) is tested end-to-end without any
 * mocking.
 */

import {
  generateEphemeralSigningKey,
  signTopHash,
  verifySignature,
} from '@/lib/audit/external-anchor';

describe('generateEphemeralSigningKey', () => {
  it('returns PEM-encoded ECDSA P-256 keypair', () => {
    const { privateKeyPem, publicKeyPem } = generateEphemeralSigningKey();
    expect(privateKeyPem).toMatch(/^-----BEGIN PRIVATE KEY-----/);
    expect(privateKeyPem).toMatch(/-----END PRIVATE KEY-----/);
    expect(publicKeyPem).toMatch(/^-----BEGIN PUBLIC KEY-----/);
    expect(publicKeyPem).toMatch(/-----END PUBLIC KEY-----/);
  });

  it('produces a different keypair each call', () => {
    const a = generateEphemeralSigningKey();
    const b = generateEphemeralSigningKey();
    expect(a.privateKeyPem).not.toBe(b.privateKeyPem);
    expect(a.publicKeyPem).not.toBe(b.publicKeyPem);
  });
});

describe('signTopHash + verifySignature — round trip', () => {
  const topHash = 'a'.repeat(64);

  it('verifies a signature signed with the matching private key', () => {
    const { privateKeyPem, publicKeyPem } = generateEphemeralSigningKey();
    const sig = signTopHash(topHash, privateKeyPem);
    expect(verifySignature(topHash, sig, publicKeyPem)).toBe(true);
  });

  it('rejects a signature when the verifier uses a different public key', () => {
    const a = generateEphemeralSigningKey();
    const b = generateEphemeralSigningKey();
    const sig = signTopHash(topHash, a.privateKeyPem);
    expect(verifySignature(topHash, sig, b.publicKeyPem)).toBe(false);
  });

  it('rejects when the signed hash is different from the verified hash', () => {
    const { privateKeyPem, publicKeyPem } = generateEphemeralSigningKey();
    const sig = signTopHash(topHash, privateKeyPem);
    expect(verifySignature('b'.repeat(64), sig, publicKeyPem)).toBe(false);
  });

  it('returns false (not throws) when the signature is malformed', () => {
    const { publicKeyPem } = generateEphemeralSigningKey();
    expect(
      verifySignature(topHash, 'not-valid-base64-signature', publicKeyPem),
    ).toBe(false);
  });
});

describe('recordAnchor — provider=internal-test', () => {
  // This test mocks Supabase admin client at the module level so the
  // INSERT into audit_chain_anchors is observable without a DB.
  jest.mock('@/lib/supabase/admin', () => ({
    createSupabaseAdminClient: jest.fn(() => ({
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
  }));

  it('returns a synthetic anchor result and skips the network call', async () => {
    // Must be isolateModulesAsync + await: the synchronous isolateModules
    // discards the returned promise, so the `it` finished before any
    // expect ran and this positive-path test could never fail.
    await jest.isolateModulesAsync(async () => {
      const before = { ...process.env };
      process.env.AUDIT_CHAIN_ANCHOR_ENABLED = 'true';
      try {
        const { recordAnchor } = require('@/lib/audit/external-anchor');
        const result = await recordAnchor(
          {
            orgId: '00000000-0000-0000-0000-000000000aaa',
            topEntryHash: 'c'.repeat(64),
            topSequenceNumber: 7,
          },
          { provider: 'internal-test' },
        );
        expect(result).not.toBeNull();
        expect(result.rekorEntryUuid).toMatch(/^test-/);
        expect(result.rekorEntryUrl).toMatch(/^internal-test:\/\//);
        expect(result.signaturePem).toBeTruthy();
        expect(result.publicKeyPem).toMatch(/^-----BEGIN PUBLIC KEY-----/);
      } finally {
        process.env = before;
      }
    });
  });

  it('returns null when AUDIT_CHAIN_ANCHOR_ENABLED is unset', async () => {
    await jest.isolateModulesAsync(async () => {
      const before = { ...process.env };
      delete process.env.AUDIT_CHAIN_ANCHOR_ENABLED;
      try {
        const { recordAnchor } = require('@/lib/audit/external-anchor');
        const result = await recordAnchor(
          {
            orgId: '00000000-0000-0000-0000-000000000aaa',
            topEntryHash: 'd'.repeat(64),
            topSequenceNumber: 1,
          },
          { provider: 'internal-test' },
        );
        expect(result).toBeNull();
      } finally {
        process.env = before;
      }
    });
  });

  it('rejects malformed top hashes', async () => {
    await jest.isolateModulesAsync(async () => {
      const before = { ...process.env };
      process.env.AUDIT_CHAIN_ANCHOR_ENABLED = 'true';
      try {
        const { recordAnchor } = require('@/lib/audit/external-anchor');
        await expect(
          recordAnchor(
            {
              orgId: '00000000-0000-0000-0000-000000000aaa',
              topEntryHash: 'not-a-sha256',
              topSequenceNumber: 1,
            },
            { provider: 'internal-test' },
          ),
        ).rejects.toThrow(/64-char hex/);
      } finally {
        process.env = before;
      }
    });
  });

  it('rejects non-positive sequence numbers', async () => {
    await jest.isolateModulesAsync(async () => {
      const before = { ...process.env };
      process.env.AUDIT_CHAIN_ANCHOR_ENABLED = 'true';
      try {
        const { recordAnchor } = require('@/lib/audit/external-anchor');
        await expect(
          recordAnchor(
            {
              orgId: '00000000-0000-0000-0000-000000000aaa',
              topEntryHash: 'e'.repeat(64),
              topSequenceNumber: 0,
            },
            { provider: 'internal-test' },
          ),
        ).rejects.toThrow(/positive integer/);
      } finally {
        process.env = before;
      }
    });
  });
});
