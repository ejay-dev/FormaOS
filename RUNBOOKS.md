# FormaOS — Production Runbooks

Operator-facing playbooks for production incidents. Each entry assumes the on-call has access to Vercel logs, Sentry, Supabase SQL Editor, the Stripe Dashboard, and a checkout of this repo.

For severity classification and rotation, see `ONCALL.md`. For coordinated disclosure of security defects, see `SECURITY.md`.

---

## 1. Stripe webhook failure

**Surface:** `app/api/billing/webhook/route.ts` (idempotency state machine in `billing_events`), `lib/billing/entitlement-drift-detector.ts`, `lib/billing/entitlements.ts`.

**Detection.**
- Sentry alert `billing-webhook-error-spike` (route `/api/billing/webhook`, see `sentry/alerts.yaml`).
- Stripe Dashboard → Developers → Webhooks → endpoint shows non-2xx > 0 for the last hour.
- `billingLogger.error("stripe_webhook_*", ...)` lines in Vercel logs (filter `domain=billing`).
- `entitlement_drift_fixed` / `drift_scan_failed` log lines on the nightly reconciliation job.

**Immediate triage (10 min).**
1. Open Sentry issue, capture the Stripe `event.id` and `event.type` from breadcrumbs.
2. In Supabase: `select id, event_type, status, attempts, error_message from billing_events where id = '<event.id>'`. Status `failed` with `attempts > 1` means Stripe is actively retrying.
3. If signature mismatch: confirm `STRIPE_WEBHOOK_SECRET` in Vercel prod env matches the webhook endpoint signing secret in the Stripe Dashboard. Rotation drift is the most common cause.
4. If idempotency loss: query `select count(*) from billing_events where status = 'pending' and started_at < now() - interval '5 min'` — non-zero means a previous attempt crashed mid-side-effect.

**Mitigation.**
- **Signature mismatch:** Re-copy signing secret from Stripe → Vercel env → redeploy. Then in Stripe Dashboard, resend failed events.
- **Idempotency stuck pending:** `update billing_events set status = 'failed' where id = '<event.id>'` and let Stripe's next retry reclaim it (the state machine in `route.ts` will re-run side effects).
- **Drift detection firing:** Run `await detectAndCorrectDrift(orgId, { autoFix: true })` from a server action in admin, or manually replay the missed `customer.subscription.updated` event from Stripe.
- **Stripe API outage:** stop replays, post to status, wait for Stripe; webhook retries (up to 3 days) will catch up.

**Post-incident.**
- Add the failing `event.type` to the test fixtures in `__tests__/billing/`.
- Update `STRIPE-WEBHOOK-GUIDE.md` if a new failure mode emerged.
- File `BLOCKER_FOLLOWUPS.md` entry if root cause was missing observability.

---

## 2. RLS regression (audit trail tampering, cross-tenant exposure)

**Surface:** Supabase RLS policies on `org_*` tables; `lib/audit/org-audit-log.ts`; `lib/audit/hash-utils.ts` (audit hash chain).

**Detection.**
- Sentry alert `cross-org-audit-event` triggered by any log line containing `cross_org_*` from `rbacLogger` (`lib/observability/structured-logger.ts:208`).
- `lib/audit/hash-utils.ts` chain verification fails — surfaces as `audit_chain_break` in `org_audit_log` evaluation.
- User report or support ticket referencing data from a different organisation.

**Immediate triage (10 min).**
1. **Halt risk:** flip the `enterprise_read_only` feature flag (admin → feature flags) to freeze writes while investigating.
2. Identify affected orgs: `select distinct org_id from org_audit_log where created_at > now() - interval '1 hour' and action like 'cross_org_%'`.
3. Identify the offending RLS migration or auth path. Recent RLS migrations live in `supabase/migrations/*_rls*.sql` — check the most recent migration timestamp.
4. Confirm `auth.uid()` matches `organization_members.user_id` for the suspect query — most cross-tenant leaks come from service-role-key usage where row-level filter was omitted.

