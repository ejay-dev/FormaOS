/**
 * Tests for lib/evidence/verify-file-hash.ts (R9 — file integrity).
 *
 * Covers the contract that anchors the whole defence:
 *   * computeFileSha256 produces the same hex digest as the canonical
 *     Node crypto path for the same bytes (no off-by-one in Buffer
 *     wrapping, no Uint8Array vs ArrayBuffer drift).
 *   * verifyEvidenceFileHash returns ok:true when the recorded hash
 *     matches the downloaded bytes, and the four documented failure
 *     reasons in every other case.
 */

jest.mock('server-only', () => ({}));

import { createHash } from 'crypto';

jest.mock('@/lib/supabase/admin', () => {
  const download = jest.fn(async () => ({ data: null, error: null }));
  const fromStorage = jest.fn(() => ({ download }));
  const storage = { from: fromStorage };
  const fromTable = jest.fn(() => ({
    select: () => ({
      eq: () => ({
        maybeSingle: jest.fn(),
      }),
    }),
  }));
  const c = { from: fromTable, storage };
  return {
    createSupabaseAdminClient: jest.fn(() => c),
    __admin: c,
    __download: download,
    __fromTable: fromTable,
    __fromStorage: fromStorage,
  };
});

import {
  computeFileSha256,
  verifyEvidenceFileHash,
} from '@/lib/evidence/verify-file-hash';

function adminMock() {
  return require('@/lib/supabase/admin');
}

function setEvidenceRow(row: unknown) {
  const { __fromTable } = adminMock();
  __fromTable.mockImplementation(() => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          row instanceof Error
            ? Promise.resolve({ data: null, error: { message: row.message } })
            : Promise.resolve({ data: row, error: null }),
      }),
    }),
  }));
}

function setDownloadBytes(bytes: Buffer | null, errorMessage?: string) {
  const { __download } = adminMock();
  __download.mockImplementation(async () => {
    if (errorMessage) return { data: null, error: { message: errorMessage } };
    if (bytes === null) return { data: null, error: null };
    return {
      data: {
        arrayBuffer: async () =>
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ),
      },
      error: null,
    };
  });
}

describe('computeFileSha256', () => {
  it('hashes a Buffer to the canonical hex digest', () => {
    const bytes = Buffer.from('hello formaos');
    const expected = createHash('sha256').update(bytes).digest('hex');
    expect(computeFileSha256(bytes)).toBe(expected);
  });

  it('hashes a Uint8Array to the same digest as the equivalent Buffer', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const expected = createHash('sha256').update(bytes).digest('hex');
    expect(computeFileSha256(bytes)).toBe(expected);
  });

  it('hashes an ArrayBuffer to the same digest', () => {
    const u8 = new Uint8Array([9, 8, 7, 6]);
    const ab = u8.buffer.slice(0);
    const expected = createHash('sha256').update(Buffer.from(u8)).digest('hex');
    expect(computeFileSha256(ab)).toBe(expected);
  });

  it('produces a 64-character lowercase hex string', () => {
    const digest = computeFileSha256(Buffer.from('any'));
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('verifyEvidenceFileHash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok:true when recorded hash matches downloaded bytes', async () => {
    const bytes = Buffer.from('verified-evidence-bytes');
    const recordedHash = createHash('sha256').update(bytes).digest('hex');
    setEvidenceRow({
      id: 'ev-1',
      file_path: 'org-x/evidence/file.pdf',
      file_hash: recordedHash,
    });
    setDownloadBytes(bytes);

    const result = await verifyEvidenceFileHash('ev-1');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.hash).toBe(recordedHash);
  });

  it('returns reason:hash_mismatch when the downloaded bytes differ', async () => {
    const recordedHash = createHash('sha256')
      .update('original-bytes')
      .digest('hex');
    setEvidenceRow({
      id: 'ev-2',
      file_path: 'org-x/evidence/file.pdf',
      file_hash: recordedHash,
    });
    setDownloadBytes(Buffer.from('tampered-bytes'));

    const result = await verifyEvidenceFileHash('ev-2');
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'hash_mismatch') {
      expect(result.recordedHash).toBe(recordedHash);
      expect(result.actualHash).not.toBe(recordedHash);
    } else {
      throw new Error(`expected hash_mismatch, got: ${JSON.stringify(result)}`);
    }
  });

  it('returns reason:no_recorded_hash for legacy rows without a hash', async () => {
    setEvidenceRow({
      id: 'ev-3',
      file_path: 'org-x/evidence/legacy.pdf',
      file_hash: null,
    });
    setDownloadBytes(Buffer.from('whatever'));

    const result = await verifyEvidenceFileHash('ev-3');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('no_recorded_hash');
      expect(result.recordedHash).toBeNull();
    }
  });

  it('returns reason:file_missing when storage download errors', async () => {
    setEvidenceRow({
      id: 'ev-4',
      file_path: 'org-x/evidence/missing.pdf',
      file_hash: createHash('sha256').update('x').digest('hex'),
    });
    setDownloadBytes(null, 'Object not found');

    const result = await verifyEvidenceFileHash('ev-4');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('file_missing');
      expect(result.detail).toBe('Object not found');
    }
  });

  it('returns reason:lookup_failed when the evidence row is missing', async () => {
    setEvidenceRow(null);
    const result = await verifyEvidenceFileHash('ev-missing');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('lookup_failed');
    }
  });

  it('returns reason:lookup_failed when the table read errors', async () => {
    setEvidenceRow(new Error('connection reset'));
    const result = await verifyEvidenceFileHash('ev-error');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('lookup_failed');
      expect(result.detail).toBe('connection reset');
    }
  });
});
