/**
 * R4 (Audit 2026-05-27) — Merkle inclusion proofs unit tests.
 *
 * Covers:
 *   - Empty input → empty-tree marker
 *   - Single leaf → root equals leaf hash
 *   - Even + odd leaf counts → proofs verify against the root
 *   - Tampered leaf payload → proof fails
 *   - Tampered proof → verification fails
 *   - RFC 6962-style domain separation (leaf 0x00, node 0x01)
 *   - Deterministic root: same input always produces the same root
 */

import { createHash } from 'crypto';
import {
  buildMerkleTree,
  hashLeaf,
  verifyMerkleProof,
} from '@/lib/audit/merkle';

function fakeLeaves(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `leaf-${i}`,
    payload: JSON.stringify({ index: i, body: `payload ${i}` }),
  }));
}

describe('buildMerkleTree', () => {
  it('returns empty-tree marker for zero leaves', () => {
    const tree = buildMerkleTree([]);
    expect(tree.emptyTree).toBe(true);
    expect(tree.treeSize).toBe(0);
    expect(tree.root).toBe('');
    expect(tree.leafHashes).toEqual([]);
    expect(tree.proofs).toEqual({});
  });

  it('single leaf: root equals the leaf hash; proof is empty', () => {
    const leaves = fakeLeaves(1);
    const tree = buildMerkleTree(leaves);
    expect(tree.treeSize).toBe(1);
    expect(tree.root).toBe(hashLeaf(leaves[0].payload));
    expect(tree.proofs[leaves[0].id]).toEqual([]);
    expect(verifyMerkleProof(leaves[0].payload, [], tree.root)).toBe(true);
  });

  it('two leaves: root combines leaf hashes with the node prefix', () => {
    const leaves = fakeLeaves(2);
    const tree = buildMerkleTree(leaves);
    expect(tree.treeSize).toBe(2);

    const leaf0 = hashLeaf(leaves[0].payload);
    const leaf1 = hashLeaf(leaves[1].payload);
    // Hash node = SHA-256(0x01 || left || right)
    const expectedRoot = createHash('sha256')
      .update(
        Buffer.concat([
          Buffer.from([0x01]),
          Buffer.from(leaf0, 'hex'),
          Buffer.from(leaf1, 'hex'),
        ]),
      )
      .digest('hex');
    expect(tree.root).toBe(expectedRoot);
  });

  it('is deterministic — same input always produces the same root', () => {
    const a = buildMerkleTree(fakeLeaves(7));
    const b = buildMerkleTree(fakeLeaves(7));
    expect(a.root).toBe(b.root);
    expect(a.proofs).toEqual(b.proofs);
  });

  it('changes root when any leaf payload changes', () => {
    const a = buildMerkleTree(fakeLeaves(5));
    const tampered = fakeLeaves(5);
    tampered[2].payload = JSON.stringify({ tampered: true });
    const b = buildMerkleTree(tampered);
    expect(a.root).not.toBe(b.root);
  });
});

describe('verifyMerkleProof — round trip', () => {
  it('verifies every leaf against its proof and the published root, for arbitrary sizes', () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 17, 100]) {
      const leaves = fakeLeaves(n);
      const tree = buildMerkleTree(leaves);
      for (const leaf of leaves) {
        const ok = verifyMerkleProof(leaf.payload, tree.proofs[leaf.id], tree.root);
        if (!ok) {
          throw new Error(
            `tree size ${n}: leaf ${leaf.id} failed inclusion proof against root ${tree.root}`,
          );
        }
      }
    }
  });

  it('rejects a tampered leaf payload', () => {
    const leaves = fakeLeaves(8);
    const tree = buildMerkleTree(leaves);
    const ok = verifyMerkleProof(
      JSON.stringify({ tampered: true }),
      tree.proofs[leaves[3].id],
      tree.root,
    );
    expect(ok).toBe(false);
  });

  it('rejects a tampered proof sibling', () => {
    const leaves = fakeLeaves(8);
    const tree = buildMerkleTree(leaves);
    const proof = tree.proofs[leaves[3].id];
    if (proof.length === 0) return; // single-leaf trees have empty proofs
    const tamperedProof = [...proof];
    tamperedProof[0] = { ...tamperedProof[0], hash: '0'.repeat(64) };
    const ok = verifyMerkleProof(leaves[3].payload, tamperedProof, tree.root);
    expect(ok).toBe(false);
  });

  it('rejects when expectedRoot is empty', () => {
    const leaves = fakeLeaves(2);
    const tree = buildMerkleTree(leaves);
    expect(verifyMerkleProof(leaves[0].payload, tree.proofs[leaves[0].id], '')).toBe(
      false,
    );
  });

  it('rejects when proof has wrong position direction', () => {
    const leaves = fakeLeaves(4);
    const tree = buildMerkleTree(leaves);
    const proof = tree.proofs[leaves[1].id].map((sib) => ({
      ...sib,
      position: sib.position === 'left' ? ('right' as const) : ('left' as const),
    }));
    expect(verifyMerkleProof(leaves[1].payload, proof, tree.root)).toBe(false);
  });
});

describe('domain separation', () => {
  it('hashes leaves with 0x00 prefix and nodes with 0x01 prefix', () => {
    // If domain separation broke, a (left || right) inner-node hash
    // could collide with a leaf hash of a payload that happens to look
    // like two concatenated hashes. We can't test the absence of
    // collisions directly, but we can verify the prefix bytes by
    // hashing a single byte and checking the result.
    const directLeaf = hashLeaf(Buffer.from([0xff]));
    const sansPrefix = createHash('sha256').update(Buffer.from([0xff])).digest('hex');
    expect(directLeaf).not.toEqual(sansPrefix);
    const withLeafPrefix = createHash('sha256')
      .update(Buffer.concat([Buffer.from([0x00]), Buffer.from([0xff])]))
      .digest('hex');
    expect(directLeaf).toEqual(withLeafPrefix);
  });
});
