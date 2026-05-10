# FormaOS Mobile — Scope Decision

**Status:** Decision made (2026-05-10) — two-track plan
**Decided by:** Founder (Ejaz)
**Original audit:** Blocker 7 (2026-05-09)

## Background

The `mobile/` directory in this repo is a Capacitor project that wraps a
webview pointed at `https://app.formaos.com.au` — every "native" launch
loads the live web app over the network. It has no native data layer,
no offline cache, no push handler, no biometrics, no native file
pickers. App Store guideline 4.2 routinely rejects webview-only apps.

In short: it serves neither of the founder's actual mobile goals.

## What we are actually doing

**Two separate tracks**, intentionally distinct surfaces and audiences.

### Track 1 — Mobile-responsive web (now)

**Audience:** Existing FormaOS customers (org admins, compliance leads)
who occasionally open the app from their phone via Chrome/Safari.

**Surface:** The existing `app/` Next.js routes, viewed in a mobile
browser. **No `mobile/` directory involved. No Capacitor.**

**Scope of work:**
- Audit every `/app/*` route at ≤640px breakpoint
- Touch-target sizes ≥44px (already partially done — see recent
  `feat(mobile): triage view + 4 more card lists + 44px touch targets`
  commit on main)
- Mobile bottom nav (already present in `components/mobile/bottom-nav.tsx`)
- Form input ergonomics (numeric keypads, autocomplete hints)
- Tablet-aware breakpoints for the dashboard widgets
- PWA polish: `app/manifest.ts` correctness, `apple-touch-icon`
  assets, Add-to-Home-Screen prompts on iOS

**Deliverable:** Polished responsive UX in `app/`. Tracked as a UX
backlog, not a single PR.

### Track 2 — Employee-only native iOS/Android app (later)

**Audience:** Frontline employees of FormaOS customer organisations
(care workers, support staff, field operators) — *not* the org
admin/compliance lead persona.

**Surface:** A net-new, narrowly-scoped native app. Not a wrap of the
admin panel.

**Scope of work (future, when this becomes a real workstream):**
- Sign in (probably magic-link or org-issued credential)
- "My shifts" / "My schedule" view
- Log incident (offline-capable, syncs on reconnect)
- View care notes for assigned participants
- Capture and upload evidence (camera + native file picker)
- Push notifications for shift changes / incident assignments
- Biometric unlock (Face ID / fingerprint)

**Stack decision deferred:** likely React Native (better offline +
push ecosystem than Capacitor for this kind of shift-based app), but
to be re-evaluated when the workstream begins.

**Why this is NOT just "wrap the admin app in Capacitor":**
- Different audience (employees, not admins)
- Narrower feature set (shift + incident + evidence, not full admin)
- Different auth posture (lower-trust device, biometric required)
- Real native primitives (offline queue, push, camera) — these
  cannot be webview-shimmed past App Store review

## What happens to the current `mobile/` directory

It serves neither track. It will be deleted in a follow-up PR titled
`chore: remove obsolete Capacitor webview shim`. The deletion can land
any time — it has no code dependencies elsewhere in the repo (the only
shared concept is `components/mobile/`, which is responsive web UI and
stays).

## Acceptance

- [x] Two-track plan recorded
- [x] Track 1 — shipped (see "Track 1 — done" below)
- [ ] Follow-up PR deletes `mobile/` directory
- [ ] Track 2 — kicked off only when there is a concrete customer
      requirement and dedicated engineering time

## Track 1 — done

Shipped 2026-05-10 as 7 PRs landed against `main`, organised into 5
groups per the original brief. Verification surface across all groups:
**58 mobile/tablet Playwright specs**, all passing on chromium, baselining
iPhone 14 (390×844), iPhone SE (320×568), iPad portrait (768×1024) and
iPad Pro (1024×1366). Specs live under `e2e/mobile/`; baseline JPEGs
under `e2e/screenshots/mobile/`.

| Group | PR | Scope | Specs |
|-------|----|-------|-------|
| A — PWA foundations | [#25](https://github.com/ejay-dev/FormaOS/pull/25) | `appleWebApp` metadata + legacy `apple-mobile-web-app-capable` for iOS < 16.4; manifest icons marked `purpose: "any maskable"` for Android adaptive; iPhone 14 baseline screenshot | 3 |
| B — touch targets | [#26](https://github.com/ejay-dev/FormaOS/pull/26) | Audit + fix every visible button/link/checkbox below 44px on the 7 high-traffic /app routes via `min-h-[44px] md:min-h-0` (existing pattern from triage commit 603e754c) | 7 |
| D — form ergonomics | [#27](https://github.com/ejay-dev/FormaOS/pull/27) | `inputMode` / `autoComplete` / `enterKeyHint` on auth + 9 search bars + new-participant form; `text-base md:text-sm` on auth inputs to dodge iOS focus-zoom | 6 |
| C1 — care ops | [#29](https://github.com/ejay-dev/FormaOS/pull/29) | iPhone 14 + iPhone SE audit of incidents, care-plans, participants, visits, progress-notes; OnboardingGuide popup hidden on mobile (`hidden md:block`) since the inline OnboardingStrip already covers the same nudge | 12 |
| C2 — compliance ops | [#30](https://github.com/ejay-dev/FormaOS/pull/30) | iPhone 14 + iPhone SE audit of compliance, policies, staff-compliance, registers, audit-trail | 10 |
| C3 — admin/settings | [#31](https://github.com/ejay-dev/FormaOS/pull/31) | iPhone 14 + iPhone SE audit of team, billing, settings + 5 highest-traffic settings sub-routes | 16 |
| E — tablet widgets | [#32](https://github.com/ejay-dev/FormaOS/pull/32) | Bumped /app/executive Top KPI Row + Command Center from `lg:grid-cols-4` to `xl:grid-cols-4` so 1024-wide tablets / narrow laptops keep readable 2-col layout instead of cramming labels to "CRITICA…" | 4 |

Plus [#28](https://github.com/ejay-dev/FormaOS/pull/28) (CI) added
`CHECK_ENV_SKIP_IN_CI` to the visual-regression workflow so Track 1
PRs could land without a workflow-side env-vars failure.

### What landed under each acceptance bullet

- **PWA polish** (manifest, apple-touch-icon, ATHS): A
- **Touch targets ≥44px**: B (followed by C1's OnboardingGuide fix)
- **Mobile bottom nav**: already shipped on main; preserved
- **Form input ergonomics**: D
- **Tablet-aware dashboard breakpoints**: E
- **Audit every `/app/*` route at ≤640px**: C1 (care ops) + C2
  (compliance) + C3 (admin/settings); 18 routes covered, all pass
  the no-horizontal-scroll guard at iPhone SE 320px

### Routes intentionally not audited in Track 1

- `app/(marketing)/*` — out of scope per the brief (marketing pages
  are their own thing, audited separately)
- Admin console (`app/admin/*`) — founder-only surface, not customer-facing
- Onboarding flow (`app/onboarding/*`) — covered by the existing
  onboarding test suite
- 7 lower-traffic settings sub-routes (ai, retention, executive-digest,
  email-history, email-preferences, auditor-access,
  notification-preferences) — same pattern as C3, can be appended to
  the C3 spec's `ROUTES` array if a regression appears
