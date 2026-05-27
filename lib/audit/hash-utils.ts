import { createHash, createHmac } from 'crypto';

/**
 * Hash algorithm version. Rows in audit_log carry a `hash_algo`
 * column so verification picks the matching algorithm per row.
 *  - 'v1'       : legacy JS hash (omits keys whose value is `undefined`).
 *                 Rows created before audit 2026-05-26.
 *  - 'v2'       : canonical hash with explicit `null` for missing optional
 *                 fields and a fixed-format created_at. Matches the
 *                 Postgres-side `_audit_log_compute_hash_v2` function so
 *                 the new `audit_log_append` RPC can compute hashes
 *                 server-side under an advisory lock.
 *  - 'v3-hmac'  : v2 canonical payload, but also stores an HMAC-SHA-256
 *                 (`entry_mac`) keyed with a per-org secret from
 *                 audit_chain_secrets. Tampering now requires both DB
 *                 write access AND the key. Audit 2026-05-27 (R3).
 */
export type AuditHashAlgo = 'v1' | 'v2' | 'v3-hmac';

/**
 * Compute SHA-256 hash for an audit log entry.
 * Defaults to v2 for new code; v1 is preserved for verification of
 * legacy rows.
 */
export type AuditEntryInput = {
  id: string;
  orgId: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details: Record<string, unknown>;
  createdAt: string;
  prevHash?: string;
};

/**
 * Build the canonical v2 payload (also reused by v3-hmac). Must match
 * Postgres `_audit_log_compute_hash_v2` exactly — key order, value
 * coercions, and the timestamp format are all load-bearing.
 */
function canonicalPayloadV2(entry: AuditEntryInput): string {
  const createdAtV2 = formatCreatedAtV2(entry.createdAt);
  return JSON.stringify({
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
}

export function computeEntryHash(
  entry: AuditEntryInput,
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
  // v2 + v3-hmac share the same canonical payload; verifier picks the
  // right primitive based on hash_algo.
  return createHash('sha256').update(canonicalPayloadV2(entry)).digest('hex');
}

/**
 * R3 (Audit 2026-05-27): compute HMAC-SHA-256 over the v2 canonical
 * payload using the per-org chain key. Must match Postgres-side
 * audit_log_append_v3 exactly.
 */
export function computeEntryMac(entry: AuditEntryInput, key: Buffer): string {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    throw new Error(
      `computeEntryMac: expected 32-byte key buffer, got ${key?.length ?? 'undefined'}`,
    );
  }
  return createHmac('sha256', key)
    .update(canonicalPayloadV2(entry), 'utf8')
    .digest('hex');
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
  reason?:
    | 'hash_mismatch'
    | 'prev_hash_mismatch'
    | 'sequence_gap'
    | 'mac_mismatch'
    | 'missing_mac_key';
};

/**
 * Optional key resolver for v3-hmac rows. Given an org_id, returns the
 * raw 32-byte HMAC key — typically wired to chain-secret-manager's
 * resolveChainSecret. Verifier returns `missing_mac_key` for a v3-hmac
 * row when the resolver is omitted or returns null.
 */
export type ChainSecretResolver = (
  orgId: string,
) => Promise<Buffer | null> | Buffer | null;

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
export type VerifiableEntry = {
  id: string;
  org_id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details: Record<string, unknown>;
  created_at: string;
  entry_hash: string;
  entry_mac?: string | null;
  prev_hash?: string;
  sequence_number?: number | null;
  hash_algo?: AuditHashAlgo | null;
};

/**
 * Synchronous chain verification for v1/v2 rows.
 *
 * For v3-hmac rows this checks `entry_hash` (which still ships alongside
 * `entry_mac`) but cannot verify the MAC without a key resolver — use
 * `verifyChainIntegrityAsync` if you need full MAC verification.
 */
export function verifyChainIntegrity(
  entries: Array<VerifiableEntry>,
): ChainIntegrityResult {
  for (let i = 0; i < entries.length; i++) {
    const step = verifyEntryHashAndLinks(entries, i);
    if (step) return step;
  }
  return { valid: true, totalChecked: entries.length };
}

/**
 * R3 (Audit 2026-05-27): async chain verification that also checks the
 * HMAC on v3-hmac rows. The `resolveKey` callback receives the org_id
 * and must return the 32-byte key (or null/undefined to fail-closed
 * with `missing_mac_key`). Keys are cached per-org for the lifetime of
 * the call.
 */
export async function verifyChainIntegrityAsync(
  entries: Array<VerifiableEntry>,
  resolveKey: ChainSecretResolver,
): Promise<ChainIntegrityResult> {
  const keyCache = new Map<string, Buffer | null>();

  async function getKey(orgId: string): Promise<Buffer | null> {
    if (keyCache.has(orgId)) return keyCache.get(orgId)!;
    const k = await resolveKey(orgId);
    keyCache.set(orgId, k ?? null);
    return k ?? null;
  }

  for (let i = 0; i < entries.length; i++) {
    const step = verifyEntryHashAndLinks(entries, i);
    if (step) return step;

    const e = entries[i];
    if (e.hash_algo === 'v3-hmac') {
      const key = await getKey(e.org_id);
      if (!key) {
        return {
          valid: false,
          brokenAt: i,
          totalChecked: entries.length,
          reason: 'missing_mac_key',
        };
      }
      const expectedMac = computeEntryMac(
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
        key,
      );
      if (expectedMac !== e.entry_mac) {
        return {
          valid: false,
          brokenAt: i,
          totalChecked: entries.length,
          reason: 'mac_mismatch',
        };
      }
    }
  }

  return { valid: true, totalChecked: entries.length };
}

/**
 * Shared step: verify a single row's entry_hash + its link to the
 * previous row's hash + monotonic sequence number. Returns an error
 * result on failure, undefined on success.
 */
function verifyEntryHashAndLinks(
  entries: Array<VerifiableEntry>,
  i: number,
): ChainIntegrityResult | undefined {
  const e = entries[i];
  // Default legacy rows (no hash_algo column / null) to v1.
  // v2 and v3-hmac share the v2 canonical payload for entry_hash.
  const algo: AuditHashAlgo =
    e.hash_algo === 'v2' || e.hash_algo === 'v3-hmac' ? 'v2' : 'v1';
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
  return undefined;
}
