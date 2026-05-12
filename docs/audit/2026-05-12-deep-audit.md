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
| 1 | HIGH | `app/admin/error.tsx` is a stub: shows raw `{error.message}` to the user, no Sentry capture, no digest, no consistent styling with `app/error.tsx` / `app/app/error.tsx`. If an admin server component throws, founders see unstyled red text with the raw exception. | `app/admin/error.tsx:1-25` | — |
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
| 4 | HIGH | Marketing contact form: server action emits structured error codes (`rate_limit`, `invalid_email`, `1`) but UI maps them all to a single "Something went wrong" message. User cannot tell rate-limit from validation from server error. | `app/(marketing)/contact/ContactPageContentNew.tsx:681-692` vs `app/(marketing)/contact/actions.ts:29,53,58,85` | — |
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

## 7. Remaining audit dimensions

Not yet checked in this pass (queued for next session):

- Entitlement gates between `lib/billing/entitlements.ts` and the DB.
- Onboarding completeness — every step reachable from /onboarding.
- Mobile viewport regressions across /app routes.
- Keyboard navigation / focus-ring coverage in /app.
- Data-flow A→B→C verification (write on page A, read on page B).
