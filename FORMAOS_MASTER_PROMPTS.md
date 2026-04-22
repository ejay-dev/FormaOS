# FormaOS Master Agent Prompts — v2

Canonical prompts for running a rigorous, cross-stack audit of FormaOS — and optionally remediating and shipping the fixes — from a single coding-agent session. v2 folds in the lessons from the 2026-04-22 audit+remediation pass: contract parity checks, fix discipline with changelog/version hygiene, known-drift traps, a verification ladder, and a ship protocol.

The prompts below are the contract an agent must follow. If something here conflicts with CLAUDE.md, CLAUDE.md wins.

---

## Prompt A — End-to-End Audit + Remediation (full)

Copy this into Claude Code / VS Code agent when you want both the audit AND optional remediation in one session.

```text
You are a coding agent operating inside /Users/ejaz/FormaOS. Your job is to
execute a serious cross-stack audit of FormaOS, and — if the user authorizes
Remediate mode — apply the smallest safe fixes, verify, and ship. Treat
marketing copy, the authenticated app, backend/API, billing, admin, data, and
QA signals as a single product that must corroborate itself.

## 0. Preflight (do this first, every run)

1. Run `git status --short` and note the branch + any untracked files. Never
   overwrite, rename, or delete unrelated in-flight files (untracked audit
   reports, FORMAOS_MASTER_PROMPTS*.md drafts, etc.).
2. Read, in this exact order:
   - CLAUDE.md (GitNexus wiring, project rules)
   - README.md
   - ENGINEERING_CHANGE_MATRIX.md
   - RELEASE_DISCIPLINE_CHECKLIST.md
   - PLATFORM_CONTROL_CONTRACTS.md
   - ADMIN_OPERATING_POLICY.md
   - package.json (scripts + version)
   - The most recent dated audit report (FORMAOS_AUDIT_<date>.md,
     APP_LINK_INTEGRITY_REPORT.md, MARKETING_ENTERPRISE_AUDIT_*.md,
     ENTERPRISE_AUDIT_REPORT.md). Mark which prior findings are fixed vs open.
3. If CLAUDE.md references GitNexus and the index is not stale, read
   `gitnexus://repo/formaos/context` once and prefer the gitnexus skill for
   architecture / impact / debugging / refactoring questions instead of raw
   grepping.
4. Use the Grep and Glob tools. Do NOT shell out to `rg`, `find`, `cat`,
   `head`, `tail`, `sed`, `awk` when a dedicated tool fits.
5. Record the audit tier AND the operating mode in the report header.

## 1. Pick a tier

Record the tier, skip nothing silently.
- Quick (≤30 min): static checks + grep for parity drift + skim browser on
  4–6 marketing routes. Good for PR-level sanity.
- Standard (≤90 min, DEFAULT): full static suite + qa:smoke + qa:a11y +
  test:visual + manual browser on marketing/auth/app/admin + cross-claim
  grep + targeted jest on changed areas.
- Release-readiness (2–4 hr): Standard + build + test:coverage + qa:enterprise
  + test:db + test:supabase-health + test:compliance:all.

If env vars or external services block a command, record the blocker verbatim
and continue. Do not stub values.

## 2. Pick an operating mode

- **Audit-only** (default): find and report. Do not change code. Do not
  commit. Do not push.
- **Remediate**: the user must explicitly authorize this mode. In Remediate
  mode you may:
    - apply the smallest safe fix for each finding up to the declared severity
      ceiling (e.g. "fix up to P1", or "fix all P's"),
    - add or update tests that protect the fix,
    - update CHANGELOG.md + app/(marketing)/changelog/ChangelogPageContent.tsx +
      package.json version per §6,
    - commit following §7 and push to main (which triggers Vercel deploy) only
      when verification is green per §5.
  You may NOT, in any mode:
    - deploy directly (no vercel CLI, no prod Stripe, no prod Supabase writes),
    - push --force to main, skip pre-commit hooks, or amend a pushed commit,
    - run destructive git commands (reset --hard, branch -D) or rm -rf,
    - edit historical migrations,
    - touch production secrets, send email / Slack, or hit live webhooks.

## 3. Audit scope — what must line up

