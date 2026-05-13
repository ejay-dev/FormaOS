# FormaOS Deep Audit — 2026-05-12

Scope: full project (app + marketing). Independent re-audit; prior reports
(`APP_LINK_INTEGRITY_REPORT.md`, `BLOCKER_FOLLOWUPS.md`, the `FORMAOS_*`
audit MDs) consulted for context only — every finding here is verified
against the working tree at `main@0dc0b018`.

Findings are tagged `CRIT / HIGH / MED / LOW`. Each is a real bug or a
verifiable regression — phantom findings from earlier passes (e.g.
"sitemap is empty", "v1 auth routes missing rate limits") were
discarded after direct inspection of the cited files.

PR column updates as fixes ship.

## Legend

- **CRIT** — production user impact, security exposure, or data loss.
- **HIGH** — broken UX flow, missing role/auth check defense-in-depth,
  contract drift that would mislead an integrator.
- **MED** — quality smell that produces a degraded experience but does
  not strand the user.
- **LOW** — code hygiene, documentation, optimisation hint.

---

## 1. Auth, role gating, identity

| # | Sev  | Finding | File:line | PR |
|---|------|---------|-----------|----|
| 1 | HIGH | `app/admin/error.tsx` is a stub: shows raw `{error.message}` to the user, no Sentry capture, no digest, no consistent styling with `app/error.tsx` / `app/app/error.tsx`. If an admin server component throws, founders see unstyled red text with the raw exception. | `app/admin/error.tsx:1-25` | #52 |
| 2 | MED  | `components/user-nav.tsx` logout calls `supabase.auth.signOut()` then `router.push("/signin")` (which then redirects to `/auth/signin`). No client-state clear (Zustand `useAppStore.clear()` exists but is not invoked). In-memory only, so a refresh resets it — defense-in-depth, not a leak. | `components/user-nav.tsx:26-31` | — |
| 3 | MED  | Two parallel invite acceptance paths exist: `/accept-invite/[token]` (token-based, server actions) and `/accept-organization-invite/[membershipId]` (membershipId-based). Both ship to production; users from different invite emails will land on different surfaces. Verify both are intentional or consolidate. | `app/(standalone)/accept-invite/[token]/page.tsx`, `app/(standalone)/accept-organization-invite/[membershipId]/page.tsx` | — |

Verified-fine on direct inspection (rejected from this audit):

- "Magic-link users cannot reach Set Password" — `SetPasswordForm` is
  rendered unconditionally in `app/app/settings/security/page.tsx:116`
  and is reachable from `/app/settings`.
- "`/signin` not in middleware matcher" — `app/signin/page.tsx`
  server-redirects to `/auth/signin`, so middleware coverage is moot.

## 2. Forms — error information loss

| # | Sev  | Finding | File:line | PR |
|---|------|---------|-----------|----|
| 4 | HIGH | Marketing contact form: server action emits structured error codes (`rate_limit`, `invalid_email`, `1`) but UI maps them all to a single "Something went wrong" message. User cannot tell rate-limit from validation from server error. | `app/(marketing)/contact/ContactPageContentNew.tsx:681-692` vs `app/(marketing)/contact/actions.ts:29,53,58,85` | #50 |
| 5 | MED  | `app/app/settings/email-preferences/page.tsx:185` does `if (error) throw error;` inside a handler — re-scoped on inspection: the try/catch does swallow the throw; the real bug is the generic "Failed to save preferences" pill showing for every error mode. Now appends the actual `error.message` to the user-facing pill, truncated. | `app/app/settings/email-preferences/page.tsx:183-200` | #63 |
| 6 | MED  | `app/admin/components/add-note-form.tsx:44` calls `window.location.reload()` after a successful note insert. Destroys all client state and flashes a full reload. Should optimistic-add + toast. | `app/admin/components/add-note-form.tsx:31-50` | — |
| 7 | MED  | MFA challenge form fallback error is "We could not verify that code. Please try again." for every failure mode (expired token, network, rate-limit). Server side has the codes; UI doesn't surface them. Switch now covers all six route codes (rate_limited, invalid_token, invalid_token_format, invalid_body, unauthorized, mfa_verify_failed). | `app/auth/mfa-challenge/MfaChallengeForm.tsx:34-95` | #64 |
| 8 | LOW  | `app/join/page.tsx:80-103` catches everything with "An unexpected error occurred." The `/api/auth/bootstrap` call returns useful error bodies that aren't surfaced. | `app/join/page.tsx:80-103` | — |

