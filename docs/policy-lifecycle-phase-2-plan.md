# Policy Lifecycle — Phase 2 Plan

Phase 1 (commit `e8ec2182`) wired the basic submit / approve / reject loop on `policy_versions` + `policy_approvals`. Phase 2 covers the still-empty surfaces that the migration `20260403_policy_lifecycle.sql` already created tables for, plus a couple of UX improvements that came up while shipping Phase 1.

Estimated effort: **1-2 weeks of focused work**.

---

## Scope

In:
1. **Acknowledgments** (`policy_acknowledgments` table). Staff click "I have read and understood this policy" on a published version; the click is recorded with a unique `(policy_version_id, user_id)` constraint. Dashboard shows ack rate per policy.
2. **Multi-approver quorum**. Replace Phase 1's single-approver semantics with explicit reviewer assignment + a configurable quorum (e.g., "needs 2 of 3 approvers" before status flips to `approved`).
3. **Reviewer pre-assignment UI**. When the author submits for review, they pick approvers from a list of org members with role=`owner`/`admin`/`compliance_officer`. Pre-assigned approvers see a queue at `/app/policies?awaiting=me`.
4. **Version-history page upgrade**. `/app/policies/[id]/versions` already exists but reads only `org_policies`. Switch to reading `policy_versions` ordered by `version_number DESC`, with approval comments alongside each version.
5. **Approver notification** (Resend email + in-app notification) when a policy enters `pending_approval`.

Out (deferred to Phase 3):
- Periodic-review cron (`policy_review_schedules` cadence enforcement, due-date reminders).
- Policy comparison UI (diff between version N and N-1).
- Template policies / policy library.

---

## Detailed work breakdown

### 1. Acknowledgments

**Schema** — already exists (`policy_acknowledgments`, `UNIQUE(policy_version_id, user_id)`).

**Server actions** (`app/app/actions/policies.ts`):
- `acknowledgePolicy(formData)`: insert into `policy_acknowledgments` with the current published version's id and `auth.uid()`. Idempotent — duplicate-key returns success. Audit event `POLICY_ACKNOWLEDGED`.
- `getAcknowledgmentSummary(policyId)`: returns `{ totalRequired, totalAcknowledged, percentAcknowledged, latestAck }` for the current published version. Counts org members of role staff+ minus those already in `policy_acknowledgments`.

**UI**:
- `/app/policies/[id]` for non-admin readers shows an "Acknowledge this policy" form when there's a published version and the user hasn't already acknowledged.
- New page `/app/policies/[id]/acknowledgments` (admin-only) lists who has and hasn't acknowledged the latest published version. CSV export.

**Estimated**: 2-3 days.

### 2. Multi-approver quorum

**Schema additions** (new migration, e.g., `20260520_001_policy_approval_quorum.sql`):
- Add `quorum_required integer` to `policy_versions` with a sensible default (e.g., `1` for back-compat with Phase 1).
- Add `quorum_strategy text CHECK (quorum_strategy IN ('all','majority','count'))` if needed; Phase 2 minimum is `count` only.

**Lifecycle helper** (`lib/policies/lifecycle.ts`):
- `recordApprovalDecision` updated: counts approvals for the version. Only flips to `approved` when `count(decision='approved') >= quorum_required`. Any rejection still flips to `draft` (single-rejector cancels).

**UI**:
- Submit-for-review form gains a "Required approvers" number field (defaults to 1).
- The detail page surfaces "X of Y approvers have reviewed" while in `pending_approval`.

**Estimated**: 2-3 days.

### 3. Reviewer pre-assignment

**Server action** (`submitPolicyForReview`):
- Phase 1 passes `approverIds: []`. Phase 2 form sends a list of user ids; the action seeds a `policy_approvals` row per approver with `decision='pending'`.
- `recordApprovalDecision` stays unchanged but in Phase 2 only listed approvers can decide.

**UI**:
- Submit-for-review modal: multiselect from `org_members` filtered to roles owner/admin/compliance_officer.
- Sidebar badge on `/app/policies` for users who have at least one pending policy_approval row.
- New view `/app/policies/queue` — list of policies awaiting current user's approval.

**Estimated**: 2-3 days.

### 4. Version-history page