For every claim/feature, ensure the chain of evidence is consistent across:

  marketing copy  →  pricing config  →  plan catalog  →  Stripe env
                                                     →  entitlement map
                                                     →  in-app UI price / CTA
                                                     →  checkout action
                                                     →  webhook handler
                                                     →  DB CHECK constraint

If any two disagree it's a finding. The authoritative sources are:
- Plan catalog: lib/plans.ts (PLAN_CATALOG, PlanKey)
- Entitlements: lib/billing/entitlements.ts (syncEntitlementsForPlan)
- Stripe mapping: lib/billing/stripe.ts (getStripePriceId)
- DB constraint: the most recent migration constraining
  org_subscriptions.plan_key
- Marketing price copy: lib/marketing/pricing.ts (PUBLIC_PRICING_TIERS) and
  /pricing page components
- In-app upgrade UI: components/billing/* (PlanComparisonTable,
  UpgradeIntelligenceModal, plan-gates, trial banners)
- Checkout: app/app/actions/billing.ts (startCheckout) + app/api/billing/* routes

Any hardcoded price, plan key, or feature claim outside these files is a
defect. Grep explicitly for: `\$\d{2,4}(?:,\d{3})?\s*(?:\/|per|\s*/mo)` to
find rogue prices; for `'starter'` to find legacy-plan drift; for feature
names (`'SSO'`, `'SAML'`, `'SOC 2'`, `'HIPAA'`) to confirm they resolve to a
real control or a documented limitation.

### 3a. Marketing & trust
Inspect app/(marketing), lib/marketing, components/marketing, public assets,
metadata, app/sitemap.ts, CTAs, forms, comparison and industry pages,
/pricing, /trust + procurement/security/DPA/subprocessors, /changelog, blog,
/contact, /demo, /assessment. Flag any claim the product cannot honor
today (certifications, automation, integrations, SLAs, self-serve states,
trials).

### 3b. Authenticated app
Inspect app/app, app/onboarding, dashboard, compliance, evidence, controls,
frameworks, reports, tasks, team, settings, billing, notifications,
workflows, exports, role-gated surfaces. Confirm every journey marketing
promises is reachable in-product. Check empty / blocked / loading / error /
permission-denied states, mobile layout, deep links, and that in-app upgrade
notifications end in a successful Stripe checkout (or a documented sales path).

### 3c. Backend / API / data
Inspect app/api, app/app/actions, lib/**, Supabase clients,
supabase/migrations, trigger/, Stripe webhooks, openapi.json, server guards.
For every mutating route confirm: org scoping, authz (role gate), Zod input
validation, CSRF validation where applicable, rate limiting, structured
logging, audit trails, idempotency on webhooks. Never edit historical
migrations — propose a new one.

### 3d. Admin & control plane
Reason capture, approval requirements, audit logging, permission gates,
founder bypass boundaries. Confirm every admin mutation writes to
admin_audit_log and every plan change calls syncEntitlementsForPlan for
every tier (basic, pro, enterprise) not just a subset.

## 4. Known-drift traps (grep these every run)

These bit us before. Re-check them by default; do not rely on memory.

- **Plan vocabulary drift:** canonical PlanKey is `basic | pro | enterprise`
  (lib/plans.ts) enforced by the org_subscriptions CHECK constraint. The
  legacy column `plan_code` uses `starter` (not `basic`). `SUBSCRIPTION_PLANS`
  in lib/billing/plans.ts is keyed by the legacy code. Anywhere that reads
  `SUBSCRIPTION_PLANS[plan_key]` directly is a bug.
- **Hardcoded UI prices:** grep components/billing/** for price literals.
  Every number must come from PLAN_CATALOG; enterprise must render "Custom"
  (priceMonthly === 0) and route to /contact, not Stripe.
- **Dead code in components/billing/** — e.g. billing-dashboard.tsx shipped
  unused. Confirm every exported surface has at least one import.
- **Admin entitlement gates:** any branch that skips
  syncEntitlementsForPlan for specific plans is suspect.
- **Legacy Stripe imports:** `@/lib/billing` (lib/billing.ts) is the legacy
  bundle; new code should import from `@/lib/billing/stripe`. Tests that
  import from `@/lib/billing` may be intentional — verify before "fixing".
- **Playwright managed dirs:** never redirect audit artifacts into
  `test-results/`; Playwright wipes it. Use `artifacts/audit-<date>/` instead.
- **proxy.ts vs middleware.ts:** Next.js 16 uses `proxy.ts`. Don't
  reintroduce `middleware.ts`.
- **Hook bypasses:** never use `--no-verify`, `--no-gpg-sign`,
  `-c commit.gpgsign=false`, `--amend` on a pushed commit, or
  `git reset --hard` without explicit user approval.

## 5. Commands matrix + verification ladder

Run commands appropriate for tier. Record pass / fail / blocked for each.

Static (every tier):
- npm run check-root
- npm run check-env
- npm run typecheck
- npm run lint
- npm run audit:marketing-copy
- npm run check:app-links
- npm run check:admin-nav
- npm run check:security-baseline

E2E / visual (Standard+):
- npm run qa:smoke
- npm run qa:a11y
- npm run test:visual
- npm run stylelint
- npm run design:check

Release-readiness only:
- npm run build
- npm run test:coverage
- npm run qa:enterprise
- npm run test:db
- npm run test:supabase-health
- npm run test:compliance:all

After ANY fix, run the targeted ladder based on what changed:

| Changed area | Minimum re-run |
|---|---|
| lib/plans.ts, lib/billing/plans.ts, pricing | typecheck, lint, jest billing+plans suites, check:app-links, audit:marketing-copy |
| app/api/** or app/app/actions/** | typecheck, lint, targeted jest for the route, qa:smoke |
| components/billing/** or components/dashboard/** | typecheck, lint, test:visual, qa:a11y |
| app/(marketing)/** | check:app-links, audit:marketing-copy, test:visual |
| supabase/migrations | test:db, test:supabase-health (release-readiness) |
| lib/security/** or middleware/proxy | check:security-baseline, qa:smoke |

Known flakes: qa:smoke includes a Supabase-auth signup journey that depends
on live-ish env vars. If it fails on password-policy or mailbox delivery
and the rest of smoke is green, document it — do not retry blindly.

## 6. Fix discipline (Remediate mode only)

- Smallest safe fix. No refactors, no new abstractions, no "while I'm here".
- Every user-visible fix must co-ship:
    1. The code change.
    2. A line in CHANGELOG.md under a new (or current) dated version entry.
    3. A matching release entry in
       app/(marketing)/changelog/ChangelogPageContent.tsx
       (`releases` array) — include codename, date, summary, and one change
       per fix with an appropriate tag (`feature | fix | improvement`).
    4. A package.json version bump if the aggregate is user-visible
       (usually minor bump for a coordinated fix pass).
- Every in-app price or feature claim must derive from PLAN_CATALOG /
  entitlement map. Never hardcode.
- Every mutating API route must have: zod schema, auth check, org scope,
  role gate, audit log, idempotency where relevant.
- Never widen public exports to "make a test pass" — fix the test's import.
- Never edit historical migrations. Add a new one.
- Never bypass hooks or amend shared commits.

## 7. Ship protocol (Remediate mode only)

Before committing:
- All §5 commands relevant to the touched surfaces are pass/expected-skip.
- `git status --short` shows only files you intended to touch (inspect
  untracked files; do not blindly `git add -A`).
- Verification artifacts are written to artifacts/audit-<date>/, not
  test-results/.

Commit:
- Stage explicit paths, never `.` or `-A`.
- Conventional-commit subject (`fix:`, `feat:`, `chore:`, `test:`, `docs:`).
- Body: 3–8 bullets, past tense, why over what.
- Trailer: `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
- Use HEREDOC (`git commit -m "$(cat <<'EOF' ... EOF)"`) for correct formatting.
- Do NOT `--amend` a published commit. If a pre-commit hook fails, fix the
  issue and create a NEW commit.

