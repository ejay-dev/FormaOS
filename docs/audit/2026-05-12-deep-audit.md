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
| 5 | MED  | `app/app/settings/email-preferences/page.tsx:185` does `if (error) throw error;` inside a handler — bubbles to the page-level error boundary and loses the form context. Should `setError(...)` and render an inline message. | `app/app/settings/email-preferences/page.tsx:183-194` | — |
| 6 | MED  | `app/admin/components/add-note-form.tsx:44` calls `window.location.reload()` after a successful note insert. Destroys all client state and flashes a full reload. Should optimistic-add + toast. | `app/admin/components/add-note-form.tsx:31-50` | — |
| 7 | MED  | MFA challenge form fallback error is "We could not verify that code. Please try again." for every failure mode (expired token, network, rate-limit). Server side has the codes; UI doesn't surface them. | `app/auth/mfa-challenge/MfaChallengeForm.tsx:43` | — |
| 8 | LOW  | `app/join/page.tsx:80-103` catches everything with "An unexpected error occurred." The `/api/auth/bootstrap` call returns useful error bodies that aren't surfaced. | `app/join/page.tsx:80-103` | — |

Rejected:
- "Error.tsx leaks `error.message`" — Next.js redacts server-error
  messages in production builds. Client-side messages here are
  intentional and gated by the comment `{/* Always show error digest +
  message for debugging */}`.

## 3. API contract integrity

| # | Sev  | Finding | File:line | PR |
|---|------|---------|-----------|----|
| 9 | HIGH | Several v1 routes return nested-shape errors (`{error: {message: ...}}`) while the rest of v1 returns flat (`{error: "..."}`). Callers following OpenAPI will null-deref on the nested shape. | `app/api/v1/forms/route.ts:43`, `app/api/v1/forms/[formId]/route.ts:52`, `app/api/v1/analytics/trends/route.ts:71`, `app/api/v1/forms/[formId]/submissions/export/route.ts` (multiple) | — |
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
| 14 | HIGH | Dead entitlements: `soc2_certification` (enabled for pro/scale/enterprise) and `executive_rollup` (enabled for enterprise) are written to `org_entitlements` by `syncEntitlementsForPlan` but **no application code calls `requireEntitlement` on either key**. The grep returns only the type definition, the plan-bundle list, and tests. Paying customers see no feature behind these gates. Decision needed: implement the gate, or remove the key. | `lib/billing/entitlements.ts:12,20,42,59,77,85`; no callers in `app/**` or `components/**` | — |
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
| 19 | HIGH | Framework provisioning is deferred via `after()` while the redirect to `/app` runs immediately. A new owner reaching `/app/compliance/frameworks` in the first few seconds may see no frameworks yet. Either await the provisioning or move the step-completion mark inside `after()`. | `app/onboarding/page.tsx:552-616` | — |
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

## 10. Things deliberately not in scope

- Stripe-side billing reconciliation.
- Mobile-native (Capacitor/RN) changes.
- Pre-existing test quarantine (tracked in `BLOCKER_FOLLOWUPS.md`).
- Tightening CSP (`unsafe-inline` removal) — separate workstream;
  depends on #11.
- Test-count inflation: every row above is a real bug or quality gap,
  not "fail rate massaged into a 100-row spreadsheet".

## 11. Remaining audit dimensions

Not yet checked in this pass (queued):

- **A→B→C data flow**: write on page A, read on page B, verify the
  same record appears (cache/RLS/org-id leak surface).
