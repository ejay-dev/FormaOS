/** @jest-environment node */
/**
 * Audit 2026-05-27 (Tier 2.B) — client Merkle verifier round-trip tests.
 *
 * Builds a small bundle the same way scripts/verify-export-merkle.mjs +
 * the audit-engine emit them, then drives verifyMerkleBundle through the
 * happy path AND the three tamper variants (entry mutated, leaf hash
 * mutated, proof mutated). Catches the canonicalisation / proof
 * regressions that would silently let a tampered bundle pass.
 */

import { createHash } from 'node:crypto';
import {
  verifyMerkleBundle,
  type MerkleBundle,
} from '@/lib/audit/verify-export-merkle-client';

function sha256Hex(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0');
}
function formatCreatedAtV2(input: string) {
  const d = new Date(input);
  return (
    `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}` +
    `.${pad(d.getUTCMilliseconds(), 3)}Z`
  );
}

function canonical(entry: Record<string, unknown>, orgId: string): string {
  return JSON.stringify({
    id: entry.id,
    org_id: orgId,
    user_id: entry.user_id ?? null,
    action: entry.action,
    resource_type: entry.resource_type,
    resource_id: entry.resource_id ?? null,
    details: entry.details ?? {},
    created_at: formatCreatedAtV2(entry.created_at as string),
    prev_hash: entry.prev_hash || '',
  });
}

function leafHash(canonicalUtf8: string): string {
  return sha256Hex(Buffer.concat([Buffer.from([0x00]), Buffer.from(canonicalUtf8, 'utf8')]));
}

function nodeHash(leftHex: string, rightHex: string): string {
  return sha256Hex(
    Buffer.concat([
      Buffer.from([0x01]),
      Buffer.from(leftHex, 'hex'),
      Buffer.from(rightHex, 'hex'),
    ]),
  );
}

/**
 * Build a balanced Merkle tree with explicit per-leaf proofs. The
 * audit-engine uses an RFC-6962-style construction; for the test we
 * use 4 leaves (one round of pairing produces 2 intermediate nodes,
 * then a single root).
 */
function buildBundle(): MerkleBundle {
  const orgId = '00000000-0000-0000-0000-000000000001';
  const baseAt = '2026-05-26T12:00:00.000Z';
  const entries = Array.from({ length: 4 }, (_, i) => ({
    id: `evt-${i}`,
    user_id: null,
    action: 'TEST',
    resource_type: 'unit',
    resource_id: null,
    details: { i },
    created_at: baseAt,
    prev_hash: '',
  }));

  const leaves = entries.map((e) => leafHash(canonical(e, orgId)));

  // Build per-entry inclusion proofs for a 4-leaf balanced tree.
  // Tree:
  //   root = node(L01, L23)
  //   L01  = node(leaf0, leaf1)
  //   L23  = node(leaf2, leaf3)
  const L01 = nodeHash(leaves[0], leaves[1]);
  const L23 = nodeHash(leaves[2], leaves[3]);
  const root = nodeHash(L01, L23);

  const proofs: MerkleBundle['merkle'] extends infer M
    ? M extends { proofs?: infer P }
      ? P
      : never
    : never = {
    'evt-0': [
      { position: 'right', hash: leaves[1] },
      { position: 'right', hash: L23 },
    ],
    'evt-1': [
      { position: 'left', hash: leaves[0] },
      { position: 'right', hash: L23 },
    ],
    'evt-2': [
      { position: 'right', hash: leaves[3] },
      { position: 'left', hash: L01 },
    ],
    'evt-3': [
      { position: 'left', hash: leaves[2] },
      { position: 'left', hash: L01 },
    ],
  };

  return {
    manifest: { org_id: orgId, generated_at: '2026-05-27T00:00:00.000Z' },
    merkle: { algorithm: 'sha256', tree_size: 4, root, proofs },
    entries: entries.map((e, i) => ({ ...e, leaf_hash: leaves[i] })),
  };
}

describe('verifyMerkleBundle()', () => {
  it('verifies a well-formed 4-leaf bundle', async () => {
    const out = await verifyMerkleBundle(buildBundle());
    expect(out.ok).toBe(true);
    expect(out.steps.every((s) => s.status === 'pass')).toBe(true);
    expect(out.summary.tree_size).toBe(4);
  });

  it('reports an empty tree as verified (no entries to check)', async () => {
    const out = await verifyMerkleBundle({
      manifest: { org_id: 'org-x' },
      merkle: { algorithm: 'sha256', tree_size: 0, empty_tree: true, root: '' },
      entries: [],
    });
    expect(out.ok).toBe(true);
    expect(out.steps.some((s) => s.label === 'Empty tree')).toBe(true);
  });

  it('fails when the manifest / merkle / entries are missing', async () => {
    const out = await verifyMerkleBundle({} as MerkleBundle);
    expect(out.ok).toBe(false);
    expect(out.steps[0].label).toBe('Bundle shape');
  });

  it('rejects unsupported algorithms', async () => {
    const bundle = buildBundle();
    bundle.merkle!.algorithm = 'sha512';
    const out = await verifyMerkleBundle(bundle);
    expect(out.ok).toBe(false);
    expect(out.steps.find((s) => s.label === 'Algorithm')?.status).toBe('fail');
  });

  it('catches a tampered entry (leaf-hash mismatch)', async () => {
    const bundle = buildBundle();
    // Mutate the details payload without updating leaf_hash.
    bundle.entries![1].details = { i: 1, tampered: true };
    const out = await verifyMerkleBundle(bundle);
    expect(out.ok).toBe(false);
    expect(out.steps.find((s) => s.label === 'Leaf hashes')?.status).toBe('fail');
  });

  it('catches a tampered proof (does not reconstruct the root)', async () => {
    const bundle = buildBundle();
    // Replace one sibling hash with a different value.
    bundle.merkle!.proofs!['evt-0'][0].hash = 'f'.repeat(64);
    const out = await verifyMerkleBundle(bundle);
    expect(out.ok).toBe(false);
    expect(out.steps.find((s) => s.label === 'Inclusion proofs')?.status).toBe('fail');
  });

  it('catches tree_size / entries.length mismatch', async () => {
    const bundle = buildBundle();
    bundle.merkle!.tree_size = 3;
    const out = await verifyMerkleBundle(bundle);
    expect(out.ok).toBe(false);
    expect(out.steps.find((s) => s.label === 'tree_size matches entries.length')?.status).toBe(
      'fail',
    );
  });
});
