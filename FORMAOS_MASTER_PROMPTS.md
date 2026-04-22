# FormaOS Master Agent Prompts

## End-to-End Product, Marketing, Backend, and Frontend Audit Prompt

Copy this prompt into a coding agent (Claude Code, VS Code agent) when you want a full FormaOS audit that checks whether the public marketing story, authenticated app, backend behavior, billing, admin console, and QA signals all line up.

```text
You are a coding agent working inside /Users/ejaz/FormaOS.

Your job is to run a serious end-to-end audit of FormaOS and report what is missing, inconsistent, broken, or unsupported. Do not stop at reading code. Run the static checks, run the app, click through real CTAs in a browser, and compare what marketing promises against what the product actually ships.

Core goal:
Marketing pages, authenticated app, backend/API, billing, admin, data layer, and QA signals must all corroborate each other. Where they do not, report the mismatch with evidence and a concrete fix.

## Start here (read, do not skip)

1. Read, in this order:
   - README.md
   - ENGINEERING_CHANGE_MATRIX.md
   - RELEASE_DISCIPLINE_CHECKLIST.md
   - PLATFORM_CONTROL_CONTRACTS.md
   - ADMIN_OPERATING_POLICY.md
   - package.json (scripts + deps)
   - The most recent dated audit report in the repo root (e.g. FORMAOS_CODEBASE_AUDIT_*.md, MARKETING_ENTERPRISE_AUDIT_*.md, APP_LINK_INTEGRITY_REPORT.md, ENTERPRISE_AUDIT_REPORT.md). Use these to avoid relitigating already-known issues — note which findings are still open vs fixed.
2. Run `git status --short`. Do not overwrite, rename, or delete unrelated in-flight files (there are often untracked FORMAOS_MASTER_PROMPTS_V*.md and audit artifacts — leave them).
3. Use the Grep and Glob tools for discovery. Do not shell out to `rg`, `find`, `cat`, or `ls` when a dedicated tool fits.
4. Respect CLAUDE.md — it already wires GitNexus. If GitNexus is available, read `gitnexus://repo/formaos/context` once and use the appropriate gitnexus skill for architecture, impact, debugging, or refactoring questions. Do not duplicate GitNexus searches that CLAUDE.md already covers.
5. Do not deploy, push, force-push, touch production Stripe/Supabase, send email/Slack, or run destructive commands (no `git reset --hard`, no `rm -rf`, no migration rollbacks) unless explicitly asked.

## Pick a tier before starting

Record the tier in the report header. Skip nothing silently.
- **Quick (≤30 min):** static checks + structural grep + skim browser on 4–6 marketing routes. Good for PR-level sanity.
- **Standard (≤90 min, DEFAULT):** full static suite + `qa:smoke` + `qa:a11y` + `test:visual` + manual browser on marketing/auth/app/admin + cross-claim grep.
- **Release-readiness (2–4 hr):** Standard + `test:coverage` + `qa:enterprise` + `test:db` + `test:supabase-health` + `test:compliance:all` + full build.

If env vars or services block a command, record the blocker verbatim and continue. Do not stub values or skip without noting it.

## Audit scope

### Marketing & trust
Inspect `app/(marketing)`, `lib/marketing`, `components/marketing`, public marketing assets, metadata, `app/sitemap.ts`, CTAs, forms, comparison and industry pages, `/pricing`, `/trust` + procurement/security/DPA/subprocessors, `/changelog`, blog, `/contact`/`/demo`/`/assessment`.

Verify no copy claims: features, certifications (SOC 2, ISO 27001, HIPAA), automation, integrations, compliance guarantees, support SLAs, self-serve billing, free trials, or security posture the product does not actually support today. Pricing/plan language must match `lib/billing/*`, Stripe price env aliases, entitlement maps, and in-app plan gates.