Rejected:
- "Error.tsx leaks `error.message`" — Next.js redacts server-error
  messages in production builds. Client-side messages here are
  intentional and gated by the comment `{/* Always show error digest +
  message for debugging */}`.

## 3. API contract integrity

| # | Sev  | Finding | File:line | PR |
|---|------|---------|-----------|----|
| 9 | HIGH | Several v1 routes return nested-shape errors (`{error: {message: ...}}`) while the rest of v1 returns flat (`{error: "..."}`). Callers following OpenAPI will null-deref on the nested shape. **Scope larger than first cited** — the grep turned up 12 files total; all flattened in one mechanical pass. | `app/api/v1/forms/route.ts:43`, `app/api/v1/forms/[formId]/route.ts:52`, `app/api/v1/analytics/trends/route.ts:71`, `app/api/v1/forms/[formId]/submissions/export/route.ts` (multiple) + 8 more | #58 |
| 10 | MED | `app/api/auth/clear-session/route.ts` exports both POST and GET handlers; the GET path mutates state (clears cookies). REST hygiene + CSRF concern. POST-only is correct. | `app/api/auth/clear-session/route.ts:30,123` | — |

Rejected:
- "11 v1 routes use JWT instead of API key" — these are dashboard-cookie
  endpoints called from the dashboard UI, not customer-API endpoints.
  Cookie auth is correct for these surfaces; the `fos_` prefix is for
  programmatic-key surfaces only. False positive.
- "`/api/auth/mfa-status` missing rate limit" — read-only status
  endpoint that requires an auth cookie; not a brute-force target.

## 4. Marketing site & SEO

| # | Sev  | Finding | File:line | PR |
|---|------|---------|-----------|----|
| 11 | MED | `app/(marketing)/layout.tsx:86-90` injects an inline `<script>` for scroll-handler. CSP allows `'unsafe-inline'` for scripts to make this work — if the CSP is ever tightened (which it should be), this breaks. Nonce-based or external file. | `app/(marketing)/layout.tsx:86-90` + `next.config.ts:140` | — |
| 12 | LOW | `/legal/page.tsx` has no `alternates.canonical`. All other marketing pages set one. | `app/(marketing)/legal/page.tsx` | — |
| 13 | LOW | Most marketing pages set `openGraph` but omit `images`. Only the homepage and pricing have `og-image.png`. Social previews fall back to text-only. | `app/(marketing)/*/page.tsx` | — |

Rejected:
- "Sitemap is empty" — `app/sitemap.ts` is 403 lines with 63 URL
  entries. False positive from a parsing failure in the prior pass.
