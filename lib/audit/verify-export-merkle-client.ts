/**
 * Audit 2026-05-27 (Tier 2.B) — client-side port of
 * scripts/verify-export-merkle.mjs.
 *
 * Pure browser-friendly verifier for FormaOS audit-export bundles.
 * Uses globalThis.crypto.subtle so it runs both in the browser (on the
 * public /verify page) and in any worker context. Zero Node-only APIs.
 *
 * Domain separation matches the script byte-for-byte (RFC 6962):
 *   * leaf hash = SHA256(0x00 || canonical-utf8(entry))
 *   * node hash = SHA256(0x01 || leftHashBytes || rightHashBytes)
 *
 * Returns a structured VerificationResult so the UI can render
 * per-step pass/fail rows instead of a single boolean.
 */

export type MerkleBundle = {
  manifest?: { org_id?: string; generated_at?: string };
  merkle?: {
    algorithm?: string;
    tree_size?: number;
    root?: string;
    empty_tree?: boolean;
    proofs?: Record<string, Array<{ position: 'left' | 'right'; hash: string }>>;
  };
  entries?: Array<{
    id: string;
    leaf_hash?: string;
    user_id?: string | null;
    action?: string;
    resource_type?: string;
    resource_id?: string | null;
    details?: unknown;
    created_at?: string;
    prev_hash?: string;
  }>;
};

export type VerificationStep = {
  label: string;
  status: 'pass' | 'fail';
  detail?: string;
};

export type MerkleVerificationResult = {
  ok: boolean;
  steps: VerificationStep[];
  summary: {
    root: string | null;
    tree_size: number | null;
    generated_at: string | null;
  };
};

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.toLowerCase();
  if (!/^[0-9a-f]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error('invalid hex string');
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = '';
  for (let i = 0; i < view.length; i++) {
    out += view[i].toString(16).padStart(2, '0');
  }
  return out;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

async function sha256Hex(input: Uint8Array): Promise<string> {
  // `.buffer` widens to ArrayBufferLike on newer TS lib targets, but the
  // runtime contract is unchanged. Cast keeps the verifier portable across
  // node (jest) and the browser without conditional imports.
  const digest = await getSubtle().digest('SHA-256', input.buffer as ArrayBuffer);
  return bytesToHex(digest);
}

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      'SubtleCrypto unavailable — this verifier requires a secure context (https or localhost).',
    );
  }
  return subtle;
}

async function hashLeaf(canonicalUtf8: string): Promise<string> {
  const data = new TextEncoder().encode(canonicalUtf8);
  return sha256Hex(concatBytes(new Uint8Array([0x00]), data));
}

async function hashNode(leftHex: string, rightHex: string): Promise<string> {
  return sha256Hex(
    concatBytes(new Uint8Array([0x01]), hexToBytes(leftHex), hexToBytes(rightHex)),
  );
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0');
}

/**
 * Mirror scripts/verify-export-merkle.mjs formatCreatedAtV2 byte-for-byte.
 * Any drift here would break canonicalisation and cascade into every
 * leaf hash. Keep in sync via the shared test fixture.
 */
function formatCreatedAtV2(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return (
    `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}` +
    `.${pad(d.getUTCMilliseconds(), 3)}Z`
  );
}

function canonicalize(entry: NonNullable<MerkleBundle['entries']>[number], orgId: string): string {
  return JSON.stringify({
    id: entry.id,
    org_id: orgId,
    user_id: entry.user_id ?? null,
    action: entry.action,
    resource_type: entry.resource_type,
    resource_id: entry.resource_id ?? null,
    details: entry.details ?? {},
    created_at: formatCreatedAtV2(entry.created_at ?? ''),
    prev_hash: entry.prev_hash || '',
  });
}