Push:
- Push only to `main` (or the branch the user named).
- `git push origin main` — Vercel auto-deploys from main. Print the commit
  SHA + the GitHub commit URL when the push completes.
- Never `--force` push to main.

Post-push:
- Tell the user: commit URL, what verification ran, any known skips, and
  the expected Vercel deploy window.

## 8. Severity ladder

- **P0-Security/Data** — org isolation break, authz bypass, secret leak,
  data-loss risk, billing integrity break, audit gap on a high-impact
  mutation, silent payment mismatch.
- **P0-Buyer/Product** — signup / auth / billing / core buyer or product
  journey broken; marketing price ≠ charged price; upgrade CTA dead-ends.
- **P1** — public claim unsupported with no documented caveat; admin
  guarantee weak; major app workflow broken; missing zod/role-gate on
  mutating route.
- **P2** — confusing UX, missing empty/error state, inconsistent copy, weak
  visual alignment, partial test gap, legacy-vocabulary drift with no
  user impact today.
- **P3** — polish, copy clarity, spacing, non-blocking docs, env alias
  cleanup, dead-code removal.

Every finding cites: route, file:line, command output or screenshot path,
and a concrete fix.

## 9. Manual browser verification

Start the dev server with `npm run dev` (or reuse an existing one on :3000).
Drive it with the webapp-testing skill or Playwright MCP. Do not substitute
grep for clicks.

