# Secret Rotation Runbook

**Status:** authoritative as of 2026-05-27.
**Owner:** founder / on-call platform owner.

Every platform secret listed below has a defined rotation cadence + a
documented procedure. Every rotation MUST be recorded in
`public.secret_rotations` via `scripts/record-secret-rotation.mjs` so
the audit trail survives even if the operator forgets to write a
postmortem note.

---

## Secrets inventory

| Secret | Where stored | Cadence | Rotation difficulty |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env + Supabase dashboard | Yearly OR on suspected compromise | LOW (Supabase issues new key, paste into Vercel) |
| `AUDIT_CHAIN_HMAC_KEY` | Vercel env | **DO NOT ROTATE WITHOUT CARE** — see special procedure below | HIGH |
| `INTEGRATION_CONFIG_KEY` | Vercel env | Yearly | MEDIUM (re-encrypts every integration config blob) |
| `TOTP_ENCRYPTION_KEY` | Vercel env | Yearly | MEDIUM (re-encrypts every user's TOTP secret) |
| `TRUST_PACKET_SIGNING_KEY` | Vercel env | Bi-annual | LOW (old packets remain verifiable; new packets signed with new key) |
| `EMAIL_UNSUBSCRIBE_SECRET` | Vercel env | Yearly | LOW (existing unsubscribe links remain valid for ~30 days during overlap) |
| `NEXTAUTH_SECRET` | Vercel env | Yearly | LOW (forces all sessions to re-authenticate) |
| `SAML_SP_PRIVATE_KEY` | Vercel env | Yearly OR on cert expiry | HIGH (requires updating each IdP-side SP metadata) |
| `VAPID_PRIVATE_KEY` | Vercel env | Yearly | LOW (mobile push re-subscribes on next app load) |
| `STRIPE_SECRET_KEY` (live) | Vercel env | On suspected compromise | LOW (Stripe issues new key) |
| `STRIPE_WEBHOOK_SECRET` | Vercel env | On suspected compromise OR webhook URL change | LOW |
| `CRON_SECRET` | Vercel env | Yearly | LOW |
| `PAGERDUTY_ROUTING_KEY` | Vercel env | Yearly OR on PagerDuty key reset | LOW |
| `POSTHOG_PERSONAL_API_KEY` | Vercel env | Yearly | LOW |
| `FIREBASE_SERVER_KEY` | Vercel env | Bi-annual | LOW |
| `KV_REST_API_TOKEN` | Vercel env | Yearly | LOW |

---

## Generic rotation procedure (LOW-difficulty secrets)

For all secrets marked LOW above:

```bash
# 1. Compute the previous fingerprint (SHA-256 hex, truncated to 12 chars)
PREV_FPR=$(echo -n "$OLD_VALUE" | shasum -a 256 | cut -c1-12)
NEW_FPR=$(echo -n "$NEW_VALUE" | shasum -a 256 | cut -c1-12)

# 2. Update Vercel env (live + preview)
vercel env rm SECRET_NAME production
vercel env add SECRET_NAME production
# ...paste the new value...

# 3. Redeploy
vercel --prod

# 4. Record the rotation in the ledger
node scripts/record-secret-rotation.mjs \
  --secret SECRET_NAME \
  --reason "Quarterly rotation 2026Q2" \
  --rotated-by "$(git config user.email)" \
  --previous-fingerprint "$PREV_FPR" \
  --new-fingerprint "$NEW_FPR" \
  --ticket-url "https://linear.app/formaos/issue/SECRET-123"
```

---

## AUDIT_CHAIN_HMAC_KEY (HIGH — special procedure)

The audit chain MAC key is the wrapping key for per-org HMAC keys stored
in `audit_chain_secrets`. Rotating the wrapping key WITHOUT
re-encrypting every existing row leaves the chain unverifiable for all
existing v3-hmac rows.

**Pre-flight:**

1. Confirm `AUDIT_CHAIN_V3_ENABLED=true` for at least 24h before
   rotation — there must be no in-flight chain writes during rotation.
2. Page on-call. Pause any cron that calls `writeAuditLog` if possible
   (or do this during a low-traffic window).

**Procedure:**

```bash
# 1. Snapshot the audit_chain_secrets table to a temp table for rollback
psql "$DATABASE_URL" -c \
  "CREATE TABLE audit_chain_secrets_snapshot_$(date +%Y%m%d) AS SELECT * FROM audit_chain_secrets;"

# 2. Generate fresh wrapping key (32 bytes)
NEW_KEY=$(openssl rand -hex 32)
echo "Stash this somewhere safe BEFORE the next step: $NEW_KEY"

# 3. Re-wrap every per-org key with the new wrapping key
#    Use scripts/rotate-audit-chain-wrapping-key.mjs (TODO: write).
#    The script:
#      a. Reads OLD_KEY from env (current AUDIT_CHAIN_HMAC_KEY)
#      b. Reads NEW_KEY from --new-key argument
#      c. For each audit_chain_secrets row:
#         - Decrypt with OLD_KEY → raw 32-byte key
#         - Encrypt with NEW_KEY → new envelope
#         - UPDATE the row with new encrypted_key
#      d. Refuses to run unless --confirm flag passed.

# 4. Update Vercel env
vercel env rm AUDIT_CHAIN_HMAC_KEY production
vercel env add AUDIT_CHAIN_HMAC_KEY production
# ...paste $NEW_KEY...

# 5. Redeploy
vercel --prod

# 6. Smoke-test: write an audit_log entry, verify the chain.
node scripts/snapshot-migration-ledger.mjs  # sanity that the DB is reachable
# (a dedicated smoke script would call audit_log_append_v3 + verify)

# 7. Record the rotation
node scripts/record-secret-rotation.mjs \
  --secret AUDIT_CHAIN_HMAC_KEY \
  --reason "Annual rotation 2026" \
  --rotated-by "ejaz@formaos.io" \
  --notes "Re-wrapped N audit_chain_secrets rows. Snapshot table: audit_chain_secrets_snapshot_$(date +%Y%m%d)"
```

**Rollback** (if smoke-test fails): restore from the snapshot table
+ revert Vercel env to the old key, redeploy.

---

## TOTP_ENCRYPTION_KEY (MEDIUM)

Rotating the TOTP encryption key requires re-encrypting every user's
stored TOTP secret. Build `scripts/rotate-totp-encryption-key.mjs` on
the same shape as the audit-chain rotation:

1. Snapshot the user_two_factor_auth table.
2. For each row: decrypt with OLD_KEY → re-encrypt with NEW_KEY.
3. Update Vercel env + redeploy.
4. Record the rotation.

Users do NOT need to re-enrol — their authenticator app still produces
the same OTP codes; only the at-rest encryption changes.

---

## INTEGRATION_CONFIG_KEY (MEDIUM)

Same shape as TOTP_ENCRYPTION_KEY but for the `directory_sync_configs`
and integration credential blobs. The envelope shape is identical
(AES-256-GCM) so a single rotation script can handle both kinds with
a `--table` argument.

---

## SAML_SP_PRIVATE_KEY (HIGH)

After rotating the SP private key, every IdP that has FormaOS as a
service-provider needs to receive updated SP metadata. Coordinate with
each enterprise customer separately. Old SAML assertions signed against
the previous SP key remain verifiable; new sessions require the new
key.

---

## Reading the ledger

```bash
# Latest rotation per secret
psql "$DATABASE_URL" -c "
  SELECT secret_name, MAX(rotated_at) AS last_rotated
  FROM secret_rotations
  GROUP BY secret_name
  ORDER BY last_rotated;
"

# Overdue rotations (anything not rotated in >365d)
psql "$DATABASE_URL" -c "
  WITH latest AS (
    SELECT secret_name, MAX(rotated_at) AS last_rotated
    FROM secret_rotations GROUP BY secret_name
  )
  SELECT secret_name, last_rotated, now() - last_rotated AS age
  FROM latest WHERE last_rotated < now() - interval '365 days';
"
```

---

## SOC2 / ISO mapping

This runbook is the artefact for:
- SOC 2 CC6.1 (logical-access cryptography) — key management documented.
- ISO/IEC 27001:2022 A.8.24 (cryptographic-key management) — full key-
  rotation procedure on file.
- NIST CSF PR.AC-1 (identity + credential management) — rotation
  cadence + ledger.

Quote this file directly in audit responses.
