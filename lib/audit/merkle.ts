import { createHash } from 'crypto';

/**
 * R4 (Audit 2026-05-27) — Merkle inclusion proofs over audit-log export
 * bundles.
 *
 * Why: the existing audit-log export ships every row of the chain so a
 * verifier can recompute hashes. That's fine for internal ops but bad
 * for customer-facing verification — a customer auditor shouldn't need
 * raw access to every audit event to verify "did event X really occur
 * at time T?". Merkle inclusion proofs let an auditor verify a single
 * event without seeing the others: leaf hash + sibling path + tree root.
 *
 * Algorithm: RFC 6962-style (Certificate Transparency) Merkle hashing.
 *   - Leaf node:  SHA-256(0x00 || leaf_data)
 *   - Inner node: SHA-256(0x01 || left || right)
 * Domain separation between leaves and inner nodes prevents second-pre-
 * image attacks that conflate them.
 *
 * For odd-count layers we hash the orphan leaf with itself (instead of
 * promoting unchanged) so the tree shape is always balanced — simpler
 * proofs at the cost of one extra hash per odd layer. The siblings in
 * a proof include a `position` flag so the verifier knows whether to
 * concat (sibling, computed) or (computed, sibling).
 *
 * Stable across runtimes: the same canonical-JSON payload that feeds
 * the v2/v3-hmac hash chain feeds the Merkle leaf, so a customer can
 * verify inclusion using only the leaf payload + proof + root, without
 * the per-org HMAC key.
 */

export type MerkleSibling = {
  hash: string; // lowercase hex
  position: 'left' | 'right';
};

export type MerkleProof = MerkleSibling[];

export type MerkleTree = {
  algorithm: 'sha256';
  treeSize: number;
  root: string; // lowercase hex
  leafHashes: string[]; // length === treeSize
  proofs: Record<string, MerkleProof>; // keyed by leaf_id
  emptyTree: boolean;
};

const LEAF_PREFIX = Buffer.from([0x00]);
const NODE_PREFIX = Buffer.from([0x01]);

function sha256Hex(input: Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hashLeaf(payload: string | Buffer): string {
  const data = typeof payload === 'string' ? Buffer.from(payload, 'utf8') : payload;
  return sha256Hex(Buffer.concat([LEAF_PREFIX, data]));
}

function hashNode(leftHex: string, rightHex: string): string {
  return sha256Hex(
    Buffer.concat([NODE_PREFIX, Buffer.from(leftHex, 'hex'), Buffer.from(rightHex, 'hex')]),
  );
}

/**
 * Build the tree + proofs from leaves. Each leaf is identified by a
 * stable id (event_id in the export) and a canonical payload. Leaves
 * MUST be ordered deterministically (by sequence_number for audit logs).
 * The same input always produces the same root.
 *
 * Empty input returns an empty tree marker; verifiers treat `emptyTree`
 * as the "nothing to prove" case.
 */
export function buildMerkleTree(
  leaves: Array<{ id: string; payload: string | Buffer }>,
): MerkleTree {
  if (leaves.length === 0) {
    return {
      algorithm: 'sha256',
      treeSize: 0,
      root: '',
      leafHashes: [],
      proofs: {},
      emptyTree: true,
    };
  }

  const leafHashes = leaves.map((leaf) => hashLeaf(leaf.payload));

  // Build layers bottom-up. Each layer's entries are hashed in pairs.
  // Odd elements are paired with themselves so the tree depth is
  // deterministic and the proof shape is uniform.
  const layers: string[][] = [leafHashes];
  while (layers[layers.length - 1].length > 1) {
    const prev = layers[layers.length - 1];
    const next: string[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i];
      const right = i + 1 < prev.length ? prev[i + 1] : prev[i]; // duplicate-self for odd
      next.push(hashNode(left, right));
    }
    layers.push(next);
  }

  const root = layers[layers.length - 1][0];

  // Generate proofs for every leaf — small enough to be cheap (log n
  // siblings per leaf). For large exports the consumer can re-fetch
  // proofs on demand using buildProof(layers, index).
  const proofs: Record<string, MerkleProof> = {};
  for (let i = 0; i < leaves.length; i++) {
    proofs[leaves[i].id] = buildProof(layers, i);
  }

  return {
    algorithm: 'sha256',
    treeSize: leaves.length,
    root,
    leafHashes,
    proofs,
    emptyTree: false,
  };
}

/**
 * Build a proof for the leaf at index `leafIndex` against the
 * already-computed layers. Returns the sibling chain from leaf up to
 * (but excluding) the root, each annotated with its position so the
 * verifier knows the concat order.
 */
export function buildProof(layers: string[][], leafIndex: number): MerkleProof {
  const proof: MerkleProof = [];
  let idx = leafIndex;
  for (let layer = 0; layer < layers.length - 1; layer++) {
    const current = layers[layer];
    const isRightSibling = idx % 2 === 0; // current node is left → sibling is right
    const siblingIdx = isRightSibling ? idx + 1 : idx - 1;
    // For odd layers, the orphan was duplicated with itself — sibling
    // is the node itself (its own hash). The hashNode call still works
    // because we hashed (x, x) when building that layer.
    const siblingHash =
      siblingIdx < current.length ? current[siblingIdx] : current[idx];
    proof.push({
      hash: siblingHash,
      position: isRightSibling ? 'right' : 'left',
    });
    idx = Math.floor(idx / 2);
  }
  return proof;
}

/**
 * Verify a leaf's inclusion in the tree given:
 *  - leafPayload : the canonical payload bytes (matches buildMerkleTree input)
 *  - proof       : the sibling chain returned by buildProof
 *  - expectedRoot: the published Merkle root from the export manifest
 *
 * Returns true only when the chain hashes up to exactly expectedRoot.
 * No key required — pure SHA-256, byte-identical across runtimes.
 */
export function verifyMerkleProof(
  leafPayload: string | Buffer,
  proof: MerkleProof,
  expectedRoot: string,
): boolean {
  if (!expectedRoot) return false;
  let current = hashLeaf(leafPayload);
  for (const sib of proof) {
    if (sib.position === 'right') {
      current = hashNode(current, sib.hash);
    } else {
      current = hashNode(sib.hash, current);
    }
  }
  return current === expectedRoot.toLowerCase();
}
