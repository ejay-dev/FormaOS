# FormaOS Testing Stack

This folder is the entry point for FormaOS quality coverage.

## Core Tools

- Playwright: deep E2E, exports, workflows, billing handoff, app action integrity
- Supabase CLI plus `db:test:verify`: migration, schema, RLS, and storage verification
- Stripe CLI: billing and webhook lifecycle testing in test mode
- Axe via Playwright: accessibility coverage
- Lighthouse: public marketing performance, accessibility, SEO, and best practices
- k6: public and authenticated load smoke tests
- OWASP ZAP: staging baseline security scans
- Sentry: production error and performance monitoring
- Synthetic monitoring: external uptime and workflow smoke checks

## Fast Pull Request Gate

```bash
npm run typecheck
npm run lint
npm run build
npm run check:app-links
npm run db:test:verify
npm run test:e2e:smoke
npm run test:e2e:app-actions
npm run test:e2e:exports
```

## Pre-Production Gate

```bash
npm run typecheck
npm run lint
npm run build
npm run check:app-links
npm run db:test:verify
npm run test:e2e:smoke
npm run test:e2e:app-actions
npm run test:e2e:exports
npm run test:e2e:deep
npm run test:e2e:onboarding
npm run test:e2e:billing
npm run test:a11y
npm run test:lighthouse:public
```

For releases touching uploads, exports, or high-traffic areas, also run the relevant k6 script against staging.

## Current Accessibility Baseline

As of 2026-04-27, `npm run test:a11y` and `npm run test:e2e:accessibility` pass public marketing pages and the authenticated app-shell scan.

Fixed in this setup pass:

- sidebar/app-shell muted navigation contrast and app primary CTA contrast
- floating feedback/help target-size spacing
- unlabeled assistant-panel icon buttons

No serious or critical axe violations are currently deferred by the accessibility spec.

## CI Recommendation

`.github/workflows/formaos-quality-gates.yml` is the focused gate:

- every PR/main push: typecheck, lint, build, app link check, DB verification, Playwright smoke, app-action integrity, export integrity
- nightly/manual: critical regression specs, accessibility, k6 public light load, optional ZAP baseline against staging

Heavy scans should run nightly or before release, not on every small commit.
