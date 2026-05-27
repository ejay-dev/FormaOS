/**
 * R3 (Audit 2026-05-27) — keyed HMAC audit chain unit tests.
 *
 * Covers:
 *   - computeEntryMac is deterministic, uses HMAC-SHA-256, rejects wrong key lengths.
 *   - verifyChainIntegrityAsync detects MAC tampering on a v3-hmac row.
 *   - verifyChainIntegrityAsync returns `missing_mac_key` when the resolver fails to supply a key.
 *   - chain-secret-manager envelope round-trip (encrypt → decrypt) preserves the key bytes.
 */

import crypto from 'crypto';
import {
  computeEntryHash,
  computeEntryMac,
  verifyChainIntegrity,
  verifyChainIntegrityAsync,
  type VerifiableEntry,
} from '@/lib/audit/hash-utils';

const ENV_BACKUP = { ...process.env };
afterEach(() => {
  process.env = { ...ENV_BACKUP };
});

function makeEntry(overrides: Partial<VerifiableEntry> = {}): VerifiableEntry {
  const base = {
    id: '00000000-0000-0000-0000-000000000001',
    org_id: '00000000-0000-0000-0000-0000000000aa',
    user_id: undefined,
    action: 'test_action',
    resource_type: 'test_resource',
    resource_id: undefined,
    details: { hello: 'world' },
    created_at: '2026-05-27T00:00:00.000Z',
    entry_hash: '', // filled below
    prev_hash: '',
    sequence_number: 1,
    hash_algo: 'v3-hmac' as const,
    ...overrides,
  };
  base.entry_hash = computeEntryHash(
    {
      id: base.id,
      orgId: base.org_id,
      userId: base.user_id,
      action: base.action,
      resourceType: base.resource_type,
      resourceId: base.resource_id,
      details: base.details,
      createdAt: base.created_at,
      prevHash: base.prev_hash,
    },
    'v2',
  );
  return base;
}

