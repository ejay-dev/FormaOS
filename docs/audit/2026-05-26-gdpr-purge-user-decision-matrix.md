# GDPR Right-to-Erasure — `purgeUser` decision matrix (DRAFT, needs sign-off)

**Status:** draft for review.
**Author:** Audit 2026-05-26 batch (P0-8).
**Outcome required:** for each row below, pick **DELETE**, **ANONYMIZE**, or **RETAIN** so the `purgeUser(userId)` implementation has a single source of truth.

## Why this is a decision and not just an implementation

GDPR Art. 17 requires erasure on request. The complication for FormaOS specifically:

1. **The audit chain is hash-linked.** Deleting a row breaks `verifyChainIntegrity`. The chain is also a compliance product feature — customer auditors trust it.
2. **Some retention is mandatory.** AU privacy + NDIS practice standards require certain records (incidents, evidence of compliance work) to be kept for years, regardless of subject erasure requests.
3. **A user is both a *subject* (PII) and an *actor* (foreign key)**. We have to scrub them as a subject without dangling refs as an actor.

The right answer for each table depends on whether the row's *value* is the user's PII (delete it), or whether the row's *existence* is independent compliance evidence (keep it, scrub the actor reference).

## Recommended defaults (your job: confirm or override)

Columns are: table → recommended action → why → fields touched (if anonymizing).

### Identity / auth tables — **DELETE** (subject's own row)

| Table | Recommended | Why |
|---|---|---|
| `auth.users` | **DELETE** (via `supabase.auth.admin.deleteUser`) | The login record IS the subject. Cascades to many child tables via existing FKs. |
| `public.user_security` | **DELETE** | TOTP secrets + backup-code hashes are the user's secrets. No retention value. |
| `public.user_preferences` | **DELETE** | Pure preference data. |
| `public.user_onboarding_state` | **DELETE** | Onboarding progress, no compliance value. |
| `public.user_sessions` | **DELETE** | Session history. |
| `public.user_session_revocations` (new) | **DELETE** | Watermark only useful while user exists. |
| `public.password_history` | **DELETE** | Salted hashes only, but tied to subject; no retention value. |
| `public.profiles` / `public.user_profiles` | **DELETE** | Name, email, avatar — pure PII. |

### Notification / preference tables — **DELETE**

| Table | Recommended | Why |
|---|---|---|
| `public.email_preferences` | **DELETE** | Preference rows. |
| `public.notification_preferences` | **DELETE** | Preference rows. |
| `public.notification_channels` | **DELETE** | User's webhook/email destinations. |
| `public.notification_digest_queue` | **DELETE** | Inbox. |
| `public.notification_digest_history` | **DELETE** | Inbox history. |
| `public.notifications` | **DELETE** rows where `user_id = $userId` | Personal inbox. |

### Personal credentials & integrations — **DELETE**

| Table | Recommended | Why |
|---|---|---|
| `public.api_keys` | **DELETE** rows where `user_id = $userId` | Key material is theirs. Also revoke at Stripe/etc. ⚠ if used. |
| `public.directory_sync_configs` (if user_id-scoped) | **DELETE** | Their config. |

### Activity / engagement — **DELETE** (rich PII, no compliance value)

| Table | Recommended | Why |
|---|---|---|
| `public.activity_feed` | **DELETE** rows where `user_id = $userId` | Engagement data, not compliance. |
| `public.user_activity` | **DELETE** | Route activity, not compliance audit. |
| `public.ai_chat_conversations` | **DELETE** rows where `user_id = $userId` | User's chat history. ⚠ may contain customer PHI — still safe to delete. |
| `public.ai_chat_messages` | **DELETE via cascade** | Cascade from conversations. |
| `public.dashboard_layouts` | **DELETE** | Personalisation. |
| `public.comment_reactions` | **DELETE** rows where `user_id = $userId` | Emoji reactions tagged to them. |

### Comments + content the user authored — **ANONYMIZE** (the content may matter to other parties)

| Table | Recommended | Why | Anonymize fields |
|---|---|---|---|
| `public.comments` | **ANONYMIZE** | Conversation threads other team members may still need to read. The comment text might be load-bearing for compliance investigation. | `user_id := NULL`, `mentions := []`. Leave `content` unless it contains PII about the subject (then scrub their name + email server-side). |
| `public.org_evidence.uploaded_by` (if FK) | **ANONYMIZE** | Evidence rows are compliance gold. Cannot be deleted. | `uploaded_by := NULL` |
| `public.org_policies.created_by` / `updated_by` | **ANONYMIZE** | Policy authorship. | `created_by := NULL`, `updated_by := NULL` |
| `public.org_tasks` assigned/created-by columns | **ANONYMIZE** | Task ownership has value to the team; the *person* is the only PII. | `assigned_to := NULL`, `created_by := NULL` |
| `public.org_care_plans`, `org_visits`, `org_staff_credentials` | **ANONYMIZE** | Care-ops history is regulator-relevant. Scrub actor refs only. | actor FK columns → `NULL` |
| `public.org_risks`, `org_assets`, `org_compliance_blocks` | **ANONYMIZE** | Same pattern. | actor FK columns → `NULL` |

### Audit / immutable / regulator-facing — **RETAIN AS-IS** (do NOT touch)