**Mitigation.**
- **RLS policy gap:** write a forward-only migration restoring the policy (do not rollback — keep the audit trail). Example: `alter policy "<name>" on <table> using (org_id = current_setting('app.current_org_id')::uuid);`.
- **Service-role bypass:** audit `createSupabaseAdminClient()` call sites for missing `org_id` filter. Files of interest: `lib/supabase/admin.ts`, anything calling `.from('org_*')`.
- **Audit hash chain break:** snapshot the affected rows, then re-seal from the last verified hash; never silently re-link.
- Notify affected orgs per privacy disclosure obligations (Privacy Act / GDPR Art. 33–34).

**Post-incident.**
- Add a Jest test in `__tests__/integration/rls/` reproducing the leak.
- Add a Sentry alert filter for the new `cross_org_*` action variant if newly introduced.
- File a CAPA in `lib/automation/templates/audit-preparation.ts`.

---

## 3. Cron stalls (compliance-check, scheduled-reports, exports)

**Surface:** `app/api/cron/{compliance-check,scheduled-reports,report-exports,compliance-exports,enterprise-exports,security-retention}/route.ts`; schedule defined in `vercel.json`.

**Detection.**
- Sentry alert `cron-error-rate` (>5% over 10 min on `/api/cron/*`).
- Vercel → Crons tab shows last execution >2× the schedule interval.
- Downstream signal: `compliance_score_snapshots` row count flatlines (no new daily snapshot).

**Immediate triage (10 min).**
1. Vercel → Deployments → Functions → filter `path:/api/cron/`. Check error rate and `maxDuration` exhaustion (current cap is `60` for crons, `vercel.json` line 28).
2. Confirm `CRON_SECRET` env is set in prod. The handlers use `timingSafeEqual` and return 500 if unset (see `app/api/cron/compliance-check/route.ts:21`).
3. Check Supabase connection pool — long-running cron + new request can exhaust pooler.

**Mitigation.**
- **Timeout exhaustion:** chunk the workload. `runDueScheduledReports` and `detectDriftForAllOrgs` already paginate — verify the page size; reduce if needed.
- **Auth failure:** rotate `CRON_SECRET` in Vercel env, redeploy; the secret must match the `Authorization: Bearer` header Vercel injects.
- **Manual restart:** trigger an immediate run with `curl -X GET https://app.formaos.com.au/api/cron/<job> -H "Authorization: Bearer $CRON_SECRET"`.
- **Persistent failure:** disable the cron in `vercel.json` and ship a hotfix; downgrade to manual operator-triggered run until fix lands.

**Post-incident.**
- Add a Sentry transaction breadcrumb for the chunk boundary so the next stall is observable.
- Backfill missed `compliance_score_snapshots` rows via `lib/compliance/snapshot-service.ts` admin tool.

---

## 4. MFA / auth incident

**Surface:** `lib/auth/mfa-gate.ts`, `lib/auth/mfa-audit.ts`, MFA backup-code hashing in `mfa_backup_codes` table.

**Detection.**
- Sentry alert `auth-failures-spike` (matches `Unauthorized|auth|session` > 20 in 10 min).
- `mfa_audit_events` shows high `mfa_verification_failed` rate from one IP or one user.
- `mfa_backup_code_used` event from a user who has not signed in recently (possible exfil).

**Immediate triage (10 min).**
1. Identify the affected account: `select user_id, count(*) from mfa_audit_events where event = 'mfa_verification_failed' and created_at > now() - interval '15 min' group by user_id order by count desc limit 10`.
2. If >50 failures from one IP across multiple users → distributed brute force. Rate limiter is at `lib/rate-limit/`. Confirm Upstash Redis is healthy.
3. If `mfa_backup_code_used` for a target account → assume the backup-code list was exfiltrated; codes are hashed at rest but plaintext was emailed once at issuance.

**Mitigation.**
- **Brute force:** in admin, lock the targeted account(s). Block the source IP in Vercel firewall.
- **Backup-code exfil:** revoke all unused codes for the user: `update mfa_backup_codes set used_at = now(), revoked = true where user_id = '<id>' and used_at is null`. Force re-enrolment via `lib/auth/mfa-gate.ts` — set `mfa_enrolled_at = null`.
- **TOTP secret leak suspected:** rotate the user's TOTP — admin tool clears `mfa_secret_encrypted`, user re-enrols on next login.
- **Force session revocation:** see "common manual interventions" in `ONCALL.md`.

