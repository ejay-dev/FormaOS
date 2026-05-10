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
- [ ] Track 1 — open as a UX/responsive backlog (separate from this doc)
- [ ] Follow-up PR deletes `mobile/` directory
- [ ] Track 2 — kicked off only when there is a concrete customer
      requirement and dedicated engineering time
