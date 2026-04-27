# k6 Load Testing

k6 covers light load and smoke performance for public pages and selected authenticated app/API paths. FormaOS supports three runners:

- local k6 CLI: fastest for engineers who already have k6 installed
- Docker k6: preferred fallback when local k6 is not installed
- Grafana Cloud k6: useful for scheduled or team-visible load runs

## Scripts

Local k6 CLI:

- Public marketing traffic: `npm run load:public`
- Authenticated app traffic: `npm run load:app`
- Report export API: `npm run load:exports`
- Evidence upload API: `npm run load:evidence`

Docker fallback:

- Public marketing traffic: `npm run load:public:docker`
- Authenticated app traffic: `npm run load:app:docker`
- Report export API: `npm run load:exports:docker`
- Evidence upload API: `npm run load:evidence:docker`

## Runner Options

### Local k6 CLI

Use this when k6 is installed locally or in CI:

```bash
brew install k6
k6 version
BASE_URL=https://www.formaos.com.au VUS=3 DURATION=45s npm run load:public
```

On Linux CI, follow the official k6 package install instructions.

### Docker k6

Use this when local k6 installation is blocked but Docker is available:

```bash
docker version
npm run load:public:docker
```

The Docker scripts use the official `grafana/k6` image and mount the repo at `/work`. The public smoke defaults to:

```bash
BASE_URL=https://www.formaos.com.au VUS=3 DURATION=45s npm run load:public:docker
```

Override the defaults the same way as local k6:

```bash
BASE_URL=https://staging.formaos.com VUS=10 DURATION=2m npm run load:public:docker
```

### Grafana Cloud k6

Use Grafana Cloud k6 for scheduled checks, team dashboards, or longer runs that should not depend on a laptop:

```bash
k6 cloud load-tests/public.js
```

Keep cloud tests pointed at staging unless the run is an explicitly approved production smoke. Do not run mutating evidence uploads against production.

## Common Env

- `BASE_URL` defaults to `http://localhost:3000` for local scripts
- Docker public script defaults to `https://www.formaos.com.au`
- Docker authenticated/API scripts default to `https://app.formaos.com.au`
- `VUS` defaults per script
- `DURATION` defaults per script
- `FORMAOS_AUTH_COOKIE` or `AUTH_COOKIE` is required for authenticated tests

## Public Load

Safe against production as a light smoke:

```bash
BASE_URL=https://www.formaos.com.au VUS=3 DURATION=45s npm run load:public:docker
```

Staging example:

```bash
BASE_URL=https://staging.formaos.com VUS=10 DURATION=2m npm run load:public
```

Thresholds:

- request failure rate under 1 percent
- p95 under 1000 ms
- checks over 99 percent

## Authenticated App Load

Run only against staging or a seeded local test environment.

```bash
BASE_URL=https://staging.formaos.com \
FORMAOS_AUTH_COOKIE='...' \
VUS=5 \
DURATION=2m \
npm run load:app:docker
```

## Export Load

Use staging for regular export load runs. Thresholds are looser because exports are heavier and may generate reports.

```bash
BASE_URL=https://staging.formaos.com \
FORMAOS_AUTH_COOKIE='...' \
VUS=2 \
DURATION=1m \
npm run load:exports:docker
```

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
npm run load:evidence:docker
```

Never run mutating load tests against production by default.
