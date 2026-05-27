#!/usr/bin/env node

// Audit 2026-05-27 — rotate INTEGRATION_CONFIG_KEY.
//
// MEDIUM-difficulty procedure per docs/operations/secret-rotation-runbook.md:
// every org_integrations.config encrypted with the current key has the
// `{ __encrypted: true, alg: 'aes-256-gcm', ... }` envelope shape from
// lib/integrations/config-crypto.ts. Re-encrypts in-place with the
// new key.
//
// Required env:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OLD_INTEGRATION_CONFIG_KEY  — current key (or current
//                                  INTEGRATION_CONFIG_SECRET if you're
//                                  still on the legacy alias)
//   INTEGRATION_CONFIG_KEY      — new key
//
// CLI:
//   node scripts/rotate-integration-config-key.mjs            # dry run
//   node scripts/rotate-integration-config-key.mjs --confirm  # execute

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import crypto from 'node:crypto';
import { argv, exit } from 'node:process';

config({ path: '.env.local' });

function clean(v) { return (v || '').trim().replace(/^['"]|['"]$/g, ''); }

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);
const oldEnv = clean(process.env.OLD_INTEGRATION_CONFIG_KEY || process.env.OLD_INTEGRATION_CONFIG_SECRET);
const newEnv = clean(process.env.INTEGRATION_CONFIG_KEY);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.');
  exit(2);
}
if (!oldEnv || !newEnv) {
  console.error('Need OLD_INTEGRATION_CONFIG_KEY (current) + INTEGRATION_CONFIG_KEY (new).');
  exit(2);
}
if (oldEnv === newEnv) {
  console.error('OLD and NEW keys identical — nothing to rotate.');
  exit(2);
}

const oldKey = crypto.createHash('sha256').update(oldEnv).digest();
const newKey = crypto.createHash('sha256').update(newEnv).digest();

const confirm = argv.includes('--confirm');
const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

function isEncryptedEnvelope(value) {
  return (
    value &&
    typeof value === 'object' &&
    'alg' in value &&
    value.alg === 'aes-256-gcm' &&
    value.__encrypted === true
  );
}

function decryptEnvelope(env, key) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(env.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(env.tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(env.data, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  return JSON.parse(plaintext);
}

function encryptEnvelope(value, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(Buffer.from(JSON.stringify(value), 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    __encrypted: true,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ct.toString('base64'),
  };
}

console.log('=== INTEGRATION_CONFIG_KEY rotation ===');
console.log(`mode: ${confirm ? 'EXECUTE' : 'DRY RUN (pass --confirm to apply)'}`);

const { data: rows, error } = await admin
  .from('org_integrations')
  .select('id, organization_id, config')
  .not('config', 'is', null);
if (error) {
  console.error(`read failed: ${error.message}`);
  exit(1);
}
const encryptedRows = (rows ?? []).filter((r) => isEncryptedEnvelope(r.config));
const plaintextSkipped = (rows ?? []).length - encryptedRows.length;
console.log(`rows with encrypted config: ${encryptedRows.length}`);
if (plaintextSkipped > 0) {
  console.log(`rows with plaintext config (skipped — re-encrypted on next save): ${plaintextSkipped}`);
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
    const plaintext = decryptEnvelope(row.config, oldKey);
    const reEncrypted = encryptEnvelope(plaintext, newKey);
    const { error: upErr } = await admin
      .from('org_integrations')
      .update({ config: reEncrypted, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    if (upErr) throw new Error(`update: ${upErr.message}`);
    rotated += 1;
  } catch (err) {
    failed += 1;
    failures.push({ id: row.id, orgId: row.organization_id, reason: err instanceof Error ? err.message : String(err) });
  }
}

console.log('');
console.log(`Rotation complete. rotated=${rotated} failed=${failed}`);
for (const f of failures) console.log(`  FAIL ${f.id} (org ${f.orgId}): ${f.reason}`);

if (failed > 0) {
  console.error('\nSome rows failed. DO NOT update INTEGRATION_CONFIG_KEY in Vercel until all rows resolved.');
  exit(1);
}

const prevFpr = crypto.createHash('sha256').update(oldEnv).digest('hex').slice(0, 12);
const newFpr = crypto.createHash('sha256').update(newEnv).digest('hex').slice(0, 12);
const { data: ledgerId, error: ledgerErr } = await admin.rpc('record_secret_rotation', {
  p_secret_name: 'INTEGRATION_CONFIG_KEY',
  p_reason: `Re-encrypted ${rotated} integration configs with new key.`,
  p_rotated_by: process.env.USER || 'unknown',
  p_previous_fingerprint: prevFpr,
  p_new_fingerprint: newFpr,
  p_notes: `${rotated} org_integrations.config rows re-encrypted in-place.`,
  p_ticket_url: null,
});
if (ledgerErr) {
  console.warn(`Ledger record failed: ${ledgerErr.message}`);
} else {
  console.log(`Ledger row recorded: ${ledgerId}`);
}

console.log('');
console.log('NEXT: update Vercel env (INTEGRATION_CONFIG_KEY → new value) and redeploy.');
exit(0);
