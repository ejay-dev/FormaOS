# ADR — Keyed audit chain + Merkle inclusion proofs

**Status:** Draft (2026-05-27). Pending decision before R3/R4 implementation.
**Audit context:** R3 (keyed audit chain) and R4 (Merkle inclusion proofs on
compliance exports) — both deferred from the 2026-05-26 audit cycle because
they need this design decision first.
**Owners:** ejay-dev (decides); audit cycle agents implement.

---

## Problem

The append-only audit chain (`public.audit_log`) currently uses **unkeyed
SHA-256** over a canonical JSON serialisation linked by `prev_hash`. The
chain is tamper-evident *to anyone with read access to the entire chain*:
a verifier downloads every row in order, recomputes hashes, and detects
any inconsistency.

Two practical limits:

1. **Read-access requirement.** Verifying the chain means handing the
   verifier every row of the org's audit log. That's fine for internal
   ops but bad for customer-facing verification — a customer auditor
   shouldn't need raw access to every audit event to verify "did event
   X really occur at time T?".
2. **No external anchor.** A sufficiently-motivated insider with
   service_role + an off-hours window could rewrite the entire chain
   end-to-end: rehash every row in sequence, commit the new chain, and
   nothing in the chain itself would betray the rewrite. There is no
   anchor outside our infrastructure that customers (or we) can compare
   to.

R3 addresses #1 + #2 via a keyed audit chain. R4 addresses #1 specifically
by letting a verifier prove inclusion of a single event without seeing the
others.

## R3 — keyed audit chain

### Goal

Replace the plain SHA-256 chain with a **keyed MAC** so a chain rewrite
requires the key, not just write access to the table. Optionally anchor
the chain externally so even a key compromise is detectable.

### Options considered

| Option | Pros | Cons |
|---|---|---|
| **A. HMAC-SHA-256 with org-scoped server-side key** | Simple to implement; existing `audit_log_append` RPC is the natural place to inject the MAC; verifier-side change is minor (swap `createHash` for `createHmac`). | The MAC key lives in our infrastructure. An insider with both DB and secrets-manager access can still rewrite. |
| **B. Per-event signature with rotating per-day key** | Limits blast radius of a key compromise to one day. | Operational overhead: daily key rotation, key archive, verifier needs the right key per row. |
| **C. HMAC + periodic external anchor (e.g. daily transparency-log entry to Sigstore Rekor / a Postgres-side `audit_chain_anchors` table referencing an externally-signed digest)** | Detects rewrites even if the MAC key is compromised — the anchor record exists outside our control. | Most complex; needs an external trust root choice. |
| **D. Status quo** | Zero implementation cost. | Doesn't address the threat model. |

### Recommendation (subject to confirmation)

**A as the base, with hooks for C in a follow-up.**

- Add an `entry_mac` column alongside `entry_hash` and a new `hash_algo`
  value `'v3-hmac'`.
- The `audit_log_append` RPC reads the MAC key from a fresh
  `audit_chain_secrets` table (one row per org, encrypted at rest using
  the existing TOTP_ENCRYPTION_KEY pattern), computes HMAC-SHA-256 over
  the same canonical JSON used by v2.
- Verifier-side `verifyChainIntegrity` accepts a key resolver and
  recomputes the MAC.
- Hook for C: add an empty `audit_chain_anchors(org_id, anchored_at,
  external_anchor_id, top_hash)` table so a future cron can write the
  daily anchor without further schema change.

### Migration shape

1. Migration adds `entry_mac text` (nullable) + `audit_chain_secrets`
   table + audit-log-append RPC v3 that fills both `entry_hash` (v2,
   unchanged for backwards compat verification) and `entry_mac`.
2. Application code switches to v3 hashes on next deploy. v1/v2 rows
   remain verifiable via their respective algorithms.
3. After 30 days of v3-only writes, a hardening step revokes the v2
   write path so all new rows are MAC'd.
4. Verification UI reports per-row algorithm — a future v1/v2 row in a
   sea of v3 rows is itself suspicious.

