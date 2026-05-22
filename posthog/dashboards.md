# FormaOS — PostHog Dashboards (source of truth)

PostHog does not auto-ingest this file. It documents the dashboards, cohorts, and funnels that should exist in the PostHog project, and the events they require. When you create or modify a dashboard, update this file in the same PR.

The PostHog browser SDK is loaded via `lib/monitoring/analytics.ts`; server-side capture goes through `lib/analytics/activation-telemetry.ts`. Cross-reference for event firing status is the **obs-003** follow-up in `BLOCKER_FOLLOWUPS.md` — most product events are not yet wired.

**Legend:**
- _Status_ `live` — event already fires in the deployed code.
- _Status_ `partial` — fires in some code paths only; gap noted.
- _Status_ `missing` — needs to be added; the dashboard cannot populate until it is.

---

## Dashboard 1 — Activation Funnel

**Question:** How many new orgs reach "evidence uploaded" within their first 7 days?

**Chart type:** Funnel, ordered, 7-day conversion window.

**Steps:**

| # | Event                         | Properties needed                        | Status   | Where it should fire |
| - | ----------------------------- | ---------------------------------------- | -------- | -------------------- |
| 1 | `signup_completed`            | `user_id`, `signup_source`               | missing  | `app/auth/callback/route.ts` after first successful `auth.users` insert |
| 2 | `org_bootstrap_completed`     | `org_id`, `industry`, `team_size`        | partial  | `app/onboarding/page.tsx` — emits `onboarding_completed` today; needs explicit `org_bootstrap_completed` |
| 3 | `framework_enabled`           | `org_id`, `framework`                    | live     | `lib/analytics/activation-telemetry.ts` (`trackActivation('framework_enabled', ...)`) |
| 4 | `first_task_completed`        | `org_id`, `task_type`                    | missing  | server action that closes the first task — add `trackActivation('first_task_created', ...)` site already exists, but "completed" variant missing |
| 5 | `first_evidence_uploaded`     | `org_id`, `evidence_type`                | partial  | `first_evidence_mapped` fires today (`activation-telemetry.ts:27`) — confirm it maps 1:1 to "uploaded" or split into two events |

**Cohort filters:** orgs with `created_at >= now() - 30d`, exclude internal orgs where `org.name` matches `^FormaOS` or org_id is in the FOUNDER_EMAILS-owned set.

**Why it matters:** This is the headline activation metric for board / investor updates. The drop-off step is the next product priority.

---

## Dashboard 2 — Revenue Funnel

**Question:** Of users who view pricing, how many subscribe and stay paying after 30 days?

**Chart type:** Funnel, ordered, 30-day window for steps 1–3, then a 30-day retention chart anchored on step 3.

**Steps:**

| # | Event                       | Properties needed                                | Status  | Where it should fire |
| - | --------------------------- | ------------------------------------------------ | ------- | -------------------- |
| 1 | `pricing_page_view`         | `plan_visible`, `utm_source`, `referrer`         | missing | `app/(marketing)/pricing/page.tsx` — call `posthog.capture('pricing_page_view', ...)` on mount |
| 2 | `checkout_started`          | `plan_key`, `billing_cycle`, `org_id`            | missing | `lib/billing/checkout-intent.ts` — wrap the redirect with a `posthog.capture` |
| 3 | `subscription_created`      | `plan_key`, `mrr_cents`, `org_id`                | partial | `app/api/billing/webhook/route.ts:367` fires `sendBillingEmail('subscription_created')` but does not capture to PostHog — add a `serverCapture('subscription_created', ...)` alongside |
| 4 | `subscription_still_active_30d` | derived cohort, not a discrete event           | live    | derive in PostHog from `subscription_created` minus `subscription_cancelled` after 30 days |

**Cohort filters:** exclude test mode (`stripe_event.livemode = false`), exclude internal orgs.

**Why it matters:** Revenue funnel is the operator's single most important steering signal. Currently we read it from Stripe Dashboard only — PostHog adds the marketing-attribution context Stripe lacks.

---

## Dashboard 3 — MFA Enrolment Rate

**Question:** What share of active users have MFA enrolled, segmented by role?

**Chart type:** Time-series percentage, daily, with a breakdown by `role` (`owner`, `admin`, `member`).

**Source:** Direct query against Supabase (PostHog "SQL insight") rather than events:

```sql
select
  date_trunc('day', om.created_at) as day,
  om.role,
  count(distinct om.user_id) filter (where ums.mfa_enrolled_at is not null)::float
    / nullif(count(distinct om.user_id), 0) as mfa_enrolment_rate
from organization_members om
left join user_mfa_settings ums on ums.user_id = om.user_id
group by 1, 2
order by 1 desc;
```

**Status:** `live` — both tables exist; no event work needed.

**Alert:** drop below 80% for `role = 'owner'` should notify #security. (audit-001 follow-up.)

**Why it matters:** audit-001 flagged low MFA enrolment as a top trust risk for SOC 2 / ISO 27001 prep.

---

## Dashboard 4 — Compliance Score Distribution

**Question:** Across paying orgs, what does the compliance-score distribution look like, and is it improving over time?

**Chart type:** Histogram bucketed by 10-point bands, with a secondary time-series of the median score.

**Source:** Direct query (PostHog SQL insight) against `compliance_score_snapshots`:

```sql
select
  snapshot_date,
  framework,
  width_bucket(compliance_score, 0, 100, 10) * 10 as score_band,
  count(distinct organization_id) as org_count
from compliance_score_snapshots
where snapshot_date > now() - interval '90 days'
group by 1, 2, 3
order by 1 desc;
```

**Status:** `live` — `lib/compliance/snapshot-service.ts` populates this nightly via the `/api/cron/compliance-check` job. (compliance-002 follow-up.)

**Why it matters:** compliance-002 asked for visibility into how customers are actually scoring. Drives product priorities (which controls need more guidance, which frameworks have low-scoring orgs).

---

## Additional Events Already Firing (no dashboard yet — candidates)

These fire today but no dashboard surfaces them. Consider promoting to a dashboard when product priority warrants it.

| Event                  | Source                                       | Suggested dashboard |
| ---------------------- | -------------------------------------------- | ------------------- |
| `performance_metric`   | `lib/monitoring/performance.ts:299`          | Web vitals trend    |
| `error_occurred`       | `lib/monitoring/errors.ts:337`               | Cross-reference with Sentry |
| `page_view`            | `lib/monitoring/analytics.ts:222`            | Marketing site traffic |
| `onboarding_step_completed` | `lib/analytics/activation-telemetry.ts` | Activation step-time breakdown |
| `first_report_generated` | `lib/analytics/activation-telemetry.ts`    | Activation depth |

---

## Server-Side Capture Gap

Most missing events above are server-side (post-checkout, webhook-triggered). PostHog server capture is **not currently wired**. To unblock dashboards 1 and 2:

1. Add `posthog-node` to dependencies.
2. Initialise in a singleton: `lib/analytics/posthog-server.ts` exporting `serverCapture(event, distinctId, properties)`.
3. Call from the webhook handler and from server actions noted above.

This is captured as **obs-003** in `BLOCKER_FOLLOWUPS.md` and is the prerequisite for dashboards 1 and 2 to populate.