- "CSP `'unsafe-inline'` is CRIT" — pre-existing decision tied to the
  inline scroll handler (#11). Tightening CSP is a separate workstream,
  not a "ship today" item.

## 5. Pricing page — enterprise redesign (Phase D)

The current `/pricing` (and its 8 child components — ~2,300 LOC total)
reads as "AI dashboard" aesthetic:

- Cyan/emerald/rose neon accent system (`shadow-[0_0_8px_rgba(244,63,94,0.6)]`).
- "Animate-ping" badges next to "Manual / pre-FormaOS" rails — exactly
  the "neon Live badge" pattern flagged in standing feedback.
- Decorative corner brackets (`<span className="border-l border-t border-rose-400/50" />`)
  applied to every card.
- Mono-font uppercase-tracked labels (`font-mono text-[10px]
  uppercase tracking-[0.22em]`) as section eyebrows — strong "AI
  dashboard" vibe.
- Layered gradient backgrounds (`bg-gradient-to-b from-[#0a0f1c] via-
  [#07111f]` + multiple radial-gradients) on every section.

Reference aesthetic: `app/(marketing)/page.tsx` and its
`HeroStaticShell`/`HomeProofStaticShell` — typography rhythm, restraint
in palette, no neon accents.

To-do for the redesign PR (`redesign/pricing-enterprise`):
- Replace neon accent colors with the home page's restrained palette.
- Remove animate-ping badges; replace with text-only state labels.
- Drop decorative corner brackets across all 8 components.
- Move mono eyebrow labels to the home page's serif/sans rhythm.
- Flatten gradient stacks to single subtle backgrounds.
- Lift one positive pattern from home (per standing feedback).
- One visibly different transformation on first page load.
- Before/after screenshots in the PR body.

Estimated single-PR scope: 2,300 LOC touched, ~600 net new/changed.

## 6. Things deliberately not in scope

- Stripe-side billing reconciliation.
- Mobile-native (Capacitor/RN) changes.
- Pre-existing test quarantine (tracked in `BLOCKER_FOLLOWUPS.md`).
- Tightening CSP (`unsafe-inline` removal) — separate workstream;
  depends on #11.
- Test-count inflation: this audit deliberately documents 13 verified
  bugs across all dimensions, not 50+ from agent-pass sprawl.

## 7. Entitlement gate alignment

Verified by reading `lib/billing/entitlements.ts` and grepping every
`EntitlementKey` literal across the repo.

| # | Sev  | Finding | File:line | PR |
|---|------|---------|-----------|----|
| 14 | HIGH | Dead entitlements: `soc2_certification` (enabled for pro/scale/enterprise) and `executive_rollup` (enabled for enterprise) are written to `org_entitlements` by `syncEntitlementsForPlan` but **no application code calls `requireEntitlement` on either key**. The grep returns only the type definition, the plan-bundle list, and tests. Paying customers see no feature behind these gates. Decision needed: implement the gate, or remove the key. | `lib/billing/entitlements.ts:12,20,42,59,77,85`; no callers in `app/**` or `components/**` | #57 (deleted both keys per dead-entitlement policy) |
| 15 | HIGH | `app/api/v1/forms/[formId]/analytics/route.ts:21-26`, `app/api/v1/reports/custom/_entitlement.ts:9-14`, `app/api/automation/_auth.ts:33-38` all query `org_entitlements` directly without calling `requireActiveSubscription` first. A cancelled-subscription org whose entitlement rows linger could keep using these surfaces via API key. The canonical helper `requireEntitlement` (which does call `requireActiveSubscription`) exists but isn't reused. | as cited | — |
| 16 | MED  | `app/api/v1/members/invite/route.ts:60-92` treats a *missing* `team_limit` row as unlimited seats. A missing row almost certainly means the org was never properly entitled; the safer default is to block. | `app/api/v1/members/invite/route.ts:60-92` | — |
| 17 | MED  | Trial soft-lock taxonomy (`lib/trial/constants.ts:59-66`) uses string IDs (`'reports'`, `'audits'`, `'vault'`, `'registers'`, `'team'`, `'automation'`) that do not match the `EntitlementKey` union. Trial gating and entitlement gating operate on different vocabularies. | `lib/trial/constants.ts:59-66` vs `lib/billing/entitlements.ts:5-20` | — |
| 18 | LOW  | AI-assistant routes (`/api/v1/ai/*`) gate at the API; no UI-side `FeatureGate` exists, so users navigate to AI pages and get a server error instead of a lock screen. UX-only. | `app/api/v1/ai/chat/route.ts:77` et al. | — |

Rejected on direct inspection:
- "Plan name mismatch: `Starter` vs `Foundation`" — the *key* is `basic`
  in both `lib/plans.ts` and the migration; the *display name* is
  "Foundation". The agent confused the column with the display.
- "Migration 20260114 only seeds 5 pro entitlements" — irrelevant
  because `syncEntitlementsForPlan` is the runtime source of truth and
  upserts on every plan resolution. Migration seeds are just fixtures.

## 8. Onboarding completeness

| # | Sev  | Finding | File:line | PR |
|---|------|---------|-----------|----|
| 19 | ~~HIGH~~ MED | Framework provisioning is deferred via `after()` while the wizard advances to the next onboarding step. By the time the user reaches `/app` (step 7 → redirect), the user has spent 10–30 seconds on steps 6 and 7, and Vercel's `after()` keeps the function alive while it completes — the race is narrow. Reclassified MED on second pass because the audit's proposed fix ("await provisioning or move step-completion inside `after()`") doesn't actually close the race; the real surface is `/app/compliance/frameworks/[slug]` showing empty controls until provisioning lands. The clean fix is a "provisioning in progress" state on that page, not a change in onboarding. | `app/onboarding/page.tsx:552-616` | — |
| 20 | MED  | `app/onboarding/employee/actions.ts:128-151` (`skipEmployeeOnboarding`) marks `employee_onboarded_at` and redirects to `/app` without populating `user_profiles.full_name`. Downstream features that assume a non-empty name fail silently. | `app/onboarding/employee/actions.ts:128-151` | — |
| 21 | MED  | Step 5/6 of the main onboarding can be reached by manual URL (`/onboarding?step=5`) for non-provisioning roles whose journey skips those steps. No page-level guard against re-entering a skipped step. | `app/onboarding/page.tsx:1201-1238`; journey in `lib/onboarding/journey.ts:104-110` | — |
| 22 | MED  | `completeFirstAction` reads `org_subscriptions` synchronously to decide between `/app` and `/app/billing`. If the Stripe webhook hasn't fired yet the gate misjudges, and the `/app/layout.tsx` billing gate then bounces the user — two redirects to land in the right place. | `app/onboarding/page.tsx:817-838` | — |
| 23 | LOW  | `completeEmployeeOnboarding` accepts a `primaryCTA` from the form and only validates that it starts with `/app/`. A user can submit `primaryCTA=/app/admin` and land on a page they can't operate (RLS will catch them downstream, but the post-onboarding hero shouldn't open a 403). | `app/onboarding/employee/actions.ts:117-121` | — |