**Post-incident.**
- Send the affected user a security notification email (template in `emails/security-incident-notification.tsx` — add if missing).
- Add IP / user-agent to a denylist if pattern persistent.
- Review whether MFA enrolment rate needs a forcing function (per audit-001 follow-up).

---

## 5. Billing / dunning failure

**Surface:** `lib/email/billing-emails.ts` (`sendBillingEmail`), `lib/billing/grace-period.ts`, `lib/billing/nightly-reconciliation.ts`.

**Detection.**
- Sentry alert `billing-email-crash` (any thrown error from `sendBillingEmail`).
- Stripe Dashboard → Disputes / Failed Payments rising while no dunning emails sent in the last 24h.
- `billing_events` shows `invoice.payment_failed` succeeded webhook but no row in `email_log` for that org.

**Immediate triage (10 min).**
1. Confirm Resend / email provider API is up (status page).
2. Pull recent crashes: filter Sentry for `sendBillingEmail` in the title.
3. Check `lib/email/billing-emails.ts` for a recent template change that may have thrown on null org name or null user name (most common cause).

**Mitigation.**
- **Template crash:** ship a hotfix that defaults null fields (`org?.name ?? 'your organisation'`).
- **Provider outage:** queue failed sends — see `lib/email/queue.ts` if present, otherwise log a manual list of affected orgs and replay once provider is back.
- **Stripe API outage:** dunning will catch up on Stripe's next retry; no client action required.
- **Manual replay:** call `sendBillingEmail({orgId, type: 'payment_failed', ...})` from an admin server action for each affected org.

**Post-incident.**
- Add a smoke test in `__tests__/email/` for every template using a fixture org with missing optional fields.
- Verify `email_log` rows match `billing_events` of types `invoice.payment_failed`, `invoice.payment_action_required` for the last 24h.

---

## 6. Multi-tenant data isolation breach

**Surface:** Any Supabase table prefixed `org_*`; service-role-key usage in server actions; the audit hash chain.

**Detection.**
- Same as runbook 2, but breach has already been confirmed (data flowed out, not just a near-miss).
- Customer report with screenshot showing another org's data.
- External audit (security researcher, SOC 2 auditor) flags cross-tenant access.

**Immediate triage (10 min).**
1. **Containment first:** flip `enterprise_read_only` flag globally to freeze all writes. Use admin tools (`app/admin/feature-flags/`).
2. Identify scope of exposure: which orgs read which other orgs' data, over what window. Query `org_audit_log` and `org_access_log`.
3. Snapshot the database (Supabase → Backups → Manual snapshot) before any remediation that mutates rows.

**Mitigation.**
- Patch the RLS / service-role bypass (see runbook 2).
- For data already disclosed, the breach cannot be undone — the response is legal/disclosure, not technical.
- Initiate the breach-notification workflow: legal counsel, affected-tenant comms, regulator notification (OAIC for AU customers within 72h if eligible data breach).

**Post-incident.**
- Full incident report per `ONCALL.md` postmortem template.
- Add automated RLS regression coverage in `__tests__/integration/rls/`.
- Consider whether this triggers SOC 2 control deficiency reporting.

---

## 7. Compliance score corruption

**Surface:** `org_control_evaluations`, `compliance_score_snapshots`; `lib/compliance/snapshot-service.ts`; daily cron at `/api/cron/compliance-check`.

**Detection.**
- Dashboard shows scores moving by >20 points overnight for orgs with no control changes.
- Sentry alert `compliance-engine-error` (matches `compliance|framework|control|evaluation` > 5 / 10min).
- Operator notices `compliance_score_snapshots` count mismatched vs `org_control_evaluations` distinct org count.

