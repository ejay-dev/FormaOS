# CI / Deploy Gating — what actually blocks production

_Last updated: 2026-06-02 (audit remediation)._

This note documents a deliberate gap in how CI relates to production deploys, so
on-call and reviewers don't over-trust a green GitHub Actions run.

## The deploy path

Production is deployed by **Vercel's native git integration** on every push to
`main` — not by the `deployment-gates.yml` workflow. The `deployment-gates`
"Deploy to Vercel" job is a no-op (`exit 0`) unless `VERCEL_TOKEN` is set, which
it is not. See memory/`project_prod_supabase_and_deploy`.

## What this means

The GitHub Actions gates (`deployment-gates.yml`, `qa-pipeline.yml`,
`formaos-quality-gates.yml`, `security-*`) run **in parallel** to the real
Vercel build, not as a precondition for it. Consequently:

- **Build and TypeScript errors DO block production** — because Vercel's own
  build runs `next build` (and `check-env` strict) and fails the deploy.
- **Lint, security-baseline, E2E, and Playwright gates do NOT block the Vercel
  deploy.** A push to `main` that fails those GitHub checks still ships if the
  Vercel build itself succeeds.

To make those gates actually block production you would need either Vercel's
"Ignored Build Step" wired to the gate result, or branch protection with the
relevant checks marked **Required** before merge to `main`. That change is
intentionally **out of scope** for the 2026-06-02 audit remediation (it touches
the live deploy pipeline) and is tracked as a follow-up decision.

## Migrations

There are 251 migrations under `supabase/migrations/`. They are applied to prod
**manually** via the Supabase MCP (`apply_migration`) — there is **no automated
`supabase db push` / migration-apply step** in any workflow. The filesystem
migration set is the source of truth operators replay.

Two credential-free CI gates guard this (both blocking, both in
`qa-pipeline.yml`):

1. **Migration parity** (`npm run test:db:migration-parity`) — every migration
   has a unique numeric version prefix and a well-formed filename, so apply
   order is deterministic and unambiguous.
2. **Ledger alignment** (`npm run test:db:ledger-alignment`) — diffs the
   filesystem against the committed `supabase/.migration-ledger-snapshot.json`
   and fails on FS-only-unexplained or ledger-only drift. As of 2026-06-02 this
   gate **fails in CI if the snapshot is missing** (previously it skipped
   silently, turning the gate into a no-op).

Neither gate _applies_ migrations. The residual risk — code shipping that
expects schema not yet applied to prod — is mitigated by applying migrations
**before** merging the dependent code, per `RELEASE_DISCIPLINE_CHECKLIST.md`.
