# k6 Load Testing

k6 covers light load and smoke performance for public pages and selected authenticated app/API paths.

## Scripts

- Public marketing traffic: `npm run load:public`
- Authenticated app traffic: `npm run load:app`
- Report export API: `npm run load:exports`
- Evidence upload API: `npm run load:evidence`

Install the real k6 CLI before running:

```bash
brew install k6
```

or follow the k6 Linux install instructions in CI.

## Common Env

- `BASE_URL` defaults to `http://localhost:3000`
- `VUS` defaults per script
- `DURATION` defaults per script
- `FORMAOS_AUTH_COOKIE` or `AUTH_COOKIE` is required for authenticated tests

## Public Load

```bash
BASE_URL=https://staging.formaos.com VUS=10 DURATION=2m npm run load:public
```

Thresholds:

- request failure rate under 1 percent
- p95 under 1000 ms
- checks over 99 percent

## Authenticated App Load

```bash
BASE_URL=https://staging.formaos.com \
FORMAOS_AUTH_COOKIE='...' \
VUS=5 \
DURATION=2m \
npm run load:app
```

Run only against staging or a seeded local test environment.

## Export Load

```bash
BASE_URL=https://staging.formaos.com \
FORMAOS_AUTH_COOKIE='...' \
VUS=2 \
DURATION=1m \
npm run load:exports
```

Thresholds are looser because exports are heavier and may generate reports.

## Evidence Upload Load

Evidence upload is mutating and is disabled by default. Use only with a disposable seeded entity.

```bash
BASE_URL=https://staging.formaos.com \
FORMAOS_AUTH_COOKIE='...' \
ALLOW_MUTATING_LOAD_TESTS=true \
EVIDENCE_ENTITY_ID='safe-seeded-entity-id' \
EVIDENCE_ENTITY_TYPE=obligation \
VUS=1 \
DURATION=30s \
npm run load:evidence
```

Never run mutating load tests against production by default.
