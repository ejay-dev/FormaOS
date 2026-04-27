# Synthetic Monitoring Plan

Use Checkly, Better Stack, or an equivalent synthetic monitor against production and staging.

## Public Checks

- homepage loads
- pricing loads
- contact page loads
- auth sign-in page loads
- trust/security pages load

## Authenticated Or API Checks

- `/api/health` returns 200
- `/api/auth/health` returns a safe status
- billing route loads safely
- evidence upload smoke endpoint is tested only with a dedicated staging account

## Cadence

- public routes: every 1 to 5 minutes
- health endpoints: every 1 minute
- authenticated staging smoke: every 15 minutes
- production authenticated checks: minimal and read-only

## Alerts

Alert on:

- two consecutive failures for health checks
- public page p95 above 3 seconds for 10 minutes
- 5xx responses from app/API routes
- export/upload failures in staging smoke

## Ownership

Send alerts to the production ops channel and link them to Sentry and Vercel logs for the same timestamp.
