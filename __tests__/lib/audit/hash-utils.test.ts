import {
  computeEntryHash,
  verifyChainIntegrity,
} from '@/lib/audit/hash-utils';

type Entry = Parameters<typeof verifyChainIntegrity>[0][number];

function buildEntry(seq: number, prevHash: string, overrides: Partial<Entry> = {}): Entry {
  const base = {
    id: `id-${seq}`,
    org_id: 'org-1',
    user_id: 'u-1',
    action: `action.${seq}`,
    resource_type: 'thing',
    resource_id: `thing-${seq}`,
    details: { seq } as Record<string, unknown>,
    created_at: `2026-01-01T00:00:${String(seq).padStart(2, '0')}Z`,
    prev_hash: prevHash,
    sequence_number: seq,
  };
  const entry_hash = computeEntryHash({
    id: base.id,
    orgId: base.org_id,
    userId: base.user_id,
    action: base.action,
    resourceType: base.resource_type,
    resourceId: base.resource_id,
    details: base.details,
    createdAt: base.created_at,
    prevHash: base.prev_hash,
  });
  return { ...base, entry_hash, ...overrides };
}

function buildChain(length: number): Entry[] {
  const chain: Entry[] = [];
  let prevHash = '';
  for (let i = 1; i <= length; i++) {
    const entry = buildEntry(i, prevHash);
    chain.push(entry);
    prevHash = entry.entry_hash;
  }
  return chain;
}

describe('verifyChainIntegrity', () => {
  it('returns valid for an empty chain', () => {
    const result = verifyChainIntegrity([]);
    expect(result).toEqual({ valid: true, totalChecked: 0 });
  });

  it('returns valid for an intact chain', () => {
    const chain = buildChain(5);
    const result = verifyChainIntegrity(chain);
    expect(result.valid).toBe(true);
    expect(result.totalChecked).toBe(5);
  });

  it('detects hash_mismatch when entry contents are tampered', () => {
    const chain = buildChain(3);
    // Mutate the action of entry 2 without recomputing its hash.
    chain[1] = { ...chain[1], action: 'tampered.action' };
    const result = verifyChainIntegrity(chain);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
    expect(result.reason).toBe('hash_mismatch');
  });

  it('detects prev_hash_mismatch when chain is reordered', () => {
    const chain = buildChain(3);
    // Swap entry 1 and 2 — prev_hash references no longer match.
    [chain[1], chain[2]] = [chain[2], chain[1]];
    const result = verifyChainIntegrity(chain);
    expect(result.valid).toBe(false);
    // After swap, the recomputed hash of the (now first) row 2 fails
    // because its stored entry_hash was computed against prev_hash
    // from row 1 — so we surface hash_mismatch at the swap point.
    expect(['hash_mismatch', 'prev_hash_mismatch']).toContain(result.reason);
  });

  it('detects sequence_gap when a middle row is removed', () => {
    const chain = buildChain(4);
    // Drop entry at index 1 (sequence 2) — the chain's hash links
    // are now broken AND there is a sequence gap. The verifier
    // checks hashes first, so this surfaces as prev_hash_mismatch.
    // To isolate the sequence-gap path, mutate just sequence_number.
    const tweaked = chain.map((e, i) =>
      i === 1 ? { ...e, sequence_number: e.sequence_number! + 10 } : e,
    );
    // Recompute the hash for the mutated row so the hash check passes
    // — we want the sequence-gap detector to fire instead.
    tweaked[1] = {
      ...tweaked[1],
      entry_hash: computeEntryHash({
        id: tweaked[1].id,
        orgId: tweaked[1].org_id,
        userId: tweaked[1].user_id,
        action: tweaked[1].action,
        resourceType: tweaked[1].resource_type,
        resourceId: tweaked[1].resource_id,
        details: tweaked[1].details,
        createdAt: tweaked[1].created_at,
        prevHash: tweaked[1].prev_hash,
      }),
    };
    // The next row's prev_hash now mismatches the mutated row's new
    // entry_hash, so we recompute that too so monotonicity is what
    // trips.
    tweaked[2] = {
      ...tweaked[2],
      prev_hash: tweaked[1].entry_hash,
      entry_hash: computeEntryHash({
        id: tweaked[2].id,
        orgId: tweaked[2].org_id,
        userId: tweaked[2].user_id,
        action: tweaked[2].action,
        resourceType: tweaked[2].resource_type,
        resourceId: tweaked[2].resource_id,
        details: tweaked[2].details,
        createdAt: tweaked[2].created_at,
        prevHash: tweaked[1].entry_hash,
      }),
    };
    tweaked[3] = {
      ...tweaked[3],
      prev_hash: tweaked[2].entry_hash,
      entry_hash: computeEntryHash({
        id: tweaked[3].id,
        orgId: tweaked[3].org_id,
        userId: tweaked[3].user_id,
        action: tweaked[3].action,
        resourceType: tweaked[3].resource_type,
        resourceId: tweaked[3].resource_id,
        details: tweaked[3].details,
        createdAt: tweaked[3].created_at,
        prevHash: tweaked[2].entry_hash,
      }),
    };
    const result = verifyChainIntegrity(tweaked);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('sequence_gap');
  });

  it('skips sequence monotonicity check when sequence_number missing (legacy rows)', () => {
    const chain = buildChain(3).map((e) => ({ ...e, sequence_number: null }));
    const result = verifyChainIntegrity(chain);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});
