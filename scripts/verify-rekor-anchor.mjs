#!/usr/bin/env node

// R3/R4 follow-up (Audit 2026-05-27) — verify a FormaOS audit-chain
// anchor against Sigstore Rekor. Intended for external auditors:
// fetches the named Rekor entry, decodes the embedded public key +
// signature, re-verifies the signature over the claimed top-of-chain
// hash, and prints the chain of trust.
//
// Usage:
//   node verify-rekor-anchor.mjs <rekor_entry_uuid> <expected_top_hash>
//
// Example:
//   node verify-rekor-anchor.mjs 24296fb24b8ad77a... 8c6ae24fa604c7da...
//
// Exit 0 on verified, non-zero on any mismatch.

import { argv, exit } from 'node:process';
import { createVerify } from 'node:crypto';

const REKOR_API_BASE =
  process.env.AUDIT_CHAIN_ANCHOR_REKOR_URL?.trim() ||
  'https://rekor.sigstore.dev';

const args = argv.slice(2);
if (args.length !== 2) {
  console.error(
    'usage: verify-rekor-anchor.mjs <rekor_entry_uuid> <expected_top_hash>',
  );
  exit(2);
}
const [uuid, expectedTopHash] = args;
if (!/^[0-9a-f]{64}$/i.test(expectedTopHash)) {
  console.error('expected_top_hash must be a 64-char hex SHA-256');
  exit(2);
}

function fail(msg) {
  console.error(`FAIL ${msg}`);
  exit(1);
}

function pass(msg) {
  console.log(`PASS ${msg}`);
}

async function main() {
  const url = `${REKOR_API_BASE}/api/v1/log/entries/${encodeURIComponent(uuid)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    fail(`Rekor lookup failed: HTTP ${response.status}`);
  }
  const payload = await response.json();
  const entry = payload[uuid];
  if (!entry) fail(`Rekor returned no entry for uuid ${uuid}`);
  if (!entry.body) fail('Rekor entry missing body field');

  // The body is a base64-encoded canonical JSON of the hashedrekord spec.
  const body = JSON.parse(Buffer.from(entry.body, 'base64').toString('utf8'));
  if (body.kind !== 'hashedrekord') {
    fail(`Unexpected Rekor entry kind: ${body.kind}`);
  }
  const spec = body.spec;
  const recordedHash = spec?.data?.hash?.value;
  if (recordedHash !== expectedTopHash) {
    fail(
      `Hash mismatch: Rekor recorded ${recordedHash}, expected ${expectedTopHash}`,
    );
  }
  pass(`Rekor entry's recorded hash matches expected: ${recordedHash}`);

  const signatureBase64 = spec.signature.content;
  const publicKeyPem = Buffer.from(spec.signature.publicKey.content, 'base64').toString('utf8');

  // Re-verify the signature using the embedded public key.
  const verifier = createVerify('SHA256');
  verifier.update(expectedTopHash, 'utf8');
  verifier.end();
  let ok;
  try {
    ok = verifier.verify(
      { key: publicKeyPem, dsaEncoding: 'der' },
      Buffer.from(signatureBase64, 'base64'),
    );
  } catch (err) {
    fail(`Signature verification threw: ${err?.message ?? err}`);
  }
  if (!ok) fail('Signature did NOT verify against the embedded public key');
  pass('Signature verified against the embedded public key');

  console.log('');
  console.log(`Rekor entry:    ${uuid}`);
  console.log(`Expected hash:  ${expectedTopHash}`);
  console.log(`Recorded at:    ${entry.integratedTime ? new Date(entry.integratedTime * 1000).toISOString() : 'unknown'}`);
  console.log(`Log index:      ${entry.logIndex ?? 'unknown'}`);
  console.log(`Log ID:         ${entry.logID ?? 'unknown'}`);
  console.log('');
  console.log('✓ Anchor verified — the top-of-chain hash was witnessed by Rekor and signed by the embedded key.');
  exit(0);
}

main().catch((err) => {
  fail(`unexpected: ${err?.message ?? err}`);
});
