# Deep QA Harness

FormaOS has a deeper-than-browser E2E layer for API contracts, Supabase RLS/database checks, accessibility, Lighthouse, and trace-based testing.

## Local Commands

```bash
npm run test:api-contracts
npm run test:db:rls
npm run test:a11y:deep
npm run qa:deep
```

`test:api-contracts` validates `openapi.json` and can probe live GET endpoints when `API_CONTRACT_BASE_URL` is set.

`test:db:rls` statically scans Supabase migrations for RLS and tenant-scope regressions. If Supabase service credentials are present, it also attempts live catalog checks.

`test:a11y:deep` runs the existing Playwright Axe smoke, Pa11y WCAG2AA checks, and public Lighthouse audits. Start the app first, or point `A11Y_BASE_URL` / `LIGHTHOUSE_BASE_URL` at a deployed URL.

## Tracetest

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces npm run dev
TRACETEST_BASE_URL=http://host.docker.internal:3000 npm run tracetest:local
```

The Tracetest runner expects Docker. It starts `docker-compose.tracetest.yml` and runs `tracetest/formaos-health.yaml` with a host Tracetest CLI when available, or with the Dockerized CLI from `kubeshop/tracetest:v1.7.1`.

OpenTelemetry is bootstrapped through Next.js `instrumentation.ts` and exports only when `OTEL_EXPORTER_OTLP_ENDPOINT` or Langfuse tracing is configured.
