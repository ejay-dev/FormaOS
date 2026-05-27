#!/usr/bin/env node

// Audit 2026-05-27 (R9 backfill) — populate org_evidence.file_hash for
// rows uploaded before the SHA-256 capture step landed at the upload
// trust boundary (migrations 20260624052 + commit a2a05f66).
//
// Behaviour per row:
//   - Download from storage via file_path (bucket = 'evidence').
//   - Compute SHA-256, UPDATE file_hash.
//   - If storage download fails (blob missing, permission, etc.), LEAVE
//     file_hash NULL and log a warning. The R9 verifier already classifies
//     these as `no_recorded_hash` on attempted verification, so leaving
//     NULL is the honest outcome.
//
// Idempotent: rows that already have file_hash set are skipped.
//
// Run: `npm run db:backfill:evidence-file-hash`
// Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or .env.local).

import './_node20-ws-shim.mjs';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { createHash } from 'node:crypto';

config({ path: '.env.local' });

const STORAGE_BUCKET = 'evidence';
const BATCH_SIZE = 50;

function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function sha256Hex(buffer) {
  const bytes = Buffer.from(buffer);
  return createHash('sha256').update(bytes).digest('hex');
}

async function fetchPendingRows(seenIds, limit) {
  // Exclude already-tried IDs in-process so failed rows (where the blob
  // is missing — we keep file_hash NULL on failure) don't loop forever.
  let q = admin
    .from('org_evidence')
    .select('id, file_path')
    .is('file_hash', null)
    .not('file_path', 'is', null)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (seenIds.size > 0) {
    // PostgREST `not.in.(uuid,...)` — bounded length, our seenIds is at
    // most 376 here so well under URL/header limits.
    const list = Array.from(seenIds).join(',');
    q = q.not('id', 'in', `(${list})`);
  }
  const { data, error } = await q;
  if (error) throw new Error(`fetch failed: ${error.message}`);
  return data ?? [];
}

const DOWNLOAD_TIMEOUT_MS = 15_000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label}_timeout_${ms}ms`)), ms),
    ),
  ]);
}

async function hashOne(row) {
  // Some legacy rows have file_path stored with a leading bucket prefix
  // (`evidence/<org-id>/...`) which `storage.from('evidence').download()`
  // does NOT want — supabase-js prepends the bucket itself. Strip it.
  const downloadPath = row.file_path.startsWith(`${STORAGE_BUCKET}/`)
    ? row.file_path.slice(STORAGE_BUCKET.length + 1)
    : row.file_path;

  let blob = null;
  let downloadError = null;
  try {
    const result = await withTimeout(
      admin.storage.from(STORAGE_BUCKET).download(downloadPath),
      DOWNLOAD_TIMEOUT_MS,
      'download',
    );
    blob = result.data;
    downloadError = result.error;
  } catch (err) {
    return { id: row.id, ok: false, reason: err?.message ?? 'download_threw' };
  }
  if (downloadError || !blob) {
    return {
      id: row.id,
      ok: false,
      reason: downloadError?.message ?? 'storage_download_returned_null',
    };
  }
  const arrayBuffer = await blob.arrayBuffer();
  const hash = sha256Hex(arrayBuffer);
  const { error: updateError } = await admin
    .from('org_evidence')
    .update({ file_hash: hash })
    .eq('id', row.id)
    .is('file_hash', null); // double-guard against race with concurrent uploads
  if (updateError) {
    return { id: row.id, ok: false, reason: `update_failed: ${updateError.message}` };
  }
  return { id: row.id, ok: true, hash };
}

async function main() {
  let totalSeen = 0;
  let totalHashed = 0;
  let totalFailed = 0;
  const failures = [];
  const seenIds = new Set();

  // Walk batches. The seenIds set prevents the same failed row from
  // looping back (we leave file_hash NULL on failure; the .is('file_hash', null)
  // filter would otherwise re-fetch it forever).
  for (;;) {
    const rows = await fetchPendingRows(seenIds, BATCH_SIZE);
    if (rows.length === 0) break;
    for (const row of rows) {
      totalSeen += 1;
      seenIds.add(row.id);
      const result = await hashOne(row);
      if (result.ok) {
        totalHashed += 1;
        if (totalHashed % 25 === 0) {
          console.log(`  hashed ${totalHashed} so far...`);
        }
      } else {
        totalFailed += 1;
        failures.push({ id: result.id, reason: result.reason });
        if (totalFailed % 10 === 1) {
          console.log(`  fail ${totalFailed}: ${result.id} (${result.reason})`);
        }
      }
    }
  }

  console.log('');
  console.log(`Backfill complete.`);
  console.log(`  rows seen:    ${totalSeen}`);
  console.log(`  hashed OK:    ${totalHashed}`);
  console.log(`  failed:       ${totalFailed}`);

  if (failures.length > 0) {
    console.log('\nFailures (file_hash left NULL; verifier will report `no_recorded_hash` on attempt):');
    for (const f of failures.slice(0, 20)) {
      console.log(`  ${f.id}  ${f.reason}`);
    }
    if (failures.length > 20) {
      console.log(`  ... and ${failures.length - 20} more`);
    }
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(`backfill failed: ${err.message}`);
  process.exit(1);
});
