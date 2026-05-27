# Security Policy

FormaOS handles compliance, audit, and personal data on behalf of regulated organisations. We take security defects seriously and welcome coordinated disclosure from researchers and customers.

## Supported Versions

FormaOS is a continuously deployed SaaS product; there is no concept of a "supported version" of the hosted service — only the currently deployed release at `app.formaos.com.au` is in scope. The `main` branch of this repository is the active codebase.

| Branch | Supported            |
| ------ | -------------------- |
| `main` | Yes — active release |
| Other branches and tags | No — research only |

Self-hosted distributions of FormaOS are not offered at this time.

## Reporting a Vulnerability

Please report suspected vulnerabilities by email to **security@formaos.com.au**.

Include:

- A clear description of the issue and its impact.
- Steps to reproduce, including any required test accounts or payloads.
- Whether the issue is currently being exploited in the wild, to your knowledge.
- Your name and how you would like to be credited (or "anonymous").

For sensitive reports you may request our PGP key in the first email; we will reply with a current key.

We will acknowledge receipt within **2 business days** and provide a substantive response (triage outcome, expected timeline) within **7 business days**.

## Out of Scope

- Reports generated entirely by automated scanners with no demonstration of impact.
- Issues in third-party services we depend on (Supabase, Stripe, Vercel, Resend) — please report those directly to the vendor.
- Self-XSS or social-engineering attacks against FormaOS staff.
- Missing security headers on marketing pages where no sensitive content is rendered.
- Rate-limiting bypass on unauthenticated public endpoints unless it enables material harm.

## Disclosure Policy

We follow coordinated disclosure with a **90-day default embargo** from the date of acknowledgement.

- Embargo may be shortened by mutual agreement, or unilaterally by us if we observe active exploitation in the wild.
- Embargo may be extended by mutual agreement if a fix requires customer-side action (for example, IdP reconfiguration).
- We will publish a CVE-style advisory once a fix has shipped and customers have had a reasonable opportunity to apply any required actions.
- We do not currently offer a paid bug bounty. We do credit reporters publicly in the Acknowledgements section below (with consent).

## Safe Harbour

We will not pursue legal action against researchers who:

- Make a good-faith effort to comply with this policy.
- Avoid privacy violations, destruction of data, and degradation of service.
- Do not access more data than necessary to demonstrate the issue, and delete any data accessed once the report is filed.
- Give us reasonable time to remediate before public disclosure.

## Security architecture (audit-cycle artefacts)

The following platform-level controls underpin the security posture and
are the artefacts a SaaS auditor will typically ask for. Each item links
to the authoritative document.

### Cryptography + key management

- **Secret rotation runbook + ledger** —
  [`docs/operations/secret-rotation-runbook.md`](docs/operations/secret-rotation-runbook.md).
  16 platform secrets inventoried with cadence + rotation procedure.
  Append-only `public.secret_rotations` ledger records every rotation
  event with SHA-256 fingerprint, ticket URL, and rationale.
- **CI gate for leaked secrets** —
  [`scripts/check-leaked-secrets.mjs`](scripts/check-leaked-secrets.mjs).
  Runs on every PR. Detects Stripe live keys, AWS access key IDs,
  Google API keys, and Supabase service-role JWT shapes in tracked files.

### Audit log integrity

- **Hash chain (`v2`)** — `audit_log.entry_hash` is SHA-256 over a
  canonical JSON payload linked by `prev_hash`. RESTRICTIVE RLS
  policies block UPDATE + DELETE on `audit_log` (P0-1 / audit
  2026-05-26). See [`lib/audit/hash-utils.ts`](lib/audit/hash-utils.ts).
- **Keyed chain (`v3-hmac`)** — per-org HMAC-SHA-256 keyed with a
  secret stored encrypted at rest in `public.audit_chain_secrets`.
  Rotation guidance in the secret-rotation runbook. Enable via
  `AUDIT_CHAIN_V3_ENABLED=true`. See
  [`lib/audit/chain-secret-manager.ts`](lib/audit/chain-secret-manager.ts).
- **External anchor** — daily submission of the per-org top-of-chain
  hash to a public transparency log (Sigstore Rekor). Enable via
  `AUDIT_CHAIN_ANCHOR_ENABLED=true`. See
  [`lib/audit/external-anchor.ts`](lib/audit/external-anchor.ts) and
  [`docs/adr/2026-05-27-audit-chain-keyed-hmac-and-merkle-proofs.md`](docs/adr/2026-05-27-audit-chain-keyed-hmac-and-merkle-proofs.md).
- **Merkle inclusion proofs** — audit-log export bundle includes a
  Merkle tree root + per-event proofs so external auditors can verify
  inclusion without seeing other events. See
  [`scripts/verify-export-merkle.mjs`](scripts/verify-export-merkle.mjs).

### Backups + disaster recovery

- **PITR window**: 7 days, Supabase-managed.
- **RPO target**: 60 minutes. **RTO target**: 240 minutes.
- **Monthly drill** —
  [`docs/operations/pitr-restore-runbook.md`](docs/operations/pitr-restore-runbook.md).
  Recorded via [`scripts/verify-restore.mjs`](scripts/verify-restore.mjs)
  into `public.restore_test_runs`. CI gate
  [`scripts/check-restore-test-recency.mjs`](scripts/check-restore-test-recency.mjs)
  fails the build if no successful drill in 35 days.

### Multi-tenant isolation

- **RLS on every tenant table** — verified per PR by
  `npm run test:db:rls` and the cross-org isolation suites at
  `__tests__/integration/rls/`.
- **`createSupabaseOrgClient(orgId)` wrapper** — see
  [`ENGINEERING_CHANGE_MATRIX.md`](ENGINEERING_CHANGE_MATRIX.md) for the
  required pattern. Direct admin-client usage requires an inline
  `eslint-disable` with justification.

### Privacy + data subject rights

- **GDPR purge** — operator-triggered via
  `/api/admin/users/<userId>/gdpr-purge`. Hourly cron processes
  `user_purge_jobs`. PII redacted at export time via
  `public.purged_subject_redactions` so the hash chain stays intact.
  Decision matrix:
  [`docs/audit/2026-05-26-gdpr-purge-user-decision-matrix.md`](docs/audit/2026-05-26-gdpr-purge-user-decision-matrix.md).
- **Dormant-user review** — monthly cron snapshots
  `dormant_user_candidates` (users with no active org membership and
  >730 days of inactivity) into `public.dormant_user_reviews`.
  Non-destructive — operators decide case-by-case whether to enqueue
  a purge.
- **Org-retire purge** — feature-flagged behind `ORG_PURGE_ENABLED`.
  90-day grace period before hard delete.

### Observability

- **OpenTelemetry**: HTTP + undici auto-instrumentation; domain spans
  via [`lib/observability/with-span.ts`](lib/observability/with-span.ts)
  applied to audit-write + Rekor-anchor paths.
- **Server-side analytics**: PostHog capture at billing webhook +
  GDPR purge + audit-anchor paths. PII guard drops any payload field
  named like an identifier. See
  [`lib/analytics/posthog-server.ts`](lib/analytics/posthog-server.ts).
- **Public status page**: `/status` polls `/api/health` and surfaces
  the latest audit-chain anchor as platform integrity signal.
- **PagerDuty routing** — verified via
  [`scripts/verify-pagerduty-routing.mjs`](scripts/verify-pagerduty-routing.mjs)
  (fires an `info`-severity synthetic event + auto-resolves).

## Acknowledgements

We thank the following researchers for responsible disclosure.

_(No disclosures to date.)_