Rejected on direct inspection:
- "`markStepComplete` loop increments `current_step` past `TOTAL_STEPS`"
  — the loop calls `markStepComplete(orgId, step, step+1)` for
  `[4, 5, 6]` and ends at `current_step = 7 = TOTAL_STEPS`. The agent
  miscounted; not a bug.
- "Invite accept loops if role changes" — `app/onboarding/employee/page.tsx:62-65`
  already guards via `alreadyOnboarded`/`dbCompleted`. The agent
  retracted on its own follow-up read.

## 9. Mobile / responsive / accessibility

Verified findings; the full agent list of 21 had several mis-attributed
items, those are noted below.

| # | Sev  | Finding | File:line | PR |
|---|------|---------|-----------|----|
| 24 | HIGH | `components/mobile-sidebar.tsx:98-107` declares `role="dialog" aria-modal="true"` but does not trap focus. Tab leaves the sidebar into the page underneath. | `components/mobile-sidebar.tsx:98-107` | — |
| 25 | HIGH | `components/sidebar.tsx:393-398` renders a status RAG dot with `aria-label="Status indicator"` and color-only differentiation between red / amber / emerald. Color-blind users cannot distinguish overdue from on-track. WCAG 1.4.1. | `components/sidebar.tsx:393-398` | — |
| 26 | HIGH | `components/ui/data-table.tsx:71` uses `<table class="w-full min-w-[560px]">` inside `overflow-x-auto`. On viewports under ~560px (most phones in portrait) every data table requires horizontal scroll; no card-layout fallback. | `components/ui/data-table.tsx:71` | — |
| 27 | MED  | `components/profile/profile-editor.tsx:316,333,353,375` use `focus:outline-white/20` instead of the system's `focus:ring-2 focus:ring-primary/40` pattern. Focus visibility regresses on dark themes. | as cited | — |
| 28 | MED  | `components/automation/workflow-step-config.tsx:74` textarea uses `outline-none transition focus:border-cyan-400/60` — border-only focus indicator, fails 3:1 contrast on most themes. Also reintroduces a cyan accent in /app, against the standing enterprise-aesthetic guidance. | `components/automation/workflow-step-config.tsx:74` | — |
| 29 | MED  | `components/registers/add-certification-modal.tsx:146,172,191,206` use `focus:outline-black` with no fallback ring. Black outline disappears against the modal's dark surface. | as cited | — |
| 30 | MED  | `components/mobile/more-sheet.tsx:95-170` opens with `aria-modal="true"` but no initial-focus management and no `inert`/`aria-hidden` on the background. | `components/mobile/more-sheet.tsx:95-170` | — |
| 31 | MED  | Icon-only sort buttons in `components/ui/data-table.tsx:102` lack `aria-label`; screen readers announce only the column name, not the sort direction. | `components/ui/data-table.tsx:102` | — |
| 32 | LOW  | `app/app/layout.tsx:191-196` skip-link is `z-50` but topbar is `z-40` and sidebar can sit higher in some routes — on focus the link can render *behind* fixed UI. | `app/app/layout.tsx:191-196` | — |

