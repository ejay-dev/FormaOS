# Playwright Testing Standard

Playwright is FormaOS' primary end-to-end test runner. It covers authenticated app integrity, exports, deep workflows, onboarding, billing handoff, and accessibility.

## What The Config Captures

`playwright.config.ts` is configured to:

- record traces on first retry
- capture screenshots on failure
- retain video on failure
- run Chromium, Firefox, WebKit, and mobile projects when needed
- use `e2e/global-setup.ts` and `e2e/global-teardown.ts`
- reuse an existing local dev server when `PLAYWRIGHT_REUSE_SERVER=true`

Individual integrity specs add page-level guards for meaningful console errors, page errors, and app/API 404 responses.

## Test Groups

Use these groups as the standard entry points:

- Smoke: `npm run test:e2e:smoke`
- App action integrity: `npm run test:e2e:app-actions`
- Export integrity: `npm run test:e2e:exports`
- Deep workflow and system integration: `npm run test:e2e:deep`
- Onboarding: `npm run test:e2e:onboarding`
- Billing handoff: `npm run test:e2e:billing`
- Accessibility: `npm run test:a11y`
- Full E2E: `npm run test:e2e`

## Authenticated State And Seeded Data

Authenticated tests use `e2e/helpers/workspace-seed.ts`.

Required env vars:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional stable test-user env vars:

- `E2E_TEST_EMAIL`
- `E2E_TEST_PASSWORD`

If a stable user is not provided, the helper creates and caches a temporary user in `test-results/e2e-auth-user.json`.

## UI Mode

```bash
npm run test:e2e:ui
```

Use UI mode for selector work, visual debugging, and stepping through flows.

## Trace Viewer

When a retry records a trace:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

The HTML report is in `playwright-report/`.

## Debugging Flakes

Use this order:

1. Re-run the exact spec once with `--workers=1`.
2. Check `test-results/` for screenshot, video, and trace.
3. Confirm Supabase schema with `npm run db:test:verify`.
4. Confirm rate-limit/Redis env for app/API-heavy specs.
5. If the failure is only parallel load related, document the safe worker count instead of weakening assertions.

## Release Gate

Before production deploy, run at minimum:

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
