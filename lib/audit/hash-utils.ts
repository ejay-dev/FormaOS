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
 * Verify that a chain of audit entries is intact (no tampering)
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
  }>,
): { valid: boolean; brokenAt?: number; totalChecked: number } {
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
      return { valid: false, brokenAt: i, totalChecked: entries.length };
    }

    // Chain check: this entry's prev_hash should match the previous entry's hash
    if (i > 0 && e.prev_hash !== entries[i - 1].entry_hash) {
      return { valid: false, brokenAt: i, totalChecked: entries.length };
    }
  }

  return { valid: true, totalChecked: entries.length };
}