CTAs must route to a working destination (no `href="#"`, no 404, no route behind flags the user won't hit).

Visual: check desktop and mobile widths. Flag overlap, broken media, unreadable contrast, layout jumps, weak app screenshots/mockups, and mismatched visual language between marketing and the authenticated app.

### Authenticated app
Inspect `app/app`, `app/onboarding`, dashboard, compliance, evidence, controls, frameworks, reports, tasks, team, settings, billing, notifications, workflows, exports, and role-gated surfaces.

Confirm journeys promised on marketing pages are actually possible in-product. Check empty / blocked / loading / error / permission-denied states and mobile layout. Verify app navigation, sidebar/header, deep links, and cross-links between marketing, auth, and app.

### Backend, API, data
Inspect `app/api`, `app/app/actions`, `lib/**/*` services, Supabase clients, `supabase/migrations`, Trigger jobs (`trigger/`), Stripe webhooks, `openapi.json`, and server-side guards.

Confirm: org scoping, authz, Zod/input validation, CSRF where applicable, rate limiting, structured logging, audit trails, error handling. For admin / control-plane routes: permission gates, reason capture, approval requirements, audit logging. For billing: plan keys, Stripe price IDs/env aliases, lifecycle statuses, blocked/restore behavior, entitlement sync, webhook idempotency.

Do not edit historical migrations. If schema/route mismatch exists, propose a new migration.

### Manual browser verification
1. Start dev server with `npm run dev` (or reuse an existing local server — check port 3000 first).
2. Drive the browser with the `webapp-testing` skill or Playwright MCP. Do not simulate clicks by grepping for hrefs; navigate them.
3. Routes to hit at minimum:
   - Marketing: `/`, `/pricing`, `/product`, `/features`, `/industries`, `/enterprise`, `/trust`, `/trust/procurement`, `/compare`, `/contact`, `/changelog`
   - Buyer CTA paths: from header, footer, pricing cards, trust pages, mobile nav
   - Auth handoff: `/auth/login`, `/auth/signup`, `/signin`, `/join`
   - Product app: `/app` plus onboarding/settings/billing/compliance surfaces reachable in local test mode
   - Admin: `/admin` plus critical admin routes in local founder/test mode
4. For auth simulation, use `NEXT_PUBLIC_TEST_MODE=true` / local founder bypass if wired (check `lib/auth/*` and middleware). If you cannot authenticate, record that explicitly — do not fabricate observations.
5. Test desktop (1440px) and mobile (375px) widths. Save screenshots to `screenshots/audit-YYYY-MM-DD/<route>.png`.
6. Click the actual CTAs. An `href` is not proof the link works.

## Commands (baseline set)

Run these as appropriate for the chosen tier. Record pass/fail/blocked for each.

Fast (always):
- `npm run check-root`
- `npm run check-env`
- `npm run typecheck`
- `npm run lint`
- `npm run audit:marketing-copy`
- `npm run check:app-links`
- `npm run check:admin-nav`
- `npm run check:security-baseline`

Medium:
- `npm run qa:smoke`
- `npm run qa:a11y`
- `npm run test:visual`
- `npm run stylelint`
- `npm run design:check`

Heavy (release-readiness only):
- `npm run build`
- `npm run test:coverage`
- `npm run qa:enterprise`
- `npm run test:db`
- `npm run test:supabase-health`
- `npm run test:compliance:all`

## Compare explicitly

- Marketing claim → product route / component / API / DB proof.
- Pricing plan promise → billing entitlement / config / webhook / app gate proof.
- Trust/security claim → implemented control, policy, audit trail, or a documented limitation.
- CTA promise → actual route, form, auth handoff, or sales outcome.
- App capability → marketing explanation. If the app does something useful that marketing hides, report it.
- Backend invariant → frontend state. If APIs return blocked/pending/error states the UI does not handle, report it.

## When you find problems

1. Capture exact route, file:line, command, screenshot path, or test output.
2. Severity:
   - **P0-Security/Data:** org isolation, authz bypass, secret leak, data loss, billing integrity, audit gap on high-impact mutation.
   - **P0-Buyer/Product:** signup/auth/billing/core buyer or product journey broken.
   - **P1:** public claim unsupported, CTA dead-ends, admin guarantee weak, major app workflow broken.
   - **P2:** confusing UX, missing empty/error state, inconsistent copy, weak visual alignment, partial test gap.
   - **P3:** polish, copy clarity, spacing, non-blocking doc cleanup.
3. Recommend the smallest safe fix.
4. If asked to implement fixes, patch the code, preserve existing patterns, and rerun the relevant validation.

## Output

Write the report to `FORMAOS_AUDIT_<YYYY-MM-DD>.md` in the repo root (overwrite if a same-day file exists, unless user says otherwise). Also print the Executive Summary section to the chat.

Screenshots: `screenshots/audit-<YYYY-MM-DD>/*.png`.
Saved test outputs (if any): `test-results/audit-<YYYY-MM-DD>/*.json|txt`.

Report structure:

# FormaOS End-to-End Audit Report — <YYYY-MM-DD>

## Executive Summary
- Tier run:
- Overall readiness:
- Biggest risk:
- Best immediate fix:
- Verified manually:
- Verified by commands:
- Could not verify (and why):

## Command Results
Table or list. For each command: pass / fail / blocked, duration if notable, and the meaningful failure excerpt.

## Manual Browser Results
Per route: desktop + mobile status, CTA click results, screenshot paths, observed issues.

## Marketing-to-App Alignment
Each mismatch: Severity / Marketing claim (page + quote) / Actual state / Evidence (file:line or screenshot) / Fix.

## App-to-Marketing Gaps
Each: Capability / Product evidence / Suggested marketing update.

## Backend / API / Data Risks
Each: Severity / Area / Evidence / Fix / Validation needed.

## Frontend / UX / Visual Risks
Each: Severity / Route or component / Desktop + mobile impact / Evidence / Fix.

## Security, Admin, Billing, Compliance Notes
Org isolation, CSRF, audit logging, permissions, RLS, Stripe, entitlements, trials, blocked states, compliance/trust claims.

## Prioritized Fix Plan
1. P0-Security/Data
2. P0-Buyer/Product
3. P1
4. P2/P3 polish
5. Tests to add or update

## Release Recommendation
One of: **Ready / Ready after listed fixes / Not ready**. Explain in plain English.

## Delta vs Prior Audit
Reference the most recent prior audit report. List: still-open findings, newly fixed, newly introduced.

## Ground rules
- Be honest. Never claim a route, flow, or fix works without observing it or finding concrete code/test evidence.
- Be practical. Prefer small, high-confidence fixes over broad rewrites.
- Be specific. Every finding cites a route, file:line, command output, or screenshot.
- Keep marketing honest and product strong. FormaOS should sell what it can prove, and the app should deliver what it sells.
```

## Short Version

```text
End-to-end audit of FormaOS from /Users/ejaz/FormaOS. First read README.md, ENGINEERING_CHANGE_MATRIX.md, RELEASE_DISCIPLINE_CHECKLIST.md, PLATFORM_CONTROL_CONTRACTS.md, package.json, and the most recent dated audit report in the repo root. Run `git status --short` — do not overwrite unrelated untracked files.

Pick a tier (Quick / Standard / Release-readiness) and record it. Standard is default.

Check marketing pages, pricing, trust claims, CTAs, authenticated app flows, admin/control-plane behavior, billing, APIs, Supabase schema/RLS, and tests all align. Drive a browser with the webapp-testing skill on desktop (1440) + mobile (375), click real CTAs, and run: check-root, check-env, typecheck, lint, audit:marketing-copy, check:app-links, check:admin-nav, check:security-baseline, qa:smoke, qa:a11y, test:visual. For release-readiness add: build, test:coverage, qa:enterprise, test:db, test:supabase-health, test:compliance:all.

Write the report to FORMAOS_AUDIT_<YYYY-MM-DD>.md, screenshots to screenshots/audit-<YYYY-MM-DD>/. Severity ladder: P0-Security/Data, P0-Buyer/Product, P1, P2, P3. Every finding cites route, file:line, command output, or screenshot. Do not deploy, push, or touch production unless explicitly asked.
```
