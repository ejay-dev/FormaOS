#!/usr/bin/env node

// R4 (Audit 2026-05-27) — standalone Merkle inclusion verifier for
// FormaOS audit-log JSON export bundles. Intended for external
// auditors: zero dependencies beyond Node ≥ 18, no DB access required,
// can be shipped to a customer alongside the export.
//
// Usage:
//
//   # Verify the published Merkle root by recomputing it from the
//   # included leaf hashes (catches a tampered manifest):
//   node verify-export-merkle.mjs ./audit-log-2026-05-27.json
//
//   # Verify inclusion of one specific entry by its id (you receive
//   # the leaf payload separately or extract it from the bundle):
//   node verify-export-merkle.mjs ./audit-log-2026-05-27.json --entry <event_id>
//
// Exit code 0 on success, non-zero on any mismatch.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { argv, exit } from 'node:process';

const LEAF_PREFIX = Buffer.from([0x00]);
const NODE_PREFIX = Buffer.from([0x01]);

function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex');
}

function hashLeaf(canonicalUtf8) {
  return sha256Hex(Buffer.concat([LEAF_PREFIX, Buffer.from(canonicalUtf8, 'utf8')]));
}

function hashNode(leftHex, rightHex) {
  return sha256Hex(
    Buffer.concat([NODE_PREFIX, Buffer.from(leftHex, 'hex'), Buffer.from(rightHex, 'hex')]),
  );
}

function canonicalize(entry, orgId) {
  return JSON.stringify({
    id: entry.id,
    org_id: orgId,
    user_id: entry.user_id ?? null,
    action: entry.action,
    resource_type: entry.resource_type,
    resource_id: entry.resource_id ?? null,
    details: entry.details ?? {},
    created_at: formatCreatedAtV2(entry.created_at),
    prev_hash: entry.prev_hash || '',
  });
}

function formatCreatedAtV2(input) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}Z`;
}

function verifyProof(leafHashHex, proof, expectedRoot) {
  let current = leafHashHex;
  for (const sib of proof) {
    if (sib.position === 'right') {
      current = hashNode(current, sib.hash);
    } else {
      current = hashNode(sib.hash, current);
    }
  }
  return current === expectedRoot.toLowerCase();
}

function fail(msg) {
  console.error(`FAIL ${msg}`);
  exit(1);
}

function pass(msg) {
  console.log(`PASS ${msg}`);
}

const args = argv.slice(2);
if (args.length === 0) {
  console.error('usage: verify-export-merkle.mjs <bundle.json> [--entry <event_id>]');
  exit(2);
}

const bundlePath = args[0];
const entryFlag = args.indexOf('--entry');
const targetEntryId = entryFlag !== -1 ? args[entryFlag + 1] : null;

const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));

if (!bundle.manifest || !bundle.merkle || !bundle.entries) {
  fail('bundle missing manifest/merkle/entries — wrong format?');
}

if (bundle.merkle.algorithm !== 'sha256') {
  fail(`unexpected algorithm ${bundle.merkle.algorithm}`);
}

if (bundle.merkle.empty_tree) {
  pass('empty tree (no entries) — nothing to verify');
  exit(0);
}

const orgId = bundle.manifest.org_id;
if (!orgId) fail('manifest.org_id missing — cannot reconstruct canonical payload');

if (bundle.merkle.tree_size !== bundle.entries.length) {
  fail(`tree_size (${bundle.merkle.tree_size}) != entries.length (${bundle.entries.length})`);
}

// 1. Recompute every leaf hash from the entries and check they match
//    the in-bundle leaf_hash values. Catches a tampered entry.
let allLeavesValid = true;
for (const entry of bundle.entries) {
  const recomputed = hashLeaf(canonicalize(entry, orgId));
  if (recomputed !== entry.leaf_hash) {
    console.error(
      `  entry ${entry.id}: leaf_hash mismatch — entry tampered or canonicalisation drifted`,
    );
    allLeavesValid = false;
  }
}
if (!allLeavesValid) fail('one or more leaf hashes did not match the entry contents');
pass(`${bundle.entries.length} leaves recomputed and matched in-bundle leaf_hash`);

// 2. Verify each entry's inclusion proof leads to the bundle root.
//    Per-entry verification catches a tampered proof.
let allProofsValid = true;
for (const entry of bundle.entries) {
  const proof = bundle.merkle.proofs[entry.id];
  if (!proof) {
    console.error(`  entry ${entry.id}: no proof in bundle`);
    allProofsValid = false;
    continue;
  }
  const ok = verifyProof(entry.leaf_hash, proof, bundle.merkle.root);
  if (!ok) {
    console.error(`  entry ${entry.id}: proof did not reconstruct root`);
    allProofsValid = false;
  }
}
if (!allProofsValid) fail('one or more inclusion proofs did not reconstruct the root');
pass(`${bundle.entries.length} inclusion proofs reconstructed the published root`);

// 3. If --entry was given, also report the named entry's status explicitly.
if (targetEntryId) {
  const entry = bundle.entries.find((e) => e.id === targetEntryId);
  if (!entry) fail(`--entry ${targetEntryId}: id not present in bundle.entries`);
  const proof = bundle.merkle.proofs[targetEntryId];
  const recomputed = hashLeaf(canonicalize(entry, orgId));
  const proofOk = verifyProof(recomputed, proof, bundle.merkle.root);
  if (!proofOk) fail(`--entry ${targetEntryId}: targeted proof verification failed`);
  pass(`--entry ${targetEntryId}: inclusion proof verified`);
}

console.log('');
console.log(`Merkle root: ${bundle.merkle.root}`);
console.log(`Tree size:   ${bundle.merkle.tree_size}`);
console.log(`Generated:   ${bundle.manifest.generated_at}`);
console.log(`✓ All verifications passed.`);
exit(0);