async function verifyProof(
  leafHashHex: string,
  proof: Array<{ position: 'left' | 'right'; hash: string }>,
  expectedRoot: string,
): Promise<boolean> {
  let current = leafHashHex;
  for (const sib of proof) {
    if (sib.position === 'right') {
      current = await hashNode(current, sib.hash);
    } else {
      current = await hashNode(sib.hash, current);
    }
  }
  return current === expectedRoot.toLowerCase();
}

export async function verifyMerkleBundle(
  bundle: MerkleBundle,
): Promise<MerkleVerificationResult> {
  const steps: VerificationStep[] = [];
  const summary = {
    root: bundle.merkle?.root ?? null,
    tree_size: bundle.merkle?.tree_size ?? null,
    generated_at: bundle.manifest?.generated_at ?? null,
  };

  if (!bundle.manifest || !bundle.merkle || !bundle.entries) {
    steps.push({
      label: 'Bundle shape',
      status: 'fail',
      detail: 'manifest / merkle / entries fields missing.',
    });
    return { ok: false, steps, summary };
  }
  steps.push({ label: 'Bundle shape', status: 'pass' });

  if (bundle.merkle.algorithm && bundle.merkle.algorithm !== 'sha256') {
    steps.push({
      label: 'Algorithm',
      status: 'fail',
      detail: `unexpected algorithm "${bundle.merkle.algorithm}" — verifier only supports sha256.`,
    });
    return { ok: false, steps, summary };
  }
  steps.push({ label: 'Algorithm (sha256)', status: 'pass' });

  if (bundle.merkle.empty_tree) {
    steps.push({
      label: 'Empty tree',
      status: 'pass',
      detail: 'tree is empty — nothing to verify.',
    });
    return { ok: true, steps, summary };
  }

  const orgId = bundle.manifest.org_id;
  if (!orgId) {
    steps.push({
      label: 'Manifest',
      status: 'fail',
      detail: 'manifest.org_id missing — canonicalisation impossible.',
    });
    return { ok: false, steps, summary };
  }

  if (bundle.merkle.tree_size !== bundle.entries.length) {
    steps.push({
      label: 'tree_size matches entries.length',
      status: 'fail',
      detail: `tree_size ${bundle.merkle.tree_size} ≠ entries ${bundle.entries.length}`,
    });
    return { ok: false, steps, summary };
  }
  steps.push({ label: `tree_size = ${bundle.entries.length}`, status: 'pass' });

  // Step 1: recompute leaf hashes
  let tamperedLeaves = 0;
  for (const entry of bundle.entries) {
    const recomputed = await hashLeaf(canonicalize(entry, orgId));
    if (recomputed !== entry.leaf_hash) tamperedLeaves += 1;
  }
  if (tamperedLeaves > 0) {
    steps.push({
      label: 'Leaf hashes',
      status: 'fail',
      detail: `${tamperedLeaves}/${bundle.entries.length} leaf hashes did not match their entry contents — bundle was tampered or canonicalisation drifted.`,
    });
    return { ok: false, steps, summary };
  }
  steps.push({
    label: `${bundle.entries.length} leaf hashes`,
    status: 'pass',
    detail: 'every leaf hash recomputed from entry contents.',
  });

  // Step 2: verify each inclusion proof
  let badProofs = 0;
  let missingProofs = 0;
  for (const entry of bundle.entries) {
    const proof = bundle.merkle.proofs?.[entry.id];
    if (!proof) {
      missingProofs += 1;
      continue;
    }
    const ok = await verifyProof(entry.leaf_hash ?? '', proof, bundle.merkle.root ?? '');
    if (!ok) badProofs += 1;
  }

  if (missingProofs > 0 || badProofs > 0) {
    steps.push({
      label: 'Inclusion proofs',
      status: 'fail',
      detail: `${missingProofs} missing + ${badProofs} did not reconstruct the published root.`,
    });
    return { ok: false, steps, summary };
  }
  steps.push({
    label: `${bundle.entries.length} inclusion proofs`,
    status: 'pass',
    detail: 'every proof reconstructed the published root.',
  });

  return { ok: true, steps, summary };
}
