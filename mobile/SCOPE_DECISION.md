# FormaOS Mobile — Scope Decision

**Status:** Decision required from product owner
**Author:** Engineering audit (Blocker 7)
**Date:** 2026-05-09

## What is in `mobile/` today

A Capacitor project that wraps a webview pointed at production:

- `capacitor.config.json` sets `server.url: "https://app.formaos.com.au"` — every "native" launch loads the live web app over the network.
- `mobile/src/` is two files: `mobile.ts` (101 lines: status bar, splash, deep-link handler) and `mobile.css` (215 lines of cosmetic tweaks). No screens, no models, no offline state.
- iOS and Android Xcode/Gradle scaffolds exist (`mobile/ios/`, `mobile/android/`) and a working build pipeline (`build-mobile.sh`, `generate-builds.sh`).
- Capacitor 6 deps: `@capacitor/app`, `splash-screen`, `status-bar`, `keyboard`, `preferences`, `haptics`.
- No native data layer, no offline cache, no push-notification handler, no biometric auth, no native file pickers.

In short: this is a webview shim wearing a native badge. App-store reviewers (especially Apple, see App Store guideline 4.2) routinely reject webview-only apps.

## The three options

### Option A — Delete `mobile/`, ship a responsive PWA

**What changes:** Remove `mobile/` from the repo. Ensure `app/manifest.ts` is correct, add `apple-touch-icon` assets, expose Add-to-Home-Screen prompts, polish the responsive breakpoints already present in [globals.css](app/globals.css). Marketing repositions the offering.

**Cost:** 1–2 weeks of polish. Marketing site copy update. App-store listings retired (if any exist).

**Pros:** Honest. Zero new surface area. PWA covers >80% of the "mobile access" use case for this product (compliance ops, evidence review). One codebase to test.

**Cons:** No native push, no biometric unlock, limited offline. iOS PWA has worse storage quotas than Android. No store-shelf presence.

### Option B — Keep Capacitor, build real native shells

**What changes:** Replace the webview shim with real native modules. Pick the minimum native feature set:

1. Offline care notes (queue + Supabase sync on reconnect)
2. Push notifications (Capacitor Push Notifications + APNs/FCM)
3. Biometric unlock (Face ID / fingerprint to gate app launch + signing)
4. Native file pickers (camera + document picker for evidence uploads)
5. Secure local storage for short-lived auth state (Keychain / EncryptedSharedPreferences)

The web UI keeps rendering inside the webview, but the native bridge gives reviewers the differentiated functionality they need to approve listing.

**Cost:** Realistically 6–10 engineer-weeks. Each module has a real test surface (offline conflicts, push topic management, biometric fallbacks). Ongoing OS-version maintenance burden — at least one engineer-week per quarter.

**Pros:** App-store presence. Matches enterprise procurement expectations ("does it have a mobile app?"). Reuses the existing component library.

**Cons:** Webview + native bridge is a fragile architecture for offline. Two-tier debugging surface. Capacitor's plugin ecosystem is thinner than React Native's.

### Option C — Rewrite as React Native

**What changes:** Net-new RN codebase. Expo-managed workflow if speed matters; bare workflow if you need custom native modules. Reuse types/business-logic from `lib/` (most are framework-agnostic) but rebuild every screen.

**Cost:** 12–20 engineer-weeks for parity with the current web `/app` surface. New design-system port (or a shared component primitive layer using `react-native-web`).

**Pros:** True native feel. RN ecosystem is mature. Deep offline + native integrations are first-class.

**Cons:** Largest investment. Highest risk of divergence from web UX. Doubles the design-review surface for every new feature.

## Recommendation

**Option A** unless the customer pipeline has a concrete deal blocked on a native app. Compliance-ops users are predominantly desktop-first; the cases where they need mobile (incident logging on the floor, evidence capture) are well-served by a PWA + camera APIs. Option B is the right answer only if app-store presence is a sales requirement that the founder has heard from named customers. Option C is hard to justify without a year-plus runway and a dedicated mobile lead.

## What this PR does

This PR is the **decision-pending** state: no code changes, just this proposal. Once the founder picks an option:

- **A:** follow-up PR removes `mobile/`, updates marketing references, and adds PWA polish.
- **B:** follow-up roadmap with the five native modules, each one PR.
- **C:** spike PR creating the `mobile-rn/` directory with the design-system port plan.

Until then, do **not** ship anything that calls `mobile/` "native". The webview shim is misleading.

## Acceptance

- [ ] Founder picks A, B, or C (or sub-variant of B).
- [ ] Decision recorded as a project memory or planning doc.
- [ ] `mobile/SCOPE_DECISION.md` either kept (Option B/C, becomes the roadmap header) or deleted alongside `mobile/` (Option A).