**Immediate triage (10 min).**
1. Run `select org_id, max(captured_at), count(*) from compliance_score_snapshots group by org_id order by max(captured_at) desc limit 20` — confirm last snapshot timestamp per org.
2. Compare against `org_control_evaluations` row counts for the same window. A 0-row snapshot for an org with 100+ evaluations is the smoking gun.
3. Check whether a framework pack migration (in `framework-packs/`) added or removed controls, which legitimately moves the score.

**Mitigation.**
- **Stale snapshot:** trigger a recompute: `await rebuildComplianceScore(orgId)` from `lib/compliance/snapshot-service.ts` via an admin server action.
- **Score formula regression:** check git log on `lib/compliance/scoring.ts` (or equivalent); revert if a recent commit changed the formula without migration.
- **Framework pack mismatch:** if a control was removed, write a forward migration that marks the row historical instead of deleting.

**Post-incident.**
- Add a daily monitoring query that surfaces orgs with score deltas > 20 points day-over-day for operator review.
- Document the score formula in `docs/compliance/scoring.md` (create if missing).

---

## 8. SAML SSO failure

**Surface:** SSO configuration tables (`organization_sso`), Supabase Auth SAML provider, IdP metadata refresh.

**Detection.**
- Customer reports SSO users cannot sign in.
- Sentry shows a spike of `SAMLSignatureInvalid` or `SAMLResponseInvalid` errors.
- IdP certificate `not_after` date is in the past (operators should track this in calendar; nightly cron could warn).

**Immediate triage (10 min).**
1. In Supabase Auth → Providers → SAML, confirm the affected org's SSO entry is enabled and `idp_metadata_url` resolves.
2. Pull the IdP cert: `openssl s_client -connect <idp-host>:443 | openssl x509 -noout -dates`. Confirm `notAfter` is in the future.
3. Check `organization_sso.last_successful_login` — if recent, the IdP changed something. If old, customer-side misconfiguration is likely.

**Mitigation.**
- **Cert expired on IdP side:** request fresh metadata URL from customer; update via admin SSO console.
- **Signature validation failure:** confirm the IdP signs with the expected algorithm (RS256 or SHA-256). If they rotated keys, refresh metadata.
- **Customer locked out:** issue a one-time bypass — admin can issue a magic-link sign-in for an org admin to recover the org, then have them update SSO.
- **Audit log:** every SSO failure should land in `org_audit_log` with action `sso_login_failed` — confirm before closing.

**Post-incident.**
- Add the IdP cert expiry to the daily compliance-check cron's warning surface.
- Document the customer-specific quirk (Okta vs Azure AD vs OneLogin) in `docs/sso/<vendor>.md` if not already present.

---

## 9. Provisioning a Vercel log drain (TODO — operator action)

**Why this matters.** Vercel function logs roll off in 1–24 hours depending on plan. When a cron silently fails at 2 AM and we discover it at 9 AM the next day, the failure log is gone and we lose root-cause signal. A log drain ships every log line to a long-term store (Axiom, Datadog, BetterStack/Logtail) where we can grep weeks back.

**This cannot be configured via `vercel.json`** — Vercel only supports log drains via the dashboard or API token. Steps:

1. **Pick a provider.** Recommended in order of fit:
   - **Axiom** — generous free tier (0.5 GB/day), Vercel-native integration, good for our volume.
   - **BetterStack / Logtail** — solid alternative; cheap paid plans.
   - **Datadog** — only if you're already paying for it; overkill for log-drain only.
2. **Provider side.** Create an org, generate an ingest token (Axiom: `Settings → API tokens → Create ingest token`). Copy token + ingest URL.
3. **Vercel side.** Dashboard → Project → Settings → Log Drains → Add. Paste URL, select `json` format, scope to `production` (or all environments). Vercel signs requests so the receiver can verify.
4. **Verify.** Trigger a known log line (e.g. a 4xx on `/api/health?force=400`), wait ~30s, search receiver for the request id.
5. **Document.** Add provider + token rotation date to `docs/ops/credentials-rotation.md`.

**Smoke test for drift.** Once a quarter, run a manual cron with `?probe=1`, then confirm the entry appears in the log store within 5 minutes. If not: drain has detached, re-add it.