| Table | Recommended | Why |
|---|---|---|
| `public.audit_log` (hash-chained) | **RETAIN** | Mutating any row breaks the chain. Subject-name PII inside `details` JSON should be redacted at *export time*, not at-rest. |
| `public.org_audit_logs`, `public.org_audit_log` | **RETAIN** | Same — compliance evidence. |
| `public.admin_audit_log` | **RETAIN** | Platform-side admin actions. SOX/SOC2 retention. |
| `public.security_audit_log` | **RETAIN** | Breach evidence. Required for any post-incident investigation. |
| `public.identity_audit_events` | **RETAIN** | Sign-in/sign-out trail — needed for investigation. |
| `public.rate_limit_log` | **RETAIN** (or short-window delete) | Abuse-pattern signal. |

The "right to be forgotten" still applies to these *outputs* — the legal path is: keep the hash-chained record, but redact the subject's name/email from any **exported** copy at export time. That's a separate function on the export side, not a delete on the storage side.

### Billing / contractual — **RETAIN** (legal obligation)

| Table | Recommended | Why |
|---|---|---|
| `public.org_subscriptions` | **N/A** (org-owned, not user-owned). | — |
| `public.billing_events`, `billing_reconciliation_log` | **RETAIN** | Stripe-side reconciliation + AU tax records. |

### Membership / org relationships — **DELETE**

| Table | Recommended | Why |
|---|---|---|
| `public.org_members` | **DELETE** | The subject's membership is theirs. (This is what SCIM already does.) |
| `public.memberships` (legacy) | **DELETE** | Same. |
| `public.scim_group_links` (if `user_id`) | **DELETE** | Their group bindings. |

### SCIM / SSO state — **DELETE** with caveat

| Table | Recommended | Why |
|---|---|---|
| `public.scim_*` user-bound rows | **DELETE** | Their provisioning state. ⚠ flag to the customer's SCIM client that the user was hard-removed so the IdP isn't surprised. |
| Stripe customer record | **N/A** at user level (orgs own them) | If user IS the org owner and the org is being retired, that's the P0-9 org-retire flow. |

---

## Decisions you actually need to make

These are the rows above where I am NOT confident the default is right. Please pick:

### Q1. Comments authored by the user
- **A. ANONYMIZE** (recommended): keep `content`, null `user_id`, null mentions. Team conversations stay readable.
- **B. DELETE**: remove the row entirely. Threads become disjoint ("Reply to deleted message").
- **C. DELETE if mentioned PII otherwise ANONYMIZE**: server-side detection of subject's own name/email in content + scrub. Complex.

### Q2. AI chat conversations
- **A. DELETE** (recommended): conversations are personal, no compliance value.
- **B. ANONYMIZE**: keep training-signal value. Risk: chat content can include customer PHI.

### Q3. `auth.users` row itself
- **A. Hard `auth.admin.deleteUser`** (recommended): cleanest. Cascades to FKs we control.
- **B. Soft delete (ban + email/PII scrubbed)**: keeps the UUID alive for any orphan refs we missed.

### Q4. Audit-chain redaction
- **A. RETAIN row, redact subject PII at *export* time** (recommended): preserves chain integrity, satisfies GDPR for any copy that leaves the system.
- **B. Redact in-place**: breaks the hash chain. Requires re-signing — which destroys the tamper-evident property the chain is sold on.

### Q5. Workflow for a user who is also the **sole owner** of an org
- We should refuse the purge and require explicit ownership transfer first (else the org becomes orphaned).
- Confirm? (Recommended: refuse with HTTP 409 + suggested next step.)

### Q6. SLA for purge completion
- AU Privacy Act guidance is "as soon as reasonably practicable". Stripe / Supabase deletion cascades may need a queued job. Recommended: complete within **30 days** of request, with progress visible on an `user_purge_jobs` table.

---

## What `purgeUser` will actually do once Q1–Q6 are answered

Pseudocode (intentionally outline-only — the real code lands once you sign off on Q1–Q5):

```
purgeUser(userId, { reason, requestedBy, requestSource }):
  1. Refuse if user is sole owner of any active organization (Q5).
  2. Insert user_purge_jobs row { user_id, status='running', requested_at }.
  3. For each table in the DELETE list above:
       DELETE FROM <table> WHERE user_id = userId
  4. For each table in the ANONYMIZE list:
       UPDATE <table> SET <actor_fk> = NULL WHERE <actor_fk> = userId
       (and for comments per Q1, optionally content-scrub)
  5. revokeAllSessions(userId)         -- so any cached JWT can't act post-purge
  6. supabase.auth.admin.deleteUser(userId)  -- per Q3
  7. Insert audit row: action='gdpr_user_purge', target_id=userId, metadata={
       request_source, requested_by, deleted_table_counts, anonymized_table_counts
     }
  8. Mark user_purge_jobs row status='completed'.

If any step fails, mark status='partial' and surface the failed table in
metadata so ops can manually finish. Do not silently swallow.
```

## What I need from you to ship this

1. Sign off on the recommended defaults (or override per-row).
2. Answer Q1–Q6.
3. Confirm the SLA in Q6 (impacts whether this is sync or queued).

Once those are in, the implementation is straightforward and I can ship it in one PR alongside an admin endpoint `POST /api/admin/users/[userId]/gdpr-purge` (approval-gated, reason-required, mirrors the session-revoke endpoint shape).

## What I deliberately did NOT decide here

- **Whether to surface a self-service "delete my account" button to end users.** Right now this is admin-mediated only. A self-service flow has different consent + cooling-off requirements (and probably needs legal review for AU specifically).
- **The export side.** GDPR Art. 15 (right of access) is the export-everything-I-have flow. Reusing the enterprise-export pipeline for user-scoped exports is feasible but separate work.
- **Backups / point-in-time-restore.** Supabase keeps PITR backups. A formal "delete from backups too" workflow is a Supabase-support ticket per request, not code.