### Out of scope (for this ADR)

- The external anchor choice. C should be its own decision when we know
  who the trust root is (Rekor, AWS QLDB, a notary service contract).
- Customer-facing verification UI for the keyed chain — same shape as
  the existing internal verifier just with the resolver swap.

---

## R4 — Merkle inclusion proofs on compliance exports

### Goal

When the audit-log export endpoint emits a "this is what happened in the
last quarter" bundle, include a **Merkle tree root + per-event inclusion
proofs** so an external auditor can verify any single event without
seeing the others.

### Options considered

| Option | Pros | Cons |
|---|---|---|
| **A. Per-export Merkle tree, root in the manifest** | Self-contained: the export includes the tree, the root, and a proof for every leaf. Auditor verifies leaf-by-leaf. | Tree is rebuilt per export — no continuity across exports. |
| **B. Persistent per-org Merkle tree maintained at append time** | Continuity: any event is anchored once and provable in every future export. | Substantial implementation cost: tree maintenance, persistence, rebalancing on chain corrections. |
| **C. Bundle existing prev_hash chain as the "proof"** | Zero implementation cost. | Doesn't actually solve R4 — verifier still needs every row to verify any row. |

### Recommendation

**A.** Per-export Merkle tree is a 2-3 day implementation and meets the
goal. B is overkill until we have an external timestamp anchor (then it
becomes valuable). Time-box A; revisit B if a customer or auditor
demands continuity.

### Output shape (proposed)

Each exported bundle includes:

```jsonc
{
  "manifest": { ... existing ... },
  "merkle": {
    "algorithm": "sha256",
    "tree_size": 12345,
    "root": "<hex>",
    "leaves": [{ "event_id": "...", "leaf_hash": "<hex>" }, ...],
    "proofs": {
      "<event_id>": ["<sibling_hex>", "<sibling_hex>", ...]
    }
  }
}
```

A verification helper (TS, ships in `lib/audit/merkle.ts`) takes a single
event_id + proof + claimed root and returns boolean. Companion script
`scripts/verify-export-merkle.mjs` for auditors to run against a bundle.

### Migration shape

- No schema change for A. The Merkle tree is materialised at export time.
- Pure code: `lib/audit/merkle.ts` (build + verify) + export-route
  changes to assemble the tree and write the new bundle section.

---

## Decisions needed from owner

1. **R3 protocol:** confirm option A (HMAC + hooks for C). If preference
   is B (rotating keys) or skip-to-C (with a chosen external anchor),
   flag here.
2. **R3 timing:** ship in this audit cycle? Or block on the anchor
   decision (C)?
3. **R4 scope:** confirm option A (per-export tree). B is the slower
   road if continuity matters.
4. **External anchor (C — out-of-scope for now):** when this is taken
   up, who is the trust root? Sigstore Rekor (free, public log) /
   internal QLDB (paid, audit-controlled) / a third-party notary
   service / something else?

---

## Implementation order if owner says yes

1. R3 migration + RPC v3 (2-3 days).
2. R3 verifier-side code + tests.
3. R4 Merkle tree builder + verifier (2-3 days).
4. R4 wired into existing `app/api/audit/export/route.ts` +
   enterprise-export bundle assembly.
5. External docs: customer-facing "how to verify your audit export"
   page in `docs/audit/`.

Total ballpark: 7-10 working days for R3 + R4 baseline (Options A + A).
External anchor (C) is a separate workstream when the trust root is chosen.

---

## Why this ADR exists

The 2026-05-27 audit cycle agent (me) flagged R3 + R4 as "needs an ADR
before code" because:

- The protocol choice (A/B/C) affects every audit log consumer,
  including customers we may give verification access to. Wrong choice
  is expensive to undo (key rotation, schema migration, customer
  comms).
- The trust-root decision for C is a business decision (cost, contract,
  customer-facing trust statement), not a code decision — and waiting
  for it should not block R3/R4 baseline.

The two questions above can be answered without R3/R4 implementation
expertise. Once answered, implementation is mechanical.