Minimum route set:
- Marketing: /, /pricing, /product, /features, /industries, /enterprise,
  /trust, /trust/procurement, /compare, /contact, /changelog
- Buyer CTAs: header, footer, pricing cards, trust modules, mobile nav
- Auth: /auth/login, /auth/signup, /signin, /join
- App: /app + onboarding / settings / billing / compliance / team
- Admin: /admin + critical admin routes (local founder/test mode)

For each: test at 1440px and 375px. Click the real CTAs. For upgrade CTAs,
confirm they reach /app/billing AND that Stripe checkout starts with the
right price (or routes to sales for enterprise).

Save screenshots to screenshots/audit-<YYYY-MM-DD>/<route>.png. If auth is
unavailable, note it; do not invent observations.

## 10. Output

Write the report to FORMAOS_AUDIT_<YYYY-MM-DD>.md in the repo root (overwrite
if the same date already exists, unless the user says otherwise). Print the
Executive Summary section to the chat.

Screenshots: screenshots/audit-<YYYY-MM-DD>/
Saved logs (if any): artifacts/audit-<YYYY-MM-DD>/

Report structure:

# FormaOS End-to-End Audit — <YYYY-MM-DD>

## Executive Summary
- Tier:
- Mode: Audit-only | Remediate (severity ceiling: P?)
- Overall readiness:
- Biggest risk:
- Best immediate fix:
- Verified manually:
- Verified by commands:
- Could not verify (and why):
- If Remediate: commit SHA + push status + expected Vercel deploy window.

## Command Results
Table: command | pass/fail/blocked | duration | meaningful failure excerpt.

## Manual Browser Results
Per route: desktop + mobile status, CTA clicks, screenshot paths, issues.

## Contract Parity Checks
For each parity chain in §3: ✅ aligned OR ❌ mismatch with evidence + fix.

## Findings (by severity)
For each finding:
- id: F-<date>-<n>
- severity
- title
- route / file:line / command / screenshot
- current state
- expected state
- smallest safe fix
- validation needed after fix

## If Remediate mode
### Fixes Applied
id | severity | files changed | verification re-run | result
### Co-shipped
- CHANGELOG.md entry (version + date)
- app/(marketing)/changelog entry (codename + date)
- package.json version bump
- tests added/updated
### Ship
- commit SHA + URL
- push target
- post-push verification

## Delta vs Prior Audit
Open → still open | Open → fixed now | Newly introduced

## Release Recommendation
Ready / Ready after listed fixes / Not ready — in plain English.

## Prompt Feedback (optional)
If this prompt was hard to follow, missing a trap, or contradicted itself,
say so. The next run's prompt improves from here.

## 11. Ground rules

- Honest: never claim a route, flow, or fix works without observing it or
  concrete code/test evidence.
- Specific: every finding cites route, file:line, command output, or screenshot.
- Small: prefer a small high-confidence fix over a broad rewrite.
- Truthful marketing: FormaOS should sell only what it can prove; the app
  must deliver what it sells.
- Reversible: before any action that's hard to undo (force push, history
  rewrite, migration rollback, mass rename), stop and confirm.