describe('computeEntryMac', () => {
  const key = crypto.randomBytes(32);

  it('is deterministic for the same key + payload', () => {
    const e = makeEntry();
    const a = computeEntryMac(
      {
        id: e.id,
        orgId: e.org_id,
        userId: e.user_id,
        action: e.action,
        resourceType: e.resource_type,
        resourceId: e.resource_id,
        details: e.details,
        createdAt: e.created_at,
        prevHash: e.prev_hash,
      },
      key,
    );
    const b = computeEntryMac(
      {
        id: e.id,
        orgId: e.org_id,
        userId: e.user_id,
        action: e.action,
        resourceType: e.resource_type,
        resourceId: e.resource_id,
        details: e.details,
        createdAt: e.created_at,
        prevHash: e.prev_hash,
      },
      key,
    );
    expect(a).toEqual(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when the key changes', () => {
    const e = makeEntry();
    const args = {
      id: e.id,
      orgId: e.org_id,
      userId: e.user_id,
      action: e.action,
      resourceType: e.resource_type,
      resourceId: e.resource_id,
      details: e.details,
      createdAt: e.created_at,
      prevHash: e.prev_hash,
    };
    const a = computeEntryMac(args, key);
    const b = computeEntryMac(args, crypto.randomBytes(32));
    expect(a).not.toEqual(b);
  });

  it('rejects keys that are not 32 bytes', () => {
    const e = makeEntry();
    const args = {
      id: e.id,
      orgId: e.org_id,
      userId: e.user_id,
      action: e.action,
      resourceType: e.resource_type,
      resourceId: e.resource_id,
      details: e.details,
      createdAt: e.created_at,
      prevHash: e.prev_hash,
    };
    expect(() => computeEntryMac(args, crypto.randomBytes(16))).toThrow(
      /32-byte/,
    );
  });
});

describe('verifyChainIntegrityAsync — v3-hmac', () => {
  const key = crypto.randomBytes(32);
  const otherKey = crypto.randomBytes(32);

  function chainOf(...entries: VerifiableEntry[]): VerifiableEntry[] {
    // Stitch prev_hash + entry_mac
    let prev = '';
    return entries.map((e, idx) => {
      const stitched = {
        ...e,
        prev_hash: prev,
        sequence_number: idx + 1,
      };
      stitched.entry_hash = computeEntryHash(
        {
          id: stitched.id,
          orgId: stitched.org_id,
          userId: stitched.user_id,
          action: stitched.action,
          resourceType: stitched.resource_type,
          resourceId: stitched.resource_id,
          details: stitched.details,
          createdAt: stitched.created_at,
          prevHash: stitched.prev_hash,
        },
        'v2',
      );
      if (stitched.hash_algo === 'v3-hmac') {
        stitched.entry_mac = computeEntryMac(
          {
            id: stitched.id,
            orgId: stitched.org_id,
            userId: stitched.user_id,
            action: stitched.action,
            resourceType: stitched.resource_type,
            resourceId: stitched.resource_id,
            details: stitched.details,
            createdAt: stitched.created_at,
            prevHash: stitched.prev_hash,
          },
          key,
        );
      }
      prev = stitched.entry_hash;
      return stitched;
    });
  }

  it('passes when MAC + hash both match', async () => {
    const entries = chainOf(
      makeEntry({ id: '00000000-0000-0000-0000-000000000010' }),
      makeEntry({ id: '00000000-0000-0000-0000-000000000011' }),
    );
    const result = await verifyChainIntegrityAsync(entries, () => key);
    expect(result.valid).toBe(true);
    expect(result.totalChecked).toBe(2);
  });

  it('detects tampered MAC', async () => {
    const entries = chainOf(makeEntry());
    entries[0].entry_mac =
      'deadbeef'.repeat(8); // 64-char hex string, wrong value
    const result = await verifyChainIntegrityAsync(entries, () => key);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('mac_mismatch');
  });

  it('detects key compromise (different key produces different MAC)', async () => {
    const entries = chainOf(makeEntry());
    const result = await verifyChainIntegrityAsync(entries, () => otherKey);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('mac_mismatch');
  });

  it('returns missing_mac_key when resolver returns null for a v3-hmac row', async () => {
    const entries = chainOf(makeEntry());
    const result = await verifyChainIntegrityAsync(entries, () => null);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing_mac_key');
  });

  it('passes a mixed v2 + v3-hmac chain when only v3 rows have MACs and the resolver supplies the key', async () => {
    // Manually build mixed chain: row 1 is v2 (no MAC), row 2 is v3-hmac.
    const row1 = makeEntry({
      id: '00000000-0000-0000-0000-000000000020',
      hash_algo: 'v2',
      entry_mac: null,
    });
    const row2 = makeEntry({
      id: '00000000-0000-0000-0000-000000000021',
      hash_algo: 'v3-hmac',
    });
    const entries = chainOf(row1, row2);
    // chainOf wrote MAC for row1 because hash_algo was overridden to v2;
    // explicitly clear so the verifier doesn't see a v2 row with a MAC.
    entries[0].entry_mac = null;
    const result = await verifyChainIntegrityAsync(entries, () => key);
    expect(result.valid).toBe(true);
  });
});

describe('verifyChainIntegrity (sync) — v3-hmac rows', () => {
  it('still verifies entry_hash for v3 rows without the key', () => {
    // Sync verification doesn't check MAC — but should still detect a
    // tampered entry_hash on a v3 row.
    const entry = makeEntry();
    const result = verifyChainIntegrity([entry]);
    expect(result.valid).toBe(true);
  });

  it('flags v3 row with mismatched entry_hash even without MAC check', () => {
    const entry = makeEntry();
    entry.entry_hash = '0'.repeat(64);
    const result = verifyChainIntegrity([entry]);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('hash_mismatch');
  });
});

describe('chain-secret-manager envelope round-trip', () => {
  it('encrypt → decrypt preserves the 32-byte key', () => {
    process.env.AUDIT_CHAIN_HMAC_KEY = 'test-wrapping-secret-2026-05-27';
    process.env.NODE_ENV = 'test';
    jest.isolateModules(() => {

      const { __testOnly } = require('@/lib/audit/chain-secret-manager');
      const rawKey = crypto.randomBytes(32);
      const envelope = __testOnly.encryptKey(rawKey);
      expect(envelope.__encrypted).toBe(true);
      expect(envelope.alg).toBe('aes-256-gcm');
      const decrypted = __testOnly.decryptKey(JSON.stringify(envelope));
      expect(decrypted.equals(rawKey)).toBe(true);
    });
  });
});
