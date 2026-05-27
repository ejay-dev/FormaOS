import 'server-only';

import { createHash } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// R9 (Audit 2026-05-27): integrity verification for uploaded evidence
// files. Companion to the file_hash column captured at upload time
// (migration 20260624052). The hash itself never leaves storage —
// verification re-downloads the object from the storage bucket, re-
// hashes the bytes, compares against the recorded hex digest.
//
// Why this exists: storage-bucket compromise (service-role token
// leak, misconfigured storage.objects RLS, a buggy admin tool with
// write access) can replace a file's bytes while leaving the
// org_evidence row untouched. Without a stored hash, the swap is
// invisible — compliance reports keep referencing the row and
// downstream auditors trust the path.
//
// Usage:
//   const result = await verifyEvidenceFileHash(evidenceId);
//   if (!result.ok) {
//     // result.reason is one of: 'no_recorded_hash', 'file_missing',
//     // 'hash_mismatch', 'lookup_failed'. result.recordedHash and
//     // result.actualHash are populated when the failure is a mismatch.
//   }

export const EVIDENCE_STORAGE_BUCKET = 'evidence';

export type VerifyResult =
  | { ok: true; hash: string }
  | {
      ok: false;
      reason:
        | 'no_recorded_hash'
        | 'file_missing'
        | 'hash_mismatch'
        | 'lookup_failed';
      recordedHash?: string | null;
      actualHash?: string;
      detail?: string;
    };

/**
 * Compute the SHA-256 hex digest of a buffer. Exposed so the upload
 * route and verifier hash with the exact same primitive — kept thin
 * on purpose so a future rotation to a different algorithm only
 * touches this one site.
 */
export function computeFileSha256(buffer: Buffer | ArrayBuffer | Uint8Array): string {
  const bytes =
    buffer instanceof Buffer
      ? buffer
      : Buffer.from(buffer as ArrayBufferLike);
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Re-download the storage object for an evidence row, recompute the
 * SHA-256, compare to the recorded hash. Returns a structured result
 * so callers can render the mismatch into compliance reports.
 *
 * The function uses the service-role client deliberately — verification
 * is a privileged operation that ops calls during an integrity audit,
 * not something a tenant user invokes from the UI. If you wire it into
 * a customer-facing surface in future, wrap it in an explicit
 * permission gate first.
 */
export async function verifyEvidenceFileHash(
  evidenceId: string,
): Promise<VerifyResult> {
  const admin = createSupabaseAdminClient();

  const { data: row, error: rowError } = await admin
    .from('org_evidence')
    .select('id, file_path, file_hash')
    .eq('id', evidenceId)
    .maybeSingle();

  if (rowError) {
    return {
      ok: false,
      reason: 'lookup_failed',
      detail: rowError.message,
    };
  }
  if (!row) {
    return {
      ok: false,
      reason: 'lookup_failed',
      detail: 'evidence_row_not_found',
    };
  }
  const filePath = (row as { file_path?: unknown }).file_path;
  const recordedHash =
    typeof (row as { file_hash?: unknown }).file_hash === 'string'
      ? ((row as { file_hash?: unknown }).file_hash as string)
      : null;

  if (typeof filePath !== 'string' || filePath.length === 0) {
    return {
      ok: false,
      reason: 'file_missing',
      detail: 'evidence row has no file_path',
    };
  }
  if (!recordedHash) {
    return {
      ok: false,
      reason: 'no_recorded_hash',
      detail:
        'evidence predates the R9 hash column or was uploaded by a path that did not record one',
      recordedHash: null,
    };
  }

  const { data: blob, error: downloadError } = await admin.storage
    .from(EVIDENCE_STORAGE_BUCKET)
    .download(filePath);

  if (downloadError || !blob) {
    return {
      ok: false,
      reason: 'file_missing',
      detail: downloadError?.message ?? 'storage_download_returned_null',
    };
  }

  const arrayBuffer = await blob.arrayBuffer();
  const actualHash = computeFileSha256(arrayBuffer);

  if (actualHash !== recordedHash) {
    return {
      ok: false,
      reason: 'hash_mismatch',
      recordedHash,
      actualHash,
    };
  }

  return { ok: true, hash: actualHash };
}
