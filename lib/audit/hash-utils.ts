import { createHash } from 'crypto';

/**
 * Compute SHA-256 hash for an audit log entry (for tamper-proof chain)
 */
export function computeEntryHash(entry: {
  id: string;
  orgId: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, unknown>;
  createdAt: string;
  prevHash?: string;
}): string {
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
  }>,
): ChainIntegrityResult {
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const computed = computeEntryHash({
      id: e.id,
      orgId: e.org_id,
      userId: e.user_id,
      action: e.action,
      resourceType: e.resource_type,
      resourceId: e.resource_id,
      details: e.details || {},
      createdAt: e.created_at,
      prevHash: e.prev_hash,
    });

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
