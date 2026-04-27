# Synthetic Monitoring Plan

Use Checkly, Better Stack, or an equivalent synthetic monitor against production and staging. Do not run destructive authenticated checks against production.

## Recommended Checks

| Name | URL | Frequency | Expected |
| --- | --- | ---: | --- |
| FormaOS homepage | `https://www.formaos.com.au/` | 5 min | HTTP 200, body contains `FormaOS` |
| Pricing | `https://www.formaos.com.au/pricing` | 10 min | HTTP 200 |
| Contact | `https://www.formaos.com.au/contact` | 10 min | HTTP 200 |
| Security | `https://www.formaos.com.au/security` | 10 min | HTTP 200 |
| Trust | `https://www.formaos.com.au/trust` | 10 min | HTTP 200 |
| Auth entry | `https://app.formaos.com.au/login` | 5 min | HTTP 200 or safe redirect to login |
| Health API | `https://www.formaos.com.au/api/health` | 1 min | HTTP 200 |
| Staging app smoke | `$STAGING_BASE_URL/app` | 15 min | HTTP 200 or authenticated redirect |

## Optional Authenticated Staging Checks

Use a dedicated staging-only test account. Keep production authenticated checks read-only and minimal.

- sign in and load dashboard
- create then delete a staging-only evidence record
- run a small report export and assert a non-empty response
- open billing handoff and assert safe redirect or setup message

## Alert Policy

- health API: page after two consecutive failures
- public pages: page after two consecutive 5xx responses
- latency: warn when p95 is above 3 seconds for 10 minutes
- staging export/upload smoke: page on first failure

## Alert Channels

Send alerts to the production ops channel, and include links to the matching Vercel deployment/logs and Sentry issue search for the same timestamp.

## Manual Setup

Checkly and Better Stack credentials are not stored in this repo. Create checks manually or through their APIs only after confirming plan/cost impact.
