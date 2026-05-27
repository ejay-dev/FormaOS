#!/usr/bin/env node

// Audit 2026-05-27 — rotate TOTP_ENCRYPTION_KEY.
//
// MEDIUM-difficulty procedure per docs/operations/secret-rotation-runbook.md:
// every user_security.two_factor_secret with the `enc:v1:` prefix is
// AES-256-GCM-encrypted with the current key. Re-encrypts in-place
// with the new key.
//
// Users do NOT need to re-enrol — their authenticator app keeps
// producing the same OTP codes; only the at-rest encryption changes.
//
// Required env:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OLD_TOTP_ENCRYPTION_KEY (64-char hex string)
//   TOTP_ENCRYPTION_KEY     (64-char hex string — the NEW key)
//
// CLI:
//   node scripts/rotate-totp-encryption-key.mjs            # dry run
//   node scripts/rotate-totp-encryption-key.mjs --confirm  # execute

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import crypto from 'node:crypto';
import { argv, exit } from 'node:process';

config({ path: '.env.local' });

function clean(v) { return (v || '').trim().replace(/^['"]|['"]$/g, ''); }

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
const oldHex = clean(process.env.OLD_TOTP_ENCRYPTION_KEY);
const newHex = clean(process.env.TOTP_ENCRYPTION_KEY);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.');
  exit(2);
}
if (!oldHex || !newHex) {
  console.error('Need OLD_TOTP_ENCRYPTION_KEY + TOTP_ENCRYPTION_KEY (each 64-char hex).');
  exit(2);
}
if (oldHex.length !== 64 || newHex.length !== 64) {
  console.error('Both keys must be 64-char hex strings.');
  exit(2);
}
if (oldHex === newHex) {
  console.error('OLD and NEW keys identical — nothing to rotate.');
  exit(2);
}

const oldKey = Buffer.from(oldHex, 'hex');
const newKey = Buffer.from(newHex, 'hex');
const ENC_PREFIX = 'enc:v1:';

const confirm = argv.includes('--confirm');
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

function decryptTotp(stored, key) {
  if (!stored.startsWith(ENC_PREFIX)) throw new Error('legacy plaintext or unrecognised format');
  const parts = stored.slice(ENC_PREFIX.length).split(':');
  if (parts.length !== 3) throw new Error('malformed encrypted TOTP secret');
  const [ivHex, tagHex, ctHex] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return (
    decipher.update(Buffer.from(ctHex, 'hex'), undefined, 'utf8') + decipher.final('utf8')
  );
}

function encryptTotp(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENC_PREFIX + [iv.toString('hex'), tag.toString('hex'), ct.toString('hex')].join(':');
}

console.log('=== TOTP_ENCRYPTION_KEY rotation ===');
console.log(`mode: ${confirm ? 'EXECUTE' : 'DRY RUN (pass --confirm to apply)'}`);

const { data: rows, error } = await admin
  .from('user_security')
  .select('user_id, two_factor_secret')
  .not('two_factor_secret', 'is', null);
if (error) {
  console.error(`read failed: ${error.message}`);
  exit(1);
}
const encryptedRows = (rows ?? []).filter((r) => typeof r.two_factor_secret === 'string' && r.two_factor_secret.startsWith(ENC_PREFIX));
const legacyPlaintext = (rows ?? []).length - encryptedRows.length;
console.log(`rows with encrypted secret: ${encryptedRows.length}`);
if (legacyPlaintext > 0) {
  console.log(`rows with legacy plaintext secret (skipped — will be encrypted on next login): ${legacyPlaintext}`);
}

if (encryptedRows.length === 0) {
  console.log('Nothing to rotate.');
  exit(0);
}

if (!confirm) {
  console.log('Dry run only — pass --confirm to actually rotate.');
  exit(0);
}

let rotated = 0;
let failed = 0;
const failures = [];

for (const row of encryptedRows) {
  try {
    const plaintext = decryptTotp(row.two_factor_secret, oldKey);
    if (typeof plaintext !== 'string' || plaintext.length === 0) {
      throw new Error('decrypted to empty string');
    }
    const reEncrypted = encryptTotp(plaintext, newKey);
    const { error: upErr } = await admin
      .from('user_security')
      .update({ two_factor_secret: reEncrypted })
      .eq('user_id', row.user_id);
    if (upErr) throw new Error(`update: ${upErr.message}`);
    rotated += 1;
  } catch (err) {
    failed += 1;
    failures.push({ userId: row.user_id, reason: err instanceof Error ? err.message : String(err) });
  }
}

console.log('');
console.log(`Rotation complete. rotated=${rotated} failed=${failed}`);
for (const f of failures) console.log(`  FAIL ${f.userId}: ${f.reason}`);

if (failed > 0) {
  console.error('\nSome rows failed. DO NOT update TOTP_ENCRYPTION_KEY in Vercel until all rows resolved (failed users will be locked out of MFA otherwise).');
  exit(1);
}

const prevFpr = crypto.createHash('sha256').update(oldHex).digest('hex').slice(0, 12);
const newFpr = crypto.createHash('sha256').update(newHex).digest('hex').slice(0, 12);
const { data: ledgerId, error: ledgerErr } = await admin.rpc('record_secret_rotation', {
  p_secret_name: 'TOTP_ENCRYPTION_KEY',
  p_reason: `Re-encrypted ${rotated} TOTP secrets with new key.`,
  p_rotated_by: process.env.USER || 'unknown',
  p_previous_fingerprint: prevFpr,
  p_new_fingerprint: newFpr,
  p_notes: `${rotated} user_security.two_factor_secret rows re-encrypted in-place. Plaintext OTPs unchanged; users don't need to re-enrol.`,
  p_ticket_url: null,
});
if (ledgerErr) {
  console.warn(`Ledger record failed: ${ledgerErr.message}`);
} else {
  console.log(`Ledger row recorded: ${ledgerId}`);
}

console.log('');
console.log('NEXT: update Vercel env (TOTP_ENCRYPTION_KEY → new value) and redeploy.');
exit(0);
