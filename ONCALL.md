# FormaOS — On-Call

This document defines the on-call posture for FormaOS production. Pair it with `RUNBOOKS.md` (per-incident playbooks) and `SECURITY.md` (vulnerability handling).

## Current Rotation

FormaOS is operated by a **solo founder** today. The identity is configured via the `FOUNDER_EMAILS` environment variable (see `lib/env-validation.ts:35`), and only addresses in that list have founder/admin scope.

- Primary on-call: every founder in `FOUNDER_EMAILS`, 24×7.
- Secondary / backup: none.
- Coverage gaps (sleep, travel) are accepted business risk; severity-P0 detection depends on push notifications from the alerting stack reaching the founder's phone.

**Rotation framework for when the team grows (2+ engineers):**

- Weekly rotation, handover every Monday 09:00 AEST.
- Primary holds the pager; secondary is the named escalation if primary does not acknowledge within 15 min for P0, 30 min for P1.
- New joiners shadow for 2 full rotations before holding primary.
- Holiday and conference coverage is swapped explicitly in writing — no implicit "I'll cover".

## Severity Classification

We mirror the audit-report severity bands. Use this to decide who pages whom and how fast.

| Severity | Definition                                                                                  | Response SLA | Channels                |
| -------- | ------------------------------------------------------------------------------------------- | ------------ | ----------------------- |
| **P0**   | Customer data exposed, billing broken, signups broken, or production fully down.            | Page now. Acknowledge in 15 min, mitigate in 60 min. | Pager + Slack #incidents + email |
| **P1**   | One critical surface degraded (e.g. cron stalled, SSO failing for one customer, dunning email broken). Money or trust is at risk within a day. | Acknowledge in 30 min, mitigate in 4 h. | Slack #incidents + email |
| **P2**   | Bug affecting a subset of users with a workaround, perf regression, or new error class with low rate. | Triage next business day. | Slack #engineering |
| **P3**   | Operational hygiene: quota near limit, dependency EOL warning, doc gap. | Track on backlog. | Slack #engineering |

P0 and P1 always produce a postmortem (see template below). P2 produces a postmortem only when it recurs.

## Escalation Paths

1. **Primary on-call** is paged by the alert.
2. If unacknowledged after the SLA above, the secondary is paged.
3. If secondary is also unreachable, the system pages **all** members of `FOUNDER_EMAILS`.
4. For P0 events involving customer data exposure, legal counsel is informed in parallel (out-of-band channel; not the same Slack workspace).
5. For payments or fraud events, Stripe support is engaged in parallel via Stripe Dashboard → Support → Chat.

## On-Call Tooling

| Tool / capability        | Status                                                          |
| ------------------------ | --------------------------------------------------------------- |
| Error tracking           | Sentry (project: `formaos` — confirm in `SENTRY_PROJECT` env)   |
| Product analytics        | PostHog (project key in `NEXT_PUBLIC_POSTHOG_KEY`)              |
| Logs                     | Vercel function logs; structured via `lib/observability/structured-logger.ts` |
| Database                 | Supabase Dashboard → SQL Editor; service-role key in 1Password   |
| Payments                 | Stripe Dashboard (live mode)                                    |
| Cron orchestration       | Vercel → Crons tab (config in `vercel.json`)                    |
| Synthetic checks         | **TBD** — `docs/monitoring/synthetic-checks.md` lists candidates (Checkly / Better Stack), nothing provisioned yet. **Gap.** |
| Paging                   | **TBD** — no PagerDuty / Pushover / SMS integration is wired up today. Currently relies on Sentry → email + push from the Sentry mobile app. **Gap — needs SMS for true P0 wake-up.** |
| Chat                     | Slack workspace (channels referenced in `sentry/alerts.yaml`). **TBD — channels need to be created if they do not exist.** |
| Status page              | **TBD** — no public status page exists. Customers learn of outages via email or in-app banner. **Gap.** |

## Common Manual Interventions

These are the operator actions that come up most often. Each links to its detailed runbook.

### Restart / replay a stalled cron

```bash
curl -X POST https://app.formaos.com.au/api/cron/<job-name> \
  -H "Authorization: Bearer $CRON_SECRET"
```

Jobs live in `app/api/cron/*`; schedule in `vercel.json`. See RUNBOOKS §3.

### Force-rotate session tokens for an org

```sql
-- Invalidates all active sessions for users in one organisation.
update auth.sessions
   set not_after = now()
 where user_id in (
   select user_id from organization_members where organization_id = '<org_id>'
);
```

Use when an account compromise is suspected. Customers will be forced to sign in again.

### Lock an organisation (freeze writes)

```sql
update organizations set status = 'locked' where id = '<org_id>';
```

The write-path guards in `lib/onboarding/rbac-utils.ts` and admin server actions check this flag. Pair with an in-app banner explaining the freeze.

### Replay a Stripe webhook

In Stripe Dashboard → Developers → Events → select event → "Send to webhook". Idempotency in `app/api/billing/webhook/route.ts` is safe to re-run; succeeded events are no-ops. See RUNBOOKS §1.

### Block an IP at the edge

In Vercel → Project → Firewall → add a custom rule. For rate-limit bypass at the app level, the Upstash Redis-backed limiter is in `lib/rate-limit/`.

### Force MFA re-enrolment for a user

```sql
update user_mfa_settings set mfa_enrolled_at = null, mfa_secret_encrypted = null where user_id = '<id>';
update mfa_backup_codes set used_at = now(), revoked = true where user_id = '<id>' and used_at is null;
```

See RUNBOOKS §4.

## Postmortem Template

Every P0 or P1 incident produces a postmortem within 5 business days, filed in `docs/operations/postmortems/<YYYY-MM-DD>-<short-slug>.md`.

```markdown
# Postmortem: <short title>

- **Date:** YYYY-MM-DD
- **Severity:** P0 / P1 / P2
- **Duration:** detected at HH:MM, mitigated at HH:MM, resolved at HH:MM (UTC)
- **Author:** <name>
- **Status:** draft / reviewed / closed

## Summary

One paragraph: what broke, who noticed, who was affected, how it was fixed.

## Timeline

UTC times, bullets:

- HH:MM — first symptom
- HH:MM — alert fired
- HH:MM — acknowledged
- HH:MM — mitigation deployed
- HH:MM — confirmed resolved

## Impact

- Customers affected: <count or list>
- Data exposed: <yes/no, scope>
- Revenue impact: <est $ if known>
- SLA breach: <yes/no, against what target>

## Root Cause

What actually went wrong, with file paths and commit SHAs. Avoid blame; describe the system as found.

## What Went Well

- 2–3 things that worked: fast detection, good runbook, etc.

## What Went Poorly

- 2–3 things that should have been better. No names; focus on the system.

## Action Items

| # | Action | Owner | Severity | Due |
| - | ------ | ----- | -------- | --- |
| 1 | ...    | ...   | P1       | YYYY-MM-DD |

Each action item must have a Linear/GitHub issue.

## Lessons

What we now know that we did not know before.
```
