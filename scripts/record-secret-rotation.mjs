#!/usr/bin/env node

// Audit 2026-05-27 — operator-facing CLI to record a platform-secret
// rotation event. Writes a row to public.secret_rotations (append-only
// ledger; RESTRICTIVE policies block UPDATE/DELETE).
//
// Usage:
//   node scripts/record-secret-rotation.mjs \
//     --secret AUDIT_CHAIN_HMAC_KEY \
//     --reason "Quarterly rotation 2026Q2" \
//     --rotated-by "ejaz@formaos.io" \
//     [--previous-fingerprint <hex>] \
//     [--new-fingerprint <hex>] \
//     [--ticket-url https://linear.app/...] \
//     [--notes "details"]
//
// Fingerprints: SHA-256 of the secret value, hex-truncated to 12 chars.
// Pass them in so the ledger can be cross-referenced to deployed env
// state without ever storing the secret itself. The script can also
// compute the fingerprint from a value piped in via --secret-value
// (kept on stdin, never on the command line, never logged).

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { createHash } from 'node:crypto';
import { argv, exit } from 'node:process';

config({ path: '.env.local' });

function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.');
  exit(1);
}

function parseArgs(args) {
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith('--')) continue;
    const key = args[i].slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : '';
    out[key] = value;
    if (value) i++;
  }
  return out;
}

const args = parseArgs(argv.slice(2));
const secret = args.secret;
const reason = args.reason;
const rotatedBy = args['rotated-by'] || process.env.USER || 'unknown';

if (!secret) {
  console.error('Missing --secret <name>');
  exit(2);
}
if (!reason || reason.trim().length < 8) {
  console.error('--reason must be at least 8 characters');
  exit(2);
}

function fingerprint(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 12);
}

const previousFingerprint = args['previous-fingerprint'] || null;
const newFingerprint = args['new-fingerprint'] || null;
const ticketUrl = args['ticket-url'] || null;
const notes = args.notes || null;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin.rpc('record_secret_rotation', {
  p_secret_name: secret,
  p_reason: reason,
  p_rotated_by: rotatedBy,
  p_previous_fingerprint: previousFingerprint,
  p_new_fingerprint: newFingerprint,
  p_notes: notes,
  p_ticket_url: ticketUrl,
});

if (error) {
  console.error(`record_secret_rotation failed: ${error.message}`);
  exit(1);
}

console.log(`✓ Recorded rotation for ${secret} (id=${data}).`);
console.log(`  reason:           ${reason}`);
console.log(`  rotated_by:       ${rotatedBy}`);
console.log(`  previous fpr:     ${previousFingerprint ?? '(none)'}`);
console.log(`  new fpr:          ${newFingerprint ?? '(none)'}`);
if (ticketUrl) console.log(`  ticket:           ${ticketUrl}`);
if (notes) console.log(`  notes:            ${notes}`);
exit(0);

// Re-export for tests
export { fingerprint };
