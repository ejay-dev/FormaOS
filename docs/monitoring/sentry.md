# Sentry Monitoring

FormaOS already includes `@sentry/nextjs` and Sentry config files:

- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

Sentry is enabled in production when `NEXT_PUBLIC_SENTRY_DSN` is present.

## Required Env

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` for release uploads in CI/CD
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` or Vercel commit metadata

## What To Capture

Sentry should be the first stop for:

- frontend render errors
- server/API route errors
- failed uploads
- failed exports
- failed billing actions
- slow pages and transactions
- unhandled promise rejections
- release regressions by commit hash

## Current Behavior

- client and server events pass through `lib/sentry/scrub-pii`
- production sampling is enabled
- replay masks text and blocks media
- known noisy redirects/not-found errors are ignored

## Release Practice

After deploy:

1. Confirm the release version or commit hash appears in Sentry.
2. Watch new issues for 30 minutes.
3. Check upload/export/billing tags if a release touches those areas.
4. Roll back quickly if critical authenticated-app errors spike.

## Follow-Up

If release upload is not yet configured in CI, add `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` to GitHub/Vercel and enable source map upload through the Sentry Next.js integration.