```

---

## Prompt B — Short version (one-shot, Audit-only)

```text
End-to-end audit of FormaOS from /Users/ejaz/FormaOS in Audit-only mode.
First read CLAUDE.md, README.md, ENGINEERING_CHANGE_MATRIX.md,
RELEASE_DISCIPLINE_CHECKLIST.md, PLATFORM_CONTROL_CONTRACTS.md, package.json,
and the most recent dated audit report. Run `git status --short` — do not
touch unrelated untracked files. Pick a tier (Quick / Standard /
Release-readiness; Standard is default) and record it.

Check the parity chain: marketing copy → PLAN_CATALOG → Stripe env →
entitlement map → in-app UI price/CTA → checkout action → webhook → DB
CHECK constraint. Flag every mismatch. Grep for hardcoded prices in
components/billing/**, for `'starter'` plan drift, and for any admin
mutation that skips syncEntitlementsForPlan or zod/role gates.

Drive the browser with the webapp-testing skill on 1440 + 375 across /,
/pricing, /product, /enterprise, /trust, /compare, /contact, /changelog,
/auth/signup, /app, /admin. Click real CTAs. Upgrade CTAs must reach
/app/billing and start a Stripe session with the correct price (or route
enterprise to sales).

Run: check-root, check-env, typecheck, lint, audit:marketing-copy,
check:app-links, check:admin-nav, check:security-baseline, qa:smoke,
qa:a11y, test:visual. Release-readiness adds build, test:coverage,
qa:enterprise, test:db, test:supabase-health, test:compliance:all.

Save the report to FORMAOS_AUDIT_<YYYY-MM-DD>.md, screenshots to
screenshots/audit-<YYYY-MM-DD>/, logs to artifacts/audit-<YYYY-MM-DD>/.
Never redirect logs into test-results/ (Playwright wipes it).

Severity: P0-Security/Data, P0-Buyer/Product, P1, P2, P3. Every finding
cites route, file:line, command output, or screenshot.

Do not commit, push, deploy, touch prod Stripe/Supabase, or edit historical
migrations. If the user subsequently asks for Remediate, switch to Prompt A
§§6–7 for fix discipline and ship protocol.
```

---

## Prompt C — Remediate + Ship (shortcut)

Use when you've already run an audit and want the agent to fix + ship in the
same session.

```text
Operate in Remediate mode per FORMAOS_MASTER_PROMPTS.md Prompt A §§2, 6, 7.
Severity ceiling: <P0 | P1 | P2 | P3> (inclusive — fix everything at or
above this level). Source of findings: <FORMAOS_AUDIT_<date>.md | this
chat | both>.

For every fix:
- smallest safe change,
- update CHANGELOG.md + app/(marketing)/changelog/ChangelogPageContent.tsx
  + bump package.json version,
- re-run the verification ladder for the touched surface (§5),
- keep /pricing, PLAN_CATALOG, in-app upgrade UI, and Stripe price IDs in
  lock-step,
- never hardcode a price, never skip syncEntitlementsForPlan, never edit
  historical migrations, never bypass hooks.

When all fixes pass verification, commit with a conventional-commit
subject and the Co-Authored-By trailer, push to main, and return:
- commit SHA + GitHub URL,
- list of checks re-run and their results,
- any known skips (call out env-dependent flakes like the qa:smoke signup
  journey rather than retrying blindly),
- expected Vercel deploy window.

Do not force-push. Do not amend after push. Do not deploy outside Vercel's
main-triggered pipeline.
```

---

## Notes for whoever edits this file next

- v2 is tuned to how FormaOS actually behaves as of 2026-04-22: PLAN_CATALOG
  is the canonical plan source, SUBSCRIPTION_PLANS is legacy, proxy.ts is
  middleware, org_subscriptions.plan_key has a DB CHECK constraint. Revisit
  §3 "authoritative sources" and §4 "known-drift traps" whenever any of
  those change.
- Keep the parity chain in §3 and the traps in §4 short — if the list gets
  long the agent starts skimming. Retire a trap once the underlying
  vocabulary drift is collapsed.
- The verification ladder in §5 is the single biggest time-saver. Update it
  when a new targeted command (e.g. `npm run test:plans`) lands.
- Don't delete Prompt B. Agents running under a tight budget need the
  one-shot version.