Currently `/app/policies/[id]/versions` reads `org_policies` — i.e., it shows the live row, not the version history.

Change:
- Page now reads `policy_versions` for the policy id, ordered `version_number DESC`.
- For each version, joins `policy_approvals` to surface decision + comment + decided_at + decider name.
- Diff button (Phase 3) optional — Phase 2 just shows full content of each version.

**Estimated**: 1-2 days.

### 5. Approver notifications

When a policy moves `draft → pending_approval`:
- For each pre-assigned approver (or for all owner/admin if list empty):
  - In-app notification via existing `notifySelf` / notifications system.
  - Email via Resend with a deeplink to `/app/policies/[id]`.

When `pending_approval → approved` or `rejected`:
- Notify the original author (created_by on the policy_version).

Reuse existing notification primitives in `lib/notifications/*` and `lib/email/*`. No new tables.

**Estimated**: 1-2 days.

---

## Migration list (Phase 2)

| Filename | Purpose |
|---|---|
| `20260520_001_policy_approval_quorum.sql` | Adds `quorum_required` + optional `quorum_strategy` to `policy_versions`. |
| `20260520_002_policy_acknowledgment_indexes.sql` | Adds `idx_policy_acks_user_org` for the dashboard counts query. |

No destructive operations. All additive + idempotent.

---

## Code touchpoints

- **lib/policies/lifecycle.ts** — quorum-aware `recordApprovalDecision`, new `acknowledgePolicy` and `getAcknowledgmentSummary`.
- **app/app/actions/policies.ts** — wire new actions; update `submitPolicyForReview` to accept approver list.
- **app/app/policies/[id]/page.tsx** — show acknowledgment form for non-admin; show "X of Y approvers" for pending_approval; pre-fill author/quorum context.
- **app/app/policies/[id]/versions/page.tsx** — rewrite to read `policy_versions` joined with `policy_approvals`.
- **app/app/policies/[id]/acknowledgments/page.tsx** (new) — admin acknowledgment dashboard.
- **app/app/policies/queue/page.tsx** (new) — approver inbox.
- **components/policies/SubmitForReviewModal.tsx** (new) — approver-selection + quorum-required UI.
- **lib/notifications/*** — extend to fire on policy lifecycle transitions.
- **emails/** — new templates: PolicyApprovalRequest, PolicyApproved, PolicyRejected, PolicyAcknowledgmentReminder.

---

## Validation criteria

A Phase 2 deploy is considered ready when:

1. A new policy can be authored, submitted with N pre-assigned approvers, approved by N of them, and published — all flows logged to `org_audit_logs`.
2. A staff member receives an email + in-app notification when a policy is published in their org, can acknowledge from the policy detail, and the admin dashboard shows the acknowledgment.
3. Versions page shows full revision history per policy with approval decisions and comments.
4. The Phase 1 single-approver path remains the default (`quorum_required=1`) so existing customers don't see behavior changes without opting in.
5. All existing Phase 1 tests still pass; new Phase 2 tests cover quorum (`needs 2 approvals`, partial approval doesn't flip status), acknowledgment idempotency, notification firing, and queue filtering.

---

## Risks

- **Author-as-approver edge case**. Phase 1 blocks self-approval at the action layer. Phase 2 quorum logic must continue to exclude the author — counting self-approvals would let an author rubber-stamp their own changes by being on the approver list.
- **Notification volume**. If the approver list is empty (i.e., "any owner/admin can decide"), naive notification will email every owner/admin in the org on every submit. Phase 2 should batch or de-duplicate.
- **Schema migration timing**. Adding `quorum_required` with a non-null default is fine, but production rollout should ship the column + sync code together to avoid a window where new code expects it but old DB doesn't have it.

---

## Not part of Phase 2

These come up in conversations but belong to Phase 3+:

- Cron-driven periodic review (`policy_review_schedules` enforcement). Schema is in place but no scheduler exists yet.
- Policy diff UI between version N and N-1.
- Policy templates / centrally curated library.
- External-reviewer access (e.g., outside auditor reviewing pending policy without org membership).
- Policy publication windows / scheduled effective dates.

These should land as Phase 3 with their own plan doc once Phase 2 ships and stabilizes.
