import { createHash } from 'crypto';

/**
 * Hash algorithm version. Rows in audit_log carry a `hash_algo`
 * column so verification picks the matching algorithm per row.
 *  - 'v1' : legacy JS hash (omits keys whose value is `undefined`).
 *           Rows created before audit 2026-05-26.
 *  - 'v2' : canonical hash with explicit `null` for missing optional
 *           fields and a fixed-format created_at. Matches the
 *           Postgres-side `_audit_log_compute_hash_v2` function so
 *           the new `audit_log_append` RPC can compute hashes
 *           server-side under an advisory lock.
 */
export type AuditHashAlgo = 'v1' | 'v2';

/**
 * Compute SHA-256 hash for an audit log entry.
 * Defaults to v2 for new code; v1 is preserved for verification of
 * legacy rows.
 */
export function computeEntryHash(
  entry: {
    id: string;
    orgId: string;
    userId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    details: Record<string, unknown>;
    createdAt: string;
    prevHash?: string;
  },
  algo: AuditHashAlgo = 'v2',
): string {
  if (algo === 'v1') {
    const payload = JSON.stringify({
      id: entry.id,
      org_id: entry.orgId,
      user_id: entry.userId,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      details: entry.details,
      created_at: entry.createdAt,
      prev_hash: entry.prevHash || '',
    });
    return createHash('sha256').update(payload).digest('hex');
  }

  // v2: canonical, key-order-preserved JSON with explicit nulls for
  // missing optional fields. Must match Postgres
  // `_audit_log_compute_hash_v2`:
  // json_build_object('id', ..., 'org_id', ..., 'user_id', ..., ...)
  // serialises as a key-ordered object with the same value coercions.
  const createdAtV2 = formatCreatedAtV2(entry.createdAt);
  const payload = JSON.stringify({
    id: entry.id,
    org_id: entry.orgId,
    user_id: entry.userId ?? null,
    action: entry.action,
    resource_type: entry.resourceType,
    resource_id: entry.resourceId ?? null,
    details: entry.details ?? {},
    created_at: createdAtV2,
    prev_hash: entry.prevHash || '',
  });
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * v2 canonical timestamp format: YYYY-MM-DDTHH:MM:SS.mmmZ in UTC.
 * Matches Postgres `to_char(... 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`.
 * Accepts any ISO 8601 timestamp string; re-emits as canonical UTC.
 */
export function formatCreatedAtV2(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const yyyy = d.getUTCFullYear().toString().padStart(4, '0');
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = d.getUTCDate().toString().padStart(2, '0');
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mi = d.getUTCMinutes().toString().padStart(2, '0');
  const ss = d.getUTCSeconds().toString().padStart(2, '0');
  const ms = d.getUTCMilliseconds().toString().padStart(3, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}.${ms}Z`;
}

/**
 * Result of verifying a chain of audit entries. `valid` stays the
 * top-level outcome so existing callers continue to work; `reason`
 * lets the verifier distinguish hash tampering from a missing row.
 */
export type ChainIntegrityResult = {
  valid: boolean;
  totalChecked: number;
  brokenAt?: number;
  reason?: 'hash_mismatch' | 'prev_hash_mismatch' | 'sequence_gap';
};

/**
 * Verify that a chain of audit entries is intact (no tampering).
 *
 * The entries MUST be ordered by sequence_number ASC. The verifier
 * checks three invariants per row:
 *  1. `entry_hash` matches a recomputed hash of the row's contents.
 *  2. `prev_hash` equals the previous row's `entry_hash`.
 *  3. `sequence_number` is exactly one greater than the previous row.
 *
 * Invariant (3) catches deletions in the middle of the chain — the
 * hash chain alone cannot detect a deleted row because each survivor
 * still references its predecessor's hash correctly. The
 * UNIQUE(org_id, sequence_number) constraint on `audit_log` allows
 * row insertion at any gap, so an attacker with table-write access
 * could remove a row and leave the chain "valid" by hash alone.
 *
 * If `sequence_number` is missing on a row (legacy data pre-dating
 * 20260624013), the monotonicity check is skipped for that pair.
 */
export function verifyChainIntegrity(
  entries: Array<{
    id: string;
    org_id: string;
    user_id?: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    details: Record<string, unknown>;
    created_at: string;
    entry_hash: string;
    prev_hash?: string;
    sequence_number?: number | null;
    hash_algo?: AuditHashAlgo | null;
  }>,
): ChainIntegrityResult {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    // Default legacy rows (no hash_algo column / null) to v1 so the
    // historical chain remains verifiable.
    const algo: AuditHashAlgo = e.hash_algo === 'v2' ? 'v2' : 'v1';
    const computed = computeEntryHash(
      {
        id: e.id,
        orgId: e.org_id,
        userId: e.user_id,
        action: e.action,
        resourceType: e.resource_type,
        resourceId: e.resource_id,
        details: e.details || {},
        createdAt: e.created_at,
        prevHash: e.prev_hash,
      },
      algo,
    );

    if (computed !== e.entry_hash) {
      return {
        valid: false,
        brokenAt: i,
        totalChecked: entries.length,
        reason: 'hash_mismatch',
      };
    }

    if (i > 0) {
      if (e.prev_hash !== entries[i - 1].entry_hash) {
        return {
          valid: false,
          brokenAt: i,
          totalChecked: entries.length,
          reason: 'prev_hash_mismatch',
        };
      }

      const prevSeq = entries[i - 1].sequence_number;
      const thisSeq = e.sequence_number;
      if (
        typeof prevSeq === 'number' &&
        typeof thisSeq === 'number' &&
        thisSeq !== prevSeq + 1
      ) {
        return {
          valid: false,
          brokenAt: i,
          totalChecked: entries.length,
          reason: 'sequence_gap',
        };
      }
    }
  }

  return { valid: true, totalChecked: entries.length };
}