Rejected:
- "form-renderer.tsx inputs without labels" — the parent at line ~335
  wraps every `FieldInput` in a `<label>`. Implicit labeling is valid;
  not best practice but not a bug.
- "RetentionSettings/RolesNew inputs without `htmlFor`" — same
  implicit-label pattern. Cosmetic, not broken.
- "Skip-link points to missing element" — `#main-content` exists in
  `app/app/layout.tsx`.

## 9a. Retroactive verifications

Discharges procedural debt from PR #52 (merged with three failing
compliance checks due to a shell-truthiness bug in the merge guard).

- **2026-05-12** — manually triggered the `Compliance Testing`
  workflow against `main` HEAD (post-#52, post-#54, post-#55).
  - Run [25719591886](https://github.com/ejay-dev/FormaOS/actions/runs/25719591886):
    `gdpr-compliance` ✅, `soc2-compliance` ✅, `compliance-summary` ✅.
  - First green run of this workflow on `main` since at least the
    2026-05-11 schedule (which failed at the prebuild gate). #52's
    code change is verified compliant on the now-functional suite.
  - Two follow-on workflow bugs surfaced along the way and shipped as
    their own PRs: #54 (build-step env gap) and #55 (start-step env
    gap — the prestart hook runs the same `check-env` and was missing
    the same six keys).

Going forward, merge-guard uses `[ -z "$FAILED" ]` instead of
`awk … && gh pr merge`. The latter passes through awk's "matched
nothing" exit-0, which is what caused #52 to merge red in the first
place.

## 9b. Dead-entitlement removals

- **2026-05-12** — deleted `soc2_certification` and `executive_rollup`
  from `PLAN_ENTITLEMENTS`, the `EntitlementKey` union, the founder-org
  upgrade SQL script, and the two tests asserting their presence. Per
  the dead-entitlement audit policy: zero callers across UI, server
  actions, route handlers, middleware, CRON, or admin tools — they
  were no-op flags. Shipped as **#57**. Drops audit-doc finding #14
  from "queued" to "done — keys deleted".

## 9c. A→B→C data flow

For each of the six critical multi-tenant flows the master prompt
called out, read the server action / route handler / page component
that participates. Findings recorded only where the bug is real on
the working tree.

| # | Sev  | Flow | Finding | File:line | PR |
|---|------|------|---------|-----------|----|
| 33 | HIGH | Role change | No application surface for changing an existing member's role. The owner's role is written once during onboarding (`app/onboarding/page.tsx:461-465`). `/app/team` displays members + roles but the page has no role-change form and there is no server action `updateMemberRole`/`changeRole` in `app/app/actions/*` or `app/app/team/*`. Either roles are mutated only through Supabase admin / direct SQL (in which case the audit log has gaps), or this is an incomplete feature. | `app/app/team/page.tsx` + missing action in `app/app/actions/` | #60 |
| 34 | HIGH | Subscription state | `lib/trial/use-trial-state.ts:18-21` explicitly documents: *"Never triggers additional server calls — pure derived state."* It reads `entitlements.trialActive` + `trialDaysRemaining` from `useAppStore`, which is hydrated once on app load. When the trial expires server-side (Stripe webhook + DB update), the hook keeps reporting `trialActive: true` until the user reloads — every `FeatureGate.isFeatureLocked()` lies for the duration of the open session. | `lib/trial/use-trial-state.ts:18-50`; consumers via `useAppStore.entitlements` | #61 |
| 35 | MED  | Org settings | `updateOrgName` calls `revalidatePath('/app/settings')` + `revalidatePath('/app')` — `/app/*` runs `dynamic = 'force-dynamic'` (`app/app/layout.tsx:37`) so every page re-fetches, so SSR is fine. But the client-side `useAppStore.organization.name` (Zustand) is never invalidated. Any client component reading the name from the store (sidebar/topbar/profile menu) shows the old name until the user reloads. | `app/app/settings/actions.ts:46-47` + `lib/stores/app.ts` | — |
| 36 | MED  | Team invite | `app/app/team/page.tsx:31-75` (`revokeInvitation`) trusts `organizationId` from FormData. RLS catches the cross-org case at the DB layer, but the server action should still validate `permissionCtx.orgId === organizationId` before issuing the `UPDATE`. Defense-in-depth gap, not an active leak. | `app/app/team/page.tsx:31-75` | — |

Rejected on direct inspection (data-flow agent pass produced 20
findings; 12 of them did not survive verification — recording the
rejections so the trail stays honest):

- "Cross-org invite leak" — the route reads org_id from the actor's
  *own* membership (`org_members` row joined to the authenticated
  user), not from request input.
- "Invitation acceptance skips org context" — `app/(standalone)/accept-invite/[token]/page.tsx:182`
  explicitly rejects mismatched-email accepts with a dedicated
  screen.
- "Team page stale cache", "Care plans list cache", "Org settings
  stale across SSR surfaces" — all `/app/*` runs under
  `dynamic = 'force-dynamic'` at the layout level
  (`app/app/layout.tsx:37`); there is no SSR cache to be stale.
- "Stripe webhook doesn't invalidate cache" — the webhook
  (`app/api/billing/webhook/route.ts:53,571-578`) collects
  `orgsToRevalidate` and calls `revalidatePath('/app', 'layout')` +
  `revalidatePath('/app/billing')` for the actual `unstable_cache`
  TTL that gates billing. `invalidateOrgCache` exists for a
  different namespace (`org:${id}:*`) that entitlements do not use.
- "Zustand not re-hydrated on org switch" — speculative ("if a user
  is added to multiple orgs in the future"). Not a current bug.
- "Evidence API response missing org-id" — RLS is the contract;
  defensive org-id echo in the response shape adds nothing.
- "updateOrgName silently fails on permission mismatch" — the
  action returns early with the explicit "Unauthorized" message;
  not silent.
- "syncCarePlanProgress race" + "Care plan goals concurrent writes"
  — agent could not cite a concrete failure mode; the
  `loadPlanForWrite` helper does scope-check; rejected pending
  reproducible repro.

## 10. Things deliberately not in scope

- Stripe-side billing reconciliation.
- Mobile-native (Capacitor/RN) changes.
- Pre-existing test quarantine (tracked in `BLOCKER_FOLLOWUPS.md`).
- Tightening CSP (`unsafe-inline` removal) — separate workstream;
  depends on #11.
- Test-count inflation: every row above is a real bug or quality gap,
  not "fail rate massaged into a 100-row spreadsheet".

## 11. Remaining audit dimensions

Phase A is now complete: auth + forms + API + marketing + entitlements
+ onboarding + a11y/mobile + A→B→C data flow have all been walked. The
audit currently records 36 verified findings (3 HIGH still open: #19
[reclassified], #33, #34 — plus 13 MED and a tail of LOW). PR refs
for shipped fixes: #50, #52, #57, #58.

Future Phase A re-passes should focus on the surfaces where the data-
flow walk could not confidently rule out a finding — care-plan
concurrent writes specifically, and the Zustand-store hydration
semantics if multi-org switching is added.
