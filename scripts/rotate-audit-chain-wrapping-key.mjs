#!/usr/bin/env node

// Audit 2026-05-27 — rotate AUDIT_CHAIN_HMAC_KEY (wrapping key for the
// per-org audit-chain HMAC secrets).
//
// HIGH-difficulty procedure per docs/operations/secret-rotation-runbook.md:
// every row in public.audit_chain_secrets has an AES-256-GCM envelope
// wrapping a 32-byte raw HMAC key; this script decrypts each envelope
// with the OLD wrapping key and re-encrypts with the NEW wrapping key,
// in-place. The audit chain itself is untouched — entry_hash and
// entry_mac on existing rows stay valid because the raw HMAC keys
// themselves don't change.
//
// Required env:
//   NEXT_PUBLIC_SUPABASE_URL      — prod URL
//   SUPABASE_SERVICE_ROLE_KEY     — prod service-role key
//   OLD_AUDIT_CHAIN_HMAC_KEY      — the current wrapping key
//   AUDIT_CHAIN_HMAC_KEY          — the NEW wrapping key
//
// CLI:
//   # Dry run first (default — shows row count, no writes):
//   node scripts/rotate-audit-chain-wrapping-key.mjs
//
//   # Then for real:
//   node scripts/rotate-audit-chain-wrapping-key.mjs --confirm
//
// Auto-records a row in public.secret_rotations on success.

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import crypto from 'node:crypto';
import { argv, exit } from 'node:process';

config({ path: '.env.local' });

function clean(v) {
  return (v || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);
const oldEnv = clean(process.env.OLD_AUDIT_CHAIN_HMAC_KEY);
const newEnv = clean(process.env.AUDIT_CHAIN_HMAC_KEY);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.');
  exit(2);
}
if (!oldEnv || !newEnv) {
  console.error('Need OLD_AUDIT_CHAIN_HMAC_KEY (current wrapping key) + AUDIT_CHAIN_HMAC_KEY (new wrapping key).');
  exit(2);
}
if (oldEnv === newEnv) {
  console.error('OLD_AUDIT_CHAIN_HMAC_KEY and AUDIT_CHAIN_HMAC_KEY are identical — nothing to rotate.');
  exit(2);
}

const oldWrappingKey = crypto.createHash('sha256').update(oldEnv).digest();
const newWrappingKey = crypto.createHash('sha256').update(newEnv).digest();

const confirm = argv.includes('--confirm');
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

function decryptEnvelope(envelopeJson, key) {
  const env = JSON.parse(envelopeJson);
  if (env.__encrypted !== true || env.alg !== 'aes-256-gcm') {
    throw new Error('envelope shape unrecognised');
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(env.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(env.tag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(env.data, 'base64')),
    decipher.final(),
  ]);
}

function encryptEnvelope(rawKey, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(rawKey), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    __encrypted: true,
    alg: 'aes-256-gcm',
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
  };
}

console.log('=== AUDIT_CHAIN_HMAC_KEY rotation ===');
console.log(`mode: ${confirm ? 'EXECUTE' : 'DRY RUN (pass --confirm to apply)'}`);

// Paginate: an unbounded select is silently truncated at PostgREST's row cap,
// and any row left un-rotated becomes permanently unwrappable once the
// operator swaps AUDIT_CHAIN_HMAC_KEY. Ordered by the primary key (org_id) so
// page boundaries are stable.
const PAGE_SIZE = 500;

const { count: expectedTotal, error: countErr } = await admin
  .from('audit_chain_secrets')
  .select('org_id', { count: 'exact', head: true });
if (countErr) {
  console.error(`count failed: ${countErr.message}`);
  exit(1);
}

const rows = [];
for (let offset = 0; ; ) {
  const { data: page, error } = await admin
    .from('audit_chain_secrets')
    .select('org_id, encrypted_key, algorithm')
    .order('org_id', { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);
  if (error) {
    console.error(`read failed: ${error.message}`);
    exit(1);
  }
  if (!page?.length) break;
  rows.push(...page);
  // Advance by the rows actually returned, not by PAGE_SIZE: the server may
  // cap a page below the requested window.
  offset += page.length;
}
const total = rows.length;

if (typeof expectedTotal === 'number' && total !== expectedTotal) {
  console.error(`read incomplete: fetched ${total} of ${expectedTotal} audit_chain_secrets rows. Refusing to rotate a partial set.`);
  exit(1);
}
console.log(`rows to rotate: ${total}`);

if (total === 0) {
  console.log('Nothing to do.');
  exit(0);
}

if (!confirm) {
  console.log('Dry run only — pass --confirm to actually rotate.');
  exit(0);
}

let rotated = 0;
let failed = 0;
const failures = [];

for (const row of rows) {
  try {
    const rawKey = decryptEnvelope(row.encrypted_key, oldWrappingKey);
    if (rawKey.length !== 32) {
      throw new Error(`decrypted key length ${rawKey.length} != 32`);
    }
    const newEnvelope = encryptEnvelope(rawKey, newWrappingKey);
    const { error: upErr } = await admin
      .from('audit_chain_secrets')
      .update({ encrypted_key: JSON.stringify(newEnvelope), rotated_at: new Date().toISOString() })
      .eq('org_id', row.org_id);
    if (upErr) throw new Error(`update: ${upErr.message}`);
    rotated += 1;
  } catch (err) {
    failed += 1;
    failures.push({ orgId: row.org_id, reason: err instanceof Error ? err.message : String(err) });
  }
}

console.log('');
console.log(`Rotation complete. rotated=${rotated} failed=${failed}`);
for (const f of failures) console.log(`  FAIL ${f.orgId}: ${f.reason}`);

if (failed > 0) {
  console.error('\nSome rows failed to rotate. DO NOT update AUDIT_CHAIN_HMAC_KEY in Vercel until all rows are resolved.');
  exit(1);
}

// Record in secret_rotations ledger
const prevFpr = crypto.createHash('sha256').update(oldEnv).digest('hex').slice(0, 12);
const newFpr = crypto.createHash('sha256').update(newEnv).digest('hex').slice(0, 12);
const { data: ledgerId, error: ledgerErr } = await admin.rpc('record_secret_rotation', {
  p_secret_name: 'AUDIT_CHAIN_HMAC_KEY',
  p_reason: `Rotated wrapping key for ${rotated} audit_chain_secrets rows.`,
  p_rotated_by: process.env.USER || 'unknown',
  p_previous_fingerprint: prevFpr,
  p_new_fingerprint: newFpr,
  p_notes: `Re-wrapped ${rotated} rows in-place. audit_log chain entry_hash + entry_mac unaffected.`,
  p_ticket_url: null,
});
if (ledgerErr) {
  console.warn(`Ledger record failed: ${ledgerErr.message} — record manually with scripts/record-secret-rotation.mjs.`);
} else {
  console.log(`Ledger row recorded: ${ledgerId}`);
}

console.log('');
console.log('NEXT: update Vercel env (AUDIT_CHAIN_HMAC_KEY → new value) and redeploy.');
exit(0);
