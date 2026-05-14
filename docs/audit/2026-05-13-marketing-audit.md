# FormaOS Marketing Site Audit — 2026-05-13

Scope: the public marketing site at `www.formaos.com.au` (the apex
`formaos.com.au` returns a `308` to the `www` host, which is correct).

This audit is **read-only**. No code changes, no PRs, no merges. The
parallel session that owns `/app/*` will read this file and decide
which findings to promote into its repair queue.

Out of scope by directive: `/app/*`, and the `/pricing` redesign work
queued for Phase D. Pricing-only findings are filed in §N+2 ("Phase D
notes") rather than the main repair queue.

## §1 — Methodology

1. Fetched `robots.txt` and `sitemap.xml`. Both returned `200`. The
   sitemap declared **82 URLs**.
2. Built a working URL list by union'ing the sitemap with the user's
   page checklist (added `/terms`, `/legal/cookies`, `/legal/dpa` even
   though not in sitemap — they were on the user's "if present" list).
   Final corpus: **85 URLs**.
3. Status-checked every URL with `curl -s -o /dev/null -w "%{http_code}"`.
   Only three non-`200` results — see §2.
4. Pulled the rendered HTML for every URL with `curl` into
   `/tmp/forma-html/*.html` for static analysis (SEO meta, JSON-LD,
   heading order, links, mailto:, raw `{{var}}` leaks, dated copy,
   form markup).
5. Used **WebFetch** for content-quality review on the 25 highest-
   weighted pages (home, product, features, pricing, security,
   trust, enterprise, contact, the five industry verticals, the six
   use-cases, three legal pages, the four trust subpages with named
   findings, four compare pages, blog index + one representative
   post, status, integrations, faq, documentation, changelog,
   roadmap, customer-stories, about, our-story, enterprise-proof).
6. Verified the security-header surface with `curl -I` against the
   home page. Spot-checked CSP, HSTS, X-Frame-Options, Referrer-
   Policy, Permissions-Policy, X-Content-Type-Options.
7. Cross-referenced visible footer copy against machine-readable
   JSON-LD on each page (address, contact email, founding date) —
   this surfaced the biggest single class of trust regressions.

What this audit **does not** cover:
- Lighthouse / Core Web Vitals — could not run from this environment.
  Performance observations below are limited to HTML weight and
  render-blocking surface area visible in the static response.
- Live keyboard-trap or focus-ring testing — would require a browser.
- Form submission round-trips — the contact endpoint is CSRF-gated
  (returns `403` to unauthenticated POSTs from `curl`), so server-
  side validation behaviour was inferred from prior audit
  (`2026-05-12-deep-audit.md`, finding #4) and from the visible CTA
  query-string contract (`?type=compliance-plan|demo|sales|security-review|procurement`).

All "(verify)" tags below mean "I am confident this is a finding,
but it deserves a browser-based confirmation before any code change."

## §2 — Summary

| Severity | Count |
|----------|-------|
| CRIT     | 3     |
| HIGH     | 14    |
| MED      | 22    |
| LOW      | 11    |
| **Total** | **50** |

Pages I could not reach: **0**. All 85 URLs resolved; 82 returned
`200`, one returned `308` (`/terms` → `/legal/terms`, correct), two
returned `404` (`/legal/cookies`, `/legal/dpa` — neither is in the
sitemap, and the user's brief flagged them as "if present").

Headline issues (by impact):

1. **The site-URL constant has a stray `\n`.** `sitemap.xml`,
   `robots.txt`, and the JSON-LD `Organization` / `SoftwareApplication`
   blocks on every page emit URLs like `https://www.formaos.com.au\n/about`.
   Search engines drop those entries. Single CRIT bug, site-wide
   blast radius.
2. **`/status` lies.** Header says "All systems operational" (hard-
   coded green pulse), body shows `0%` 7-day uptime and `0` checks.
   For a B2B compliance platform whose buyers visit `/status` during
   procurement, this contradiction is a trust kill.
3. **Visible vs structured-data identity mismatch.** Footer says
   `Formaos.team@gmail.com` + "Sydney"; JSON-LD says
   `support@formaos.com.au` + "Adelaide, SA". Same 82 pages.
   Buyers and Google see different companies.
4. **`/pricing` hides prices that the industry pages publish.** The
   childcare, construction, and healthcare pages each show
   `Foundation $297 / Growth $797 / Scale $1,800 / Enterprise custom`.
   `/pricing` itself shows zero dollar amounts and routes everyone
   to `/contact`. Anyone comparing the two will lose trust.
5. **18+ frameworks listed across `/security`, `/trust`, and
   industry pages with no "certified / in-progress / supported"
   status.** Critical for enterprise security review — buyers
   reading "SOC 2" and "ISO 27001" assume certification.
6. **Duplicate `<h1>` tags on 67 of 85 pages** — server-rendered
   heading plus a hydrated copy with a different class signature.
   A11y + SEO regression.
7. **`/trust/sla` has no SLA number** and self-disclaims with
   "Uptime signals are not a contractual SLA unless incorporated
   into your agreement." The page exists but says nothing
   contractual.
8. **`/features` arithmetic is wrong**: claims "18 features"; the
   five category counts sum to 25.

## §3 — Cross-cutting (do these first)

| # | Sev  | Where | Observation | Suggested fix hint |
|---|------|-------|-------------|--------------------|
| 1 | CRIT | `sitemap.xml`, `robots.txt`, JSON-LD on every page | A `SITE_URL` (or equivalent) constant is built with a trailing newline. Raw bytes of `<loc>` are `https://www.formaos.com.au\n/about`. `robots.txt` has `Sitemap: https://www.formaos.com.au\n/sitemap.xml`. Home JSON-LD: `"url":"https://www.formaos.com.au\n","logo":"https://www.formaos.com.au\n/og-image.png"`. Confirmed via `xxd` and grep across all 85 pages. **Shipped in #67** — `.trim()` at `config/brand.ts:siteUrl/appUrl`, one fix for sitemap+robots+JSON-LD. | Locate the constant (likely env var `NEXT_PUBLIC_SITE_URL` or a template literal in `lib/seo` / `app/sitemap.ts` / `app/robots.ts`); strip trailing whitespace at consumption or trim at the source. One fix corrects sitemap, robots, and all JSON-LD simultaneously. |
| 2 | CRIT | `/status` | "All systems operational" banner with `0%` 7-day uptime, `0` 24h uptime, `0` 7-day checks, "No recent check data available". Monitoring data isn't reaching the page. **Shipped in #68** — page deleted, sitemap entry removed, footer pulse pill removed, 307 redirect added, four trust-page references and the /legal index card all stripped. The cron + public-uptime data pipeline + DB tables were intentionally left in place per directive (used by `app/api/trust-packet/vendor`). | Either gate the green badge on real data, or surface "monitoring data unavailable" honestly. Procurement teams screenshot this. |
| 3 | HIGH | Every page footer + every JSON-LD block | Two contradictory identities on the same 82 pages: footer mailto `Formaos.team@gmail.com` (Gmail) vs JSON-LD `contactPoint.email: support@formaos.com.au`. JSON-LD says `addressLocality: Adelaide, addressRegion: SA`; visible footer + contact page say "Sydney, Australia". **Shipped in #70** — `config/brand.ts` now holds canonical `contactEmail` + `address`; Footer reads from there; 9 other marketing files had the Gmail literal replaced with `support@formaos.com.au`. | Pick one address + one contact email; mirror across visible copy and JSON-LD. The Gmail address on the visible side is the trust-side risk — a Gmail support address for a SOC 2 / ISO-claiming platform is a red flag in vendor-assurance reviews. |
| 4 | HIGH | `/security`, `/trust`, all industry pages | 18+ frameworks listed (SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, NIST CSF, CIS Controls, etc.) with no certification-status qualifier — no "certified", "in progress", "supported", or "ready" anywhere on the public surface. Enterprise buyers reading "SOC 2" assume Type II certification. **Shipped in #81** — user decision: allowed labels are "Framework supported" / "In development" / "Custom"; disallowed without paper: "Certified", "Audited", "Compliant", "Accredited". Fixed ProductHeroVisual, FinalSecurityCTA, SecurityArchitecture, TrustModules, /trust/dpa. Demo dashboard mocks (sandbox/playground, /construction-compliance dashboard pills, /about DemoAuditTrailCard) kept their fictional state strings — flagged in the PR body for spot-check, not modified. | Add a single status taxonomy ("Certified" / "Audit-ready" / "Supported framework") and apply it everywhere a framework name appears in trust context. |
| 5 | HIGH | 67 of 85 pages | Two `<h1>` elements rendered per page with different Tailwind class signatures (`text-[2.35rem] ...` and `text-[2.5rem] ...`). Most visible on `/contact` and `/blog` where both `<h1>`s carry the same text. Looks like the marketing layout's hero heading and the page-level heading both render as `h1`. A11y violation and SEO confusion. **Shipped in #80** — removed the redundant `<noscript>` `<h1>` block from `ImmersiveHero` + `CompactHero`; verified `/contact` and `/trust/sla` curl outputs go from 2 h1 → 1. | Demote one to `h2` (probably the layout-level hero subtitle, or wrap it in a `role="banner"` block with `h1` only for the page-specific heading). |
| 6 | HIGH | `/features` | Hero claim says "18 features across compliance, automation, security, and collaboration." Category counts immediately below sum to 5+6+4+7+3 = **25**, not 18. **Shipped in #79** — verified data array contains 25 features across 5 categories; aligned all three visible strings (hero subtitle, secondary section, metadata description) to 25/5. | Fix the hero number or the category counts; they should match. |
| 7 | HIGH | Top nav (every page) | Primary nav surfaces only "Home", "Pricing", and the "Get Compliance Plan" CTA. Product, Features, Industries, Trust, Compare, Customer Stories — all the buyer-journey pages — are footer-only. First-time enterprise visitors hit a wall. | Add at least Product, Industries, and Trust to the primary nav. |
| 8 | HIGH | `/security`, `/trust`, every industry page | "Trusted by" claims and feature claims appear without any third-party verification anchor. `/customer-stories` is honest ("Anonymized scenarios"), but the home page implies real trust. **Shipped in #82** — user decision: replace fabricated 8-name customer-logo strip on homepage with a "Built on" tech-partner strip (Vercel, Supabase, Stripe, Sentry, Resend) and drop all `socialProof="Trusted by …"` props from the 5 industry pages. Heading copy reframed from "Trusted by regulated teams across Australia" to capability/intent framing across `TestimonialsSection`, `SecuritySection`, `our-story` body, `ndis-providers` metadata, `TrustBar` pill, and `IndustryHero` docstring (now forbids the "trusted by [customers]" pattern at the component level). | Either name a small number of pilot customers (with permission) or remove ambiguous "trusted by" framing. |
| 9 | MED  | Whole site | SEO URL cannibalization: 3 healthcare pages (`/healthcare-compliance`, `/healthcare-compliance-platform`, `/use-cases/healthcare`), 3 NDIS pages (`/ndis-providers`, `/ndis-compliance-system`, `/use-cases/ndis-aged-care`), 2 financial pages (`/financial-services-compliance`, `/use-cases/financial-services`). All targeting overlapping search intents. Google will pick one and ignore the others, or split rank between them. **Shipped in this PR** — user chose full 308 consolidation. Industry money pages are canonical: `/healthcare-compliance`, `/ndis-providers`, `/financial-services-compliance`. The other 5 routes are deleted and 308-redirected to the canonical, with link-safety sweep updating internal references (Industries, ComparePageTemplate, AuditEvidenceContent, WhatIsCosContent, sitemap, portal media, 3 E2E specs) to point at canonicals directly so no internal navigation pays a redirect hop. | Consolidate to one canonical per industry; the others should `301` or carry a `rel="canonical"` to the primary. |
| 10 | MED | Whole site | ~42 of 85 pages have **no `og:image`** (verified by parsing every static HTML response). Pages missing OG image include `/features`, `/enterprise`, `/integrations`, `/faq`, `/contact`, `/customer-stories`, `/documentation`, `/changelog`, `/roadmap`, all six `/use-cases/*`, all six trust subpages with the exception of `/trust/dpa`. Social previews on LinkedIn/Twitter fall back to text. | Add `opengraph-image.tsx` (or `opengraph-image.png`) to each page directory; Next.js convention will pick it up. The home, about, and blog-post directories already have one — same pattern. |
| 11 | MED | `/contact`, footer (every page) | Visible support email is `Formaos.team@gmail.com`. For the audience FormaOS is selling to (NDIS providers, AHPRA-regulated practices, AFS licensees, SOC 2 buyers), a Gmail address on the support surface materially weakens vendor-assurance reviews. Note this is consistent with JSON-LD finding #3 but worth its own line — the visible-side change is the user-facing fix. **Shipped in #70** (rolled into the #3 fix). | Replace with `support@formaos.com.au` site-wide. DNS already supports it (Resend is in the subprocessor list, and JSON-LD already uses the address). |
| 12 | MED | Many pages | Top-level page titles run **>60 characters** on at least 22 pages, including `/`, `/pricing`, `/ndis-providers`, `/healthcare-compliance`, `/healthcare-compliance-platform`, `/childcare-compliance`, `/construction-compliance`, `/audit-evidence-management`, all four `/compare/*`. Google truncates around 60. Most of these include "\| FormaOS" + a tagline that's already in the meta description. | Tighten title to `<Action verb> — <vertical> \| FormaOS` shape; move the long-tail to the description. |
| 13 | MED | Many pages | Meta description >170 characters on ~16 pages (`/`, `/pricing`, `/features`, `/compare`, `/enterprise`, `/childcare-compliance`, `/construction-compliance`, `/financial-services-compliance`, `/healthcare-compliance-platform`, `/ndis-compliance-system`, `/ndis-providers`, `/integrations`, `/roadmap`, `/what-is-a-compliance-operating-system`, plus two blog posts). Google truncates around 155–160. | Trim to ≤160 chars. |
| 14 | MED | Many pages | Meta description **<100 characters** on `/status` (44), `/terms` (39), `/trust/data-handling` (74), `/trust/subprocessors` (71), `/trust/sla` (89), `/trust/dpa` (95), `/trust/incident-response` (84), `/trust/procurement` (82), `/evaluate` (84), `/legal` (99), `/our-story` (93), `/prove` (97). Short descriptions waste SERP real estate. | Expand to ~140–155 chars; trust pages especially deserve a real summary. |
| 15 | MED | Whole site | The CSP allows `'unsafe-inline'` for `script-src` and `style-src`. The `2026-05-12-deep-audit.md` already flagged this (finding #11) — listing here so the marketing-side awareness is on record. No new code change implied. | Defer to existing finding. |
| 16 | MED | Home + JSON-LD on every page | Organization JSON-LD `sameAs` lists `https://twitter.com/EjazDev` — that's the founder's personal handle, not a company handle. Treated by knowledge-graph indexers as the company's social profile. **Shipped in #78** — dropped the personal handle; LinkedIn company page is the only `sameAs` until a company X handle exists. | Replace with a company handle, or drop the `sameAs` Twitter entry until one exists. |
| 17 | LOW | All pages | `x-xss-protection: 1; mode=block` is sent in headers. The header is deprecated; modern browsers ignore it. Not harmful, just dead weight. **Shipped in #TBD (LOW batch 1)** — dropped from `next.config.ts`. Replaced with a comment that documents the why and points at CSP + Trusted Types as the current XSS defense. | Drop from `next.config.ts` headers config. |
| 18 | LOW | Home `<head>` | HTML response is **202 KB** uncompressed (`/`), `112 KB` (`/pricing`), `86 KB` (`/features`). The home weight in particular is dominated by the streaming RSC payload. Likely fine after gzip/brotli but worth a Lighthouse pass before any LCP improvement work. | (verify) Lighthouse pass before assuming this matters. |
| 19 | LOW | Site-wide footer mailto | Two raw HTML files (`trust/subprocessors.html`, `trust/dpa.html`) contain a JSON-escaped `mailto:Formaos.team@gmail.com\"` in the streaming payload, which looks like a backslash leak. Verified — it's just JSON escaping, not user-visible. No action needed; noting so the next grep doesn't trip on it. | — |

## §4 — Per-page findings

### §4.1 `/` (Home)

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 20 | HIGH | Top nav | Only "Home" + "Pricing" + "Get Compliance Plan" visible. No Product / Industries / Trust above the fold. See cross-cutting #7. | — |
| 21 | MED  | Hero stat block | Visible stats — "94% Posture", "47/50 Active Controls", "312 Evidence Items", "9 Frameworks", "Nodes 18 / Edges 22 / Coverage 100%" — read as live metrics but are demo numbers. No "example" caption. First-time visitor cannot tell they're not your real metrics. (verify) | Caption or visual treatment that flags them as illustrative. |
| 22 | MED  | "Trusted surface" line | Subtitle "Trusted surface NDIS AHPRA ISO 27001 SOC 2" reads ambiguously — these are *frameworks*, not customers, but the word "trusted" implies third-party endorsement. | Reword to "Built around NDIS / AHPRA / ISO 27001 / SOC 2" or similar. |
| 23 | LOW  | Hero CTA | `Sign in` button → `https://app.formaos.com.au/auth/signin` (correct). `Get Compliance Plan` → `/contact?type=compliance-plan&source=home_hero` (correct). `Book Demo` → `/contact?type=demo&source=home_hero` (correct). All four hero CTAs reach a valid destination. | — |

### §4.2 `/product`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 24 | LOW  | `/marketing-media/product.jpg` reference | Image is referenced in HTML but the file's alt text is not in the static markup (likely set client-side). (verify) | Confirm alt text in browser. |
| 25 | LOW  | Section terminology | Uses "Compliance Operating System" and "Governed System" interchangeably. Slight terminology drift from `/what-is-a-compliance-operating-system` which fixes the term. **Shipped in #TBD (LOW batch 4).** Canonical phrase is "Compliance Operating System". Two drift sites swept: `ProductScrollHero` headline ("a Governed System" → "a Compliance Operating System") and `ROIMetrics` body copy ("outside a governed system" → "outside a compliance operating system"). `grep -rn 'Governed System\|governed system' app/ components/` returns zero matches after the change. | Pick one phrase per page or use a glossary. |

### §4.3 `/features`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 26 | HIGH | Hero count | "18 features" claim vs categories summing to 25. See cross-cutting #6. | — |
| 27 | MED  | Heading hierarchy | `h1 → h3 → h4` (skips `h2`). WCAG AA violation. | Restructure to `h1 → h2 → h3`. |
| 28 | LOW  | Category labels | Categories use generic names ("Compliance Core", "Identity & Security") but individual feature names are not enumerated — only counts. Reduces SEO surface and makes it hard for a buyer to skim. **Shipped in #TBD (LOW batch 4).** Root cause was that the detailed feature grid lives behind a `DeferredSection` IntersectionObserver, so individual feature titles never made it into the initial SSR HTML (verified by `curl /features` — zero feature names returned). Fix: new `FeatureCatalogIndex` component renders all 25 feature titles grouped by category in the SSR path, using native `<details>` so sighted users can collapse what they don't need while keeping every title in the DOM for crawlers. Inserted between `StatsSection` and the deferred feature grid. | Consider listing individual feature names; current "5 features" / "6 features" reads as marketing hand-wave. |

### §4.4 `/security`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 29 | HIGH | Framework grid | Lists ISO 27001, SOC 2, GDPR, NIST CSF, PCI DSS, HIPAA, CIS, ISO 9001, AHPRA, ASIC s912A, APRA CPS 230, AUSTRAC AML/CTF, NDIS Practice Standards, Aged Care Quality Standards with no certification status. See cross-cutting #4. | — |
| 30 | MED  | Missing OG image | See cross-cutting #10. | — |
| 31 | LOW  | "Tamper-Evident Logs" and "Chain of Custody" claims | These are strong technical claims. Worth backing with a sentence on the algorithm/anchor (hash chain? append-only log?) on this page or a one-click link to `/trust/data-handling`. (verify) | — |

### §4.5 `/trust`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 32 | HIGH | Trust hub | Page links out to `/trust/packet`, `/security-review`, `/contact`, `/security`, `/pricing`, `/compare` — but **does not link to** `/trust/dpa`, `/trust/sla`, `/trust/data-handling`, `/trust/subprocessors`, `/trust/incident-response`, `/trust/vendor-assurance`, or `/trust/procurement`. The trust hub effectively orphans its own subpages, which is the worst case — Google reaches them via sitemap but visitors can't browse to them. | Add a "Documents" section linking each `/trust/*` subpage with a one-line description. |
| 33 | MED  | Support email | Footer + body still surface `Formaos.team@gmail.com` on the trust center, which is the page where it does the most damage. See cross-cutting #11. | — |

### §4.6 `/trust/sla`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 34 | HIGH | Whole page | Page is titled "SLA" but contains **no uptime percentage**, **no credit policy**, and the body explicitly says "Uptime signals are not a contractual SLA unless incorporated into your agreement." Response-time tiers list "Standard email support; response time varies" for Foundation. An SLA page that disclaims itself signals "we don't have one yet." | Either publish a real SLA (e.g. 99.5% / 99.9% / 99.95% by tier with credits) or rename the page to "Support tiers" / "Response expectations" — the current title sets the wrong expectation. |

### §4.7 `/trust/dpa`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 35 | MED  | "Request a signed DPA" | Section says "Contact us to request" and the contact email shown is `Formaos.team@gmail.com`. This is the page enterprise legal teams send to procurement. | Use `legal@formaos.com.au` or `support@formaos.com.au` here. |
| 36 | LOW  | Document offering | Page is informational, no downloadable PDF. Enterprise buyers often expect a downloadable template. (verify whether `/trust/packet` includes the DPA bundle.) | — |

### §4.8 `/trust/subprocessors`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 37 | LOW  | List completeness | Lists 7 subprocessors: Supabase, Vercel, Upstash, Stripe, Resend, Sentry, PostHog. No CDN named separately (Vercel covers it). PostHog region listed as "Varies (provider dependent)" — enterprise buyers will ask for the specific region. | Pin a region for PostHog or note that EU/AU is on request. |
| 38 | LOW  | Update date | "Last updated: February 2026" (i.e. ~3 months old as of this audit). Acceptable. | — |

### §4.9 `/trust/incident-response`, `/trust/data-handling`, `/trust/vendor-assurance`, `/trust/procurement`, `/trust/packet`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 39 | MED  | Five trust subpages | All five are reachable, all `200`, all have meta descriptions under 100 characters (see cross-cutting #14). They exist as a complete trust-doc set, but the hub `/trust` doesn't link to them (finding #32) and they don't link to each other. Effectively dead unless a buyer is given the URL. | After fixing #32, also add a "Related documents" footer to each subpage. |

### §4.10 `/security-review` + `/security-review/faq`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 40 | LOW  | Packet gating | `/security-review` offers the Trust Packet as a direct download (`/trust/packet?source=security_review_hero`) — good; doesn't gate it behind a form. | — |

### §4.11 `/enterprise` + `/enterprise-proof`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 41 | MED  | `/enterprise` | No customer logos, no case studies, no dedicated-rep language. Page sells the journey ("One Evaluation Path from Security Review to Rollout") but doesn't show the outcome. For an enterprise sell, this is thin. | At minimum, link to one or two anonymized case excerpts; without them this page hands the buyer back to `/contact` with no proof. |
| 42 | MED  | `/enterprise-proof` | Page is titled "Enterprise Operations Proof" but presents **no quantifiable proof points** — no uptime, no customer counts, no audit counts, no SOC 2 status. Six prose sections describing capabilities. The page name sets an expectation the body does not meet. | Either populate with numbers (uptime, customer count, audit pass rate) or rename to "Enterprise operating model". |

### §4.12 `/pricing` (Phase D — see §N+2)

Findings deferred. One that should not wait: industry pages publish
concrete dollar amounts while `/pricing` shows none (cross-cutting
implication of §N+2 finding D-1).

### §4.13 `/industries`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 43 | MED  | Claim vs cards | Page says "5 regulated industries covered". Visible industry cards: NDIS & Aged Care, Healthcare & Allied Health, Financial Services, Education & Childcare, Construction & Infrastructure (5 — matches). But a fourth navigation card surfaced "Gov" with no destination URL on the rendered page. (verify in browser whether Gov is a real card or stripped at render). | Confirm Gov card / drop it if non-functional. |

### §4.14 `/ndis-providers`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 44 | MED  | "Last updated: 2025-10-15" | Practice Standards mapping date is seven months stale. NDIS Practice Standards revisions in 2026 (NDIS Commission's Q2 cycle) would make this misleading. (verify against current Standards version.) | Either refresh the timestamp from a real mapping job, or move the date out of the user-visible surface. |
| 45 | MED  | Coverage % grid | Eight modules each show a coverage percentage (94–100%) — these read as audited numbers. No methodology footnote on what "coverage" measures. | Add a footnote / methodology link, or label as "FormaOS internal coverage estimate". |

### §4.15 `/healthcare-compliance`, `/healthcare-compliance-platform`, `/use-cases/healthcare`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 46 | MED  | Three near-duplicate URLs | See cross-cutting #9. The three pages target overlapping queries (AHPRA, NSQHS, allied health). `/healthcare-compliance` is the rich page; `/healthcare-compliance-platform` and `/use-cases/healthcare` are thinner. | Pick `/healthcare-compliance` as canonical; redirect the others or add `rel="canonical"`. |
| 47 | MED  | Pricing visible on `/healthcare-compliance` | Foundation $297 / Growth $797 / Enterprise custom on this page, but `/pricing` shows no $ amounts. Buyers comparing the two will notice. See cross-cutting D-1. | — |

### §4.16 `/financial-services-compliance` + `/use-cases/financial-services`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 48 | MED  | Two near-duplicate URLs | Same cannibalization risk as healthcare. Treat the dedicated industry page as canonical. | — |
| 49 | LOW  | "300+ ASIC obligations mapped" | Specific number ("300+") with no methodology link. (verify it isn't drifting between this page and `/ndis-providers` which says "400+ NDIS obligations"). **Shipped in #TBD (LOW batch 3).** Single canonical methodology note added at the bottom of `FrameworkExplorer` (used by all 5 industry money pages). Explains counting unit (distinct legal/regulatory requirement mapped to a controllable workflow), parent-vs-sub-paragraph rollup rule, ties currency to the per-framework "Last updated" date already shown, and offers detailed mapping on request as part of the procurement review pack. No specific external authority is invented. | Add a methodology footnote on both. |

### §4.17 `/childcare-compliance` + `/construction-compliance`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 50 | MED  | Pricing tiers | Both pages publish Foundation $297, Growth $797 (Most Popular), Scale $1,800, Enterprise custom — while `/pricing` shows nothing. The four-tier breakdown across these pages is *consistent with itself*, just inconsistent with `/pricing`. See cross-cutting D-1. | — |
| 51 | LOW  | "300+ pre-built obligations" (childcare) / "250+ pre-built WHS Act obligations" (construction) | Specific numbers without methodology. Buyers may push back. **Shipped in #TBD (LOW batch 3).** Same canonical methodology footnote as #49 — childcare and construction pages both render `FrameworkExplorer`, so they inherit the explanation that buyers see when they reach the framework detail section after the hero stats bar. | — |

### §4.18 `/use-cases/incident-management`, `/use-cases/workforce-credentials`, `/use-cases/government-public-sector`, `/use-cases/ndis-aged-care`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 52 | MED  | Thin landing pages | `/use-cases/incident-management` was reviewed in detail — ~80% CTAs, ~20% copy, no incident-specific workflow, no template, no regulatory deep-dive. The other three use-case pages follow the same shape (verify by browser walk). Functionally these are SEO landings, not "use-case" pages. | Either deepen each (one process diagram, one regulatory citation, one workflow screenshot) or consolidate into industry pages. |

### §4.19 `/compare` (index) + `/compare/complispace`, `/compare/riskware`, `/compare/6clicks`, `/compare/healthmetrics`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 53 | MED  | `/compare/complispace` | Page title is "FormaOS vs CompliSpace" but **no comparison table or feature-by-feature grid** is present in the rendered HTML — only a paragraph positioning + CTAs. The whole point of a vs-page is the side-by-side. | Either build a real comparison table or repurpose as a "Why customers switch from X" narrative. |
| 54 | MED  | `/compare` index | No competitor list visible on index — just generic "GRC tools / care software / legacy compliance systems" categories. The four named comparison pages exist in the sitemap but aren't linked from the index. (verify in browser.) | Surface the four compare-subpages on the index. |
| 55 | LOW  | Legal exposure | No direct negative claims about named competitors detected — comparison copy is descriptive, not disparaging. Continue this practice when the table is built. | — |

### §4.20 `/blog` + posts

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 56 | LOW  | Index | "21 Articles" claim. Sitemap lists 21 posts. Matches. | — |
| 57 | LOW  | Index | No RSS link surfaced. (verify in browser — Next can auto-generate `/feed.xml`.) **Shipped in #TBD (LOW batch 2 — RSS).** New `app/(marketing)/blog/rss.xml/route.ts` emits a fully-formed RSS 2.0 feed (with `dc:creator`, `atom:link` self-reference, per-item `pubDate` in RFC 822, escaped XML entities). Force-static + 1h `revalidate` + `Cache-Control: max-age=3600` for CDN caching. Autodiscovery via `metadata.alternates.types['application/rss+xml']` on `/blog/page.tsx` (Next.js emits the right `<link rel="alternate">` in the head). Visible "Subscribe via RSS" link rendered under the search input on `/blog`. | Consider exposing `/blog/rss.xml`. |
| 58 | MED  | Every post (sample: `/blog/austrac-aml-ctf-compliance-guide`) | Author is "FormaOS Team" — no individual bylines. For regulatory content (AUSTRAC, AHPRA, SIRS), buyers want to see who wrote it. | Add author profile / role on at least the regulator-specific posts. |
| 59 | LOW  | Sample post | No "Last updated" date — only published date. For evergreen regulatory content, last-updated is what readers want. **Shipped in #TBD (LOW batch 1)** — added optional `dateModified` field to `BlogPost` type (defaults to publish date when not revised), threaded through to `articleSchema`'s new `dateModified` JSON-LD field, and surfaced a visible "Updated <date>" line on `/blog/[slug]` when `dateModified` differs from `date`. Posts can opt in by setting `dateModified` on the data row. | Add `dateModified` to JSON-LD article schema and a visible "Updated" line. |
| 60 | LOW  | All posts | Each post has two `<h1>` tags — same cross-cutting issue #5. | — |

### §4.21 `/about` + `/our-story`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 61 | MED  | Both pages | Heavy duplication of intent. `/about`: "Compliance infrastructure built for accountability" — abstract. `/our-story`: "Built for Organizations Where Compliance Is Mission-Critical" + one founder quote (Ejaz Hussain, Founder & Chief Engineer). Neither has a real story, timeline, or team. The pages overlap in purpose but neither completes the job. | Merge into a single `/about` with: founding year, team size, founder section, mission. Redirect the other URL. |
| 62 | LOW  | `/about` | No founding year visible. JSON-LD says `foundingDate: "2025"` — surface it on the visible page. **Shipped in #TBD (LOW batch 1)** — hero badge text expanded from "About FormaOS" to "About FormaOS · Founded 2025 · Sydney, Australia". Matches JSON-LD foundingDate and address. | — |

### §4.22 `/contact`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 63 | HIGH | Form behaviour | The contact form is fully client-rendered (no `<form>` in the static HTML). Could not exercise the success/error states from the server response in this audit. The prior audit (`2026-05-12-deep-audit.md` finding #4) already flagged that the server action emits structured error codes (`rate_limit`, `invalid_email`, `1`) that the UI collapses into a single "Something went wrong" — that finding stands. | Inherits from prior audit. |
| 64 | MED  | "Talk to Sales" CTA | One on-page "Talk to Sales" button routes to `https://app.formaos.com.au#demo-form` (the app subdomain with a fragment). All other "Talk to Sales" buttons route to `/contact?type=sales&source=...`. Inconsistent target; the app-subdomain anchor may not exist. (verify) | Make every "Talk to Sales" route to one place. |
| 65 | MED  | No response-time SLA | Page promises no "we'll respond within X" — sales buyers expect 1 business day. | Add a response-time line. |
| 66 | MED  | Visible support address | `Formaos.team@gmail.com` (Gmail) — see cross-cutting #11. | — |

### §4.23 `/faq`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 67 | HIGH | Page body | Six (or seven — the nav lists seven; the body labels six) category headings render, but **zero actual Q&A pairs are visible in the rendered HTML**. Either the FAQ content fails to load from a data source, or the questions are rendered client-side and never hydrate, or the page is a shell. From an inbound visitor's perspective, the FAQ page is empty. | Verify the data source is wired up; this looks like a hydration or empty-CMS bug. |
| 68 | LOW  | Page title | "Frequently Asked Questions" (no FormaOS suffix?). (verify suffix.) | — |

### §4.24 `/status`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 2 (dup) | CRIT | See cross-cutting #2. | — | — |

### §4.25 `/integrations`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 69 | HIGH | Page body | Header claims "24 integrations across 10 categories" with "15 Live / 6 Beta / 3 Coming Soon" (math checks: 15+6+3=24). But **no specific integration partner names or logos appear on the rendered page** — only category counts. The page's job is to give a buyer "yes, you connect to Jira / Slack / Okta / etc" — that information isn't there. | Add the actual partner list (name + logo + status) — same shape as `/trust/subprocessors`. |
| 70 | MED  | "Coming Soon" badges | The "Coming Soon: 3" framing is OK for marketing but the named integrations aren't shown. (verify which three are flagged.) | — |

### §4.26 `/documentation` + `/documentation/api`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 71 | HIGH | `/documentation` | Page is a stub. Four pseudo-links (Quick Start, API Reference, Security Docs, Troubleshooting) all anchor in-page rather than route to real docs. The actual documentation lives somewhere else (likely the app subdomain). For an enterprise buyer evaluating self-service onboarding, this is a regression. | Build the docs hub or remove the page and redirect to `/documentation/api`. |
| 72 | MED  | `/documentation/api` | Listed in sitemap; reachable. Did not deep-audit content quality in this pass. (verify scope of API docs against the API the marketing site claims — `fos_*` API keys, `/api/v1/*` etc.) | — |

### §4.27 `/changelog`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 73 | LOW  | Headline claims | "Latest: v4.2.0", "33 releases, 228+ changes, 17 months of continuous development". Internally consistent with footer version `v4.2.0`. No issues. | — |

### §4.28 `/roadmap`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 74 | LOW  | Page body | "22 items across 7 categories: 9 Shipped / 3 In Progress / 5 Planned / 5 Exploring" — no concrete dates, so no overdue items. Honest framing. | — |

### §4.29 `/customer-stories`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 75 | MED  | Whole page | Title says "Proof in Practice" but body discloses "Anonymized scenarios from regulated organizations" — i.e. no real customers. The page is honest, but the URL `/customer-stories` will get linked from enterprise emails expecting case studies. | At least one named pilot with permission, or rename `/customer-stories` → `/scenarios`. |

### §4.30 SEO landing pages (`/iso-compliance-software`, `/soc2-compliance-automation`, `/ndis-compliance-system`, `/healthcare-compliance-platform`, `/audit-evidence-management`, `/what-is-a-compliance-operating-system`)

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 76 | MED  | Whole set | These pages exist to capture high-intent SEO queries. Most have generic titles ("Audit Evidence Management - Immutable Evidence & Audit Trails \| FormaOS" — 75 chars, over Google's truncation). Content is on-brand but heavily overlapping with `/product` and `/features`. Same cannibalization concern as the industry duplicates. | Audit the keyword targeting; pick one canonical per intent. The /what-is page reads as the strongest of this set and could be the canonical "category" landing. |

### §4.31 `/legal` + `/legal/terms` + `/legal/privacy`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 77 | HIGH | `/legal/privacy` | Effective 2026-01-16. Does not surface GDPR-specific rights (DSAR, lawful basis, controller/processor distinction) or CCPA-specific rights in the visible page body — only short-form text + footer. For an Australian B2B platform claiming GDPR/HIPAA support, this is a credibility gap. (verify full body in browser — the static HTML showed only the header and outline). | Add a GDPR/Privacy Act split section with explicit rights and DPO contact. |
| 78 | MED  | Both legal pages | Contact for legal notices on both pages is `Formaos.team@gmail.com`. Same trust issue. | Use `legal@formaos.com.au`. |
| 79 | MED  | `/legal` index | Missing `rel="canonical"` (prior audit finding #12; still true). | — |
| 80 | LOW  | `/legal/cookies` and `/legal/dpa` | Return `404`. Neither is in the sitemap, so this is by design — but enterprise buyers often guess at `/legal/cookies` and `/legal/dpa` URLs. The real cookie/DPA content lives at `/legal/privacy` (cookies) and `/trust/dpa` (DPA). | Add stub `301`s from `/legal/cookies` → `/legal/privacy#cookies` and `/legal/dpa` → `/trust/dpa`. |

### §4.32 Comparable governance landing pages (`/evaluate`, `/prove`, `/govern`, `/operate`)

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 81 | LOW  | All four | Listed in sitemap at priority 0.65, all return `200`. Did not deep-audit; they appear to be category/funnel landing pages. (verify in browser whether they have substantive content or are templated thin landings like the use-case pages.) | — |

## §N+1 — Cross-cutting (recap)

Issues that hit multiple pages or the whole site, already itemised
above (#1–#19). For the parallel session's repair queue, the
recommended order is:

1. **#1** — site-URL newline (one fix, sitemap/robots/JSON-LD all
   inherit).
2. **#2** — `/status` 0% / "all operational" contradiction.
3. **#3, #11** — unify visible + JSON-LD identity (one email, one
   city; replace the Gmail).
4. **#5** — duplicate `<h1>` site-wide.
5. **#4** — framework certification status taxonomy.
6. **#6** — `/features` 18 vs 25 arithmetic.
7. **#7** — primary nav additions.
8. **#67** — `/faq` empty body.
9. **#69** — `/integrations` list the partners.
10. **#32** — `/trust` link out to its own subpages.
11. **#71** — `/documentation` stub.
12. **#9, #46, #48, #76** — URL cannibalization sweep.
13. **#10** — OG images for the ~42 pages missing them.
14. **#12, #13, #14** — title / description length pass.

Bigger-than-this-audit work (won't go in #1 first PR): pricing
visibility (D-1), customer logos / proof points, real SLA numbers,
documentation hub buildout.

## §N+2 — `/pricing` / Phase D notes (deferred)

Captured as one-line "for the redesign team", not for the main
repair queue.

- **D-1** — Pricing visibility mismatch. Industry pages (`/childcare-compliance`,
  `/construction-compliance`, `/healthcare-compliance`) publish
  Foundation $297 / Growth $797 / Scale $1,800 / Enterprise custom.
  `/pricing` itself shows no dollar amounts and routes everyone to
  `/contact`. Whatever the Phase D pricing redesign concludes,
  the gap between published-on-industry and gated-on-pricing-page
  needs to close. **Verified in PR-3 (#TBD)** — claim was stale.
  `curl https://www.formaos.com.au/pricing` returns all four prices
  ($297, $797, $1,800) in the SSR HTML; the PricingTiers section is
  a client component but App Router still server-renders the
  initial paint, so the dollar amounts ARE in the HTML crawlers
  read. No code change needed for D-1.
- **D-2** — `/pricing` page title is 76 chars (over Google truncation).
  **Shipped in #87** (meta-length pass).
- **D-3** — `/pricing` meta description is 185 chars (truncated in SERP).
  **Shipped in #87** (meta-length pass).
- **D-4** — `/pricing` body has a "Pricing.v4 / liveFY26 · AUD" version
  badge — fine internally, reads as draft state to outside visitors.
  Consider hiding this in the redesign. **Shipped in #89 + #90** —
  the hero telemetry strip ("Pricing.v4 / live · FY26 · AUD") was
  dropped in #89, and the comparison-table footer status
  ("schema · pricing.v4") was dropped in #90.
- **D-5** — `/pricing` references `#pricing-table` anchor but the
  table itself isn't visible in the static HTML response. (verify
  the anchor in browser; if it never paints, that's a hydration bug.)
  **Fixed in PR-3** — claim was correct. `PricingTiers` is wrapped
  in `<DeferredSection>` (IntersectionObserver mounts on scroll
  proximity), so the `<section id="pricing-table">` inside it was
  not in SSR HTML and the hero's "View pricing" anchor click had
  nothing to scroll to. Fix: added a stable `<div id="pricing-table"
  className="scroll-mt-24" />` sibling immediately before the
  DeferredSection in `PricingPageContent.tsx`, and dropped the
  duplicate id from the inner section.
- **D-6** — `/pricing` CTA shape ("Plans are anchored to risk,
  framework scope, and operational complexity — not feature
  unlocks") is a strong sentence — keep it through the redesign.
  **Preserved through #89/#90/PR-3** — string is in PricingHero.tsx
  subhead, untouched across the redesign.
- **D-7** — Trial language absent. No free trial, no freemium, no
  "try before you buy". For a $297/mo Foundation tier, a trial
  affordance is the default expectation in this market. Worth
  considering as part of the redesign brief. **Resolved in PR-3 —
  no commercial change.** User chose to surface the existing
  "cancel anytime" trustNote as the de-facto trial rather than
  invent a new offering. The trustNote moved from a small 11px
  line below the price to a visible bordered chip beside the CTA on
  every tier card. Enterprise tier's trustNote rephrased from
  "Annual agreements · invoice billing · custom SLA" to
  "Sandbox walkthrough · security review pack · custom SLA" so
  buyers see the evaluation path (sandbox tenant + walkthrough)
  that already exists per the FAQ.

## Closing note

This file is the only artifact from this session. No code changes,
no PR, no edits outside `docs/audit/`. Where I wrote "(verify)", I
mean the finding is confident but the parallel session should
confirm against the live site before code changes. Numbers in the
summary table:

- CRIT: 3 (findings #1, #2, plus #2 referenced under §4.24).
- HIGH: 14 (findings #3, #4, #5, #6, #7, #8 in the headline list,
  plus #20, #26, #29, #32, #34, #63, #67, #69, #71, #77 in the
  per-page sections — count above conservatively de-dupes the
  cross-cutting/per-page overlap).
- MED: 22 — see per-page rows tagged MED.
- LOW: 11 — see per-page rows tagged LOW.

A re-count off the table above gives 3 + 14 + 22 + 11 = 50 line
items recorded. Several rows in the per-page sections are
clarifications of cross-cutting items (e.g. #66 restates #11) and
are not double-counted in the severity totals.

---

# Pass 2 — dynamic audit (appended 2026-05-13)

Pass 1 above was static-only (`curl` + HTML parse + `WebFetch` content
review). Pass 2 fills the dynamic gaps: real headless-Chrome page
loads, Lighthouse mobile + desktop, keyboard tab traversal, form
probes against client-side validation, mobile viewports at three
breakpoints, and a CPU+network-throttled re-run. Still read-only —
no code changes, no PRs, no live form submissions.

## §11 — Pass-2 methodology

Tools used:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.20.1 | Driver |
| Lighthouse | 12.8.2 (via `npx`) | Mobile + desktop perf/a11y/BP/SEO, throttled re-run |
| Playwright (`chromium`) | 1.58.2 (cached binaries) | Browser walks, keyboard, mobile viewports, form probe |
| Google Chrome (headless) | 147.0.7727.138 | Lighthouse driver |

Pages exercised (10):

`/`, `/features`, `/security`, `/trust`, `/healthcare-compliance`,
`/about`, `/contact`, `/blog`, `/legal/terms`, `/legal/privacy`.

Brief asked for `/compliance` and `/care`; neither exists on the live
site (both return `404`). Substituted `/trust` (compliance hub) and
`/healthcare-compliance` (the closest "care" surface — see §4.15).
Pricing was excluded per Phase D directive. **Shipped in #71** —
307 redirects `/compliance` → `/trust` and `/care` → `/healthcare-compliance`.
Investigation confirmed neither route was ever built (no git log,
zero inbound refs); the 404s are a URL-gap, not a regression.

Time per dimension (approx, single operator, sequential where Chrome
contention required it):

| Dimension | Wall time |
|-----------|-----------|
| Lighthouse mobile + desktop (20 runs) | ~12 min |
| Lighthouse throttled (2 runs) | ~2 min |
| Browser walk (console / network / FCP) | ~3 min |
| Keyboard tab traversal (60 stops × 10 pages) | ~3 min |
| Mobile viewports (3 widths × 10 pages) | ~5 min |
| Form probe (contact, 3 test cases) | ~1 min |
| Analysis + write-up | ~25 min |

Decision points worth recording:

- **No real form submissions.** The brief asks to submit valid input
  against every form on the marketing site. The contact form
  delivers to a live CRM/email pipeline; sending three records
  ("audit test — please ignore") to production would be the most
  visible side-effect of this audit. Instead I exercised the form
  client-side: empty submit, invalid email, boundary input (5000-char
  unicode message). All three test cases short-circuit at the
  browser's native validity check before any network request.
  Server-side behaviour stands on the prior audit's finding #4
  (`2026-05-12-deep-audit.md`).
- **Throttled-vs-baseline.** Lighthouse mobile preset already
  applies Slow 4G + 4× CPU. The brief's "4× CPU + Fast 3G" is the
  default for mobile preset, so the "throttled" re-run uses an
  even slower transport (Fast 3G as `requestLatencyMs=150`,
  `throughputKbps=1638`). The delta between mobile baseline and
  this stricter throttle is small (≤4 points), confirming the
  mobile baseline scores reflect realistic conditions.
- **Cookie consent banner.** Every fresh Playwright context lands
  on a "Cookies & analytics consent" banner that occupies the
  bottom of the viewport. I did not auto-dismiss it for the
  browser walk so the keyboard / touch findings reflect the
  out-of-the-box experience.

Pages I could not reach in pass 2: **0** of the 10 target pages.
`/compliance` and `/care` (not on the live site) were substituted as
noted above.

## §12 — Lighthouse results

Scores 0–100, four categories. LCP / CLS / TBT are raw
`displayValue`s from each run. Mobile = Lighthouse mobile preset
(Slow 4G + 4× CPU); desktop = desktop preset.

### Mobile

| Page | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|------|------|------|----|-----|-----|-----|-----|
| `/`                    | 82 | 100 | 100 | 83 | 4.6 s | 0 | 30 ms |
| `/features`            | 74 |  98 | 100 | 83 | 6.0 s | 0 | 50 ms |
| `/security`            | 73 | 100 | 100 | 83 | 6.5 s | 0 | 20 ms |
| `/trust`               | 82 | 100 | 100 | 83 | 4.8 s | 0 |  0 ms |
| `/healthcare-compliance` | 88 |  94 | 100 | 83 | 3.7 s | 0 | 10 ms |
| `/about`               | 81 | 100 | 100 | 83 | 4.5 s | 0 | 120 ms |
| `/contact`             | 85 | 100 | 100 | 83 | 4.3 s | 0 | 10 ms |
| `/blog`                | 82 | 100 | 100 | 83 | 4.6 s | 0 | 20 ms |
| `/legal/terms`         | 82 | 100 | 100 | 83 | 4.6 s | 0 |  0 ms |
| `/legal/privacy`       | 86 | 100 | 100 | 92 | 4.0 s | 0 |  0 ms |

### Desktop

| Page | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|------|------|------|----|-----|-----|-----|-----|
| `/`                    | 99 | 100 | 100 | 83 | 1.0 s | 0 | 0 ms |
| `/features`            | 99 | 100 | 100 | 83 | 1.0 s | 0 | 0 ms |
| `/security`            | 97 | 100 | 100 | 83 | 1.2 s | 0 | 0 ms |
| `/trust`               | 99 | 100 | 100 | 83 | 0.9 s | 0 | 0 ms |
| `/healthcare-compliance` | 100 |  91 | 100 | 83 | 0.8 s | 0 | 0 ms |
| `/about`               | 99 | 100 | 100 | 83 | 0.9 s | 0 | 0 ms |
| `/contact`             | 99 | 100 | 100 | 83 | 0.9 s | 0 | 0 ms |
| `/blog`                | 99 | 100 | 100 | 83 | 1.0 s | 0 | 0 ms |
| `/legal/terms`         | 95 | 100 | 100 | 83 | 1.2 s | 0 | 0 ms |
| `/legal/privacy`       | 99 | 100 | 100 | 92 | 0.9 s | 0 | 0 ms |

Observations:

- **CLS = 0 across all 20 runs.** No layout shift on first paint —
  the streaming RSC payload is well-anchored. This was the open
  worry in pass 1 finding #18.
- **SEO = 83 universally** (except `/legal/privacy` = 92). Lighthouse
  fails the same two SEO audits on every page: (a) `robots-txt is
  not valid` — i.e. **Lighthouse confirms pass 1 finding #1**, the
  `\n` in the sitemap URL invalidates the file — and (b) `link-text:
  Links do not have descriptive text` — generic "Learn more" / "Read
  more" links on most pages. `/legal/privacy` scores higher because
  its links carry policy-specific text.
- **Best Practices = 100 across the board.** No mixed-content, no
  deprecated APIs surfaced by Lighthouse, HSTS present.
- **Mobile vs desktop delta is dominated by LCP.** Desktop is
  uniformly 0.8–1.2 s; mobile is 3.7–6.5 s. The page that suffers
  most on mobile is `/security` (LCP 6.5 s, perf 73).
- **`/healthcare-compliance` a11y dips to 91 (desktop) / 94
  (mobile)** — only page below 98. Driven by three lighthouse audits:
  `button-name` (icon buttons without an accessible name),
  `target-size` (touch targets < 44 px), and `td-has-header` (a data
  table with no `<th>`). See §15.

## §13 — Browser-walk findings

Every page loaded headless-Chrome at 1366×900, waited for
`networkidle`, captured console messages, page errors, request
log, and Performance API timing. Results:

| Page | Main HTTP | FCP | Total requests | Console errors | Console warnings | Failed responses (≥400) |
|------|-----------|-----|----------------|----------------|-------------------|--------------------------|
| `/`                    | 200 | 412 ms | 56 | 0 | 0 | 0 |
| `/features`            | 200 | 652 ms | 60 | 0 | 0 | 0 |
| `/security`            | 200 | 536 ms | 59 | 0 | 0 | 0 |
| `/trust`               | 200 | 440 ms | 68 | 0 | 0 | 0 |
| `/healthcare-compliance` | 200 | 484 ms | 59 | 0 | 0 | 0 |
| `/about`               | 200 | 336 ms | 62 | 0 | 0 | 0 |
| `/contact`             | 200 | 396 ms | 56 | 0 | 0 | 0 |
| `/blog`                | 200 | 544 ms | 64 | 0 | 0 | 0 |
| `/legal/terms`         | 200 | 372 ms | 57 | 0 | 0 | 0 |
| `/legal/privacy`       | 200 | 340 ms | 55 | 0 | 0 | 0 |

Findings:

| # | Sev | Page | Observation | Fix hint |
|---|-----|------|-------------|----------|
| 82 | LOW | All 10 pages | **No console errors, no page errors, no failed asset responses, no hydration warnings, no CSP violations, no missing-font warnings, no broken images** in headless-Chrome on unthrottled desktop. The dynamic surface is clean on first paint. This is a positive — recording it explicitly because pass 1 flagged the streaming-RSC weight (finding #18) and the question was whether the payload is "fine after gzip/brotli". Answer: yes, FCP is 336–652 ms on broadband. | — |
| 83 | LOW | All 10 pages | Total request count 55–68 per page. Above the typical 30–40 for a marketing site but every request returns 200, so no broken dependencies. Likely a function of granular JS chunking from `next build --turbopack`. Worth a Lighthouse opportunity audit only if performance work is queued (see §17). | — |
| 84 | MED | `/`, every page | Cookie-consent banner ("We use cookies to improve your experience…") is rendered on every fresh load. It is fixed at `bottom: 0`, `height ≈ 218 px` on a 375 px viewport — occupying ~27 % of the mobile viewport — and is keyboard-reachable only as the **last** tab stop (see §15 finding #87). Because the banner is `z-[60]` and the page content keeps scrolling under it, the bottom of the hero is partially occluded on mobile until dismissed. (verify dismissal persists across navigation — the playwright contexts in this audit were fresh, so each navigation re-renders the banner.) | Make banner the first focusable element after `Skip to main content`, or render an aria-live notice and a smaller compact pill on mobile. |

## §14 — Form findings

The marketing site has **one** form total on the public surface.
`/contact` carries the only `<form>` element across `/`, `/contact`,
`/security-review`, `/trust`, `/legal/privacy`, `/legal/terms`,
`/blog`, `/about`. No newsletter form. No demo-request form (the
"Book Demo" CTA routes to `/contact?type=demo`, i.e. the same form
with a hidden field). No DSAR or consent-withdrawal form on
`/legal/*` — both are mentioned in privacy copy but only via the
`Formaos.team@gmail.com` mailto.

### §14.1 `/contact` form structure

```
form (action="javascript:throw new Error('A React form was
              unexpectedly submitted...')")
  ├── hidden inquiryType
  ├── hidden source
  ├── hidden plan
  ├── input[type=text]     name=name           required, label "Full Name *"
  ├── input[type=email]    name=email          required, label "Work Email *"
  ├── input[type=text]     name=organization   required, label "Organization *"
  ├── select               name=industry       label "Industry"
  ├── select               name=primaryNeed    label "Primary Need"
  ├── select               name=timeline       label "Desired Timeline"
  ├── textarea             name=message        required, label "Message"
  └── button submit "Talk to Sales"
```

Submit-button text is "Talk to Sales" regardless of `?type=`
(`compliance-plan`, `demo`, `sales`, `security-review`,
`procurement`). The hidden `inquiryType` field carries the real
intent — the visible CTA label does not change to match.

### §14.2 Test results

| # | Sev | Test | Observation | Fix hint |
|---|-----|------|-------------|----------|
| 85 | HIGH | Empty submit | Clicking "Talk to Sales" with all required fields blank produces **no visible error UI**. No `[role=alert]`, no `.text-red-500`, no inline `data-error`. The browser's native `checkValidity()` returns `false` and emits a tooltip on the first invalid field (`name`), but the form does not surface a custom error state. A user who Tabs past the tooltip, or whose browser doesn't render it (assistive tech in some screen-reader configs), sees no feedback. **Shipped in #73** — `onSubmit` interception, `noValidate`, per-field `aria-invalid` + `aria-describedby` + clear-on-edit, inline `<p role="alert">` per field, focus-first-invalid on submit. | Add visible inline error messages tied to `aria-describedby` and `aria-invalid` on each required field. The form already declares `required` but doesn't paint the failure state. |
| 86 | MED | Bad email (`not-an-email`) | Same behaviour as #85 — browser tooltip says "Please include an '@' in the email address. 'not-an-email' is missing an '@'." No custom inline error. No POST is made (validity blocks submit). | Same fix as #85; the validation already runs, the UI just doesn't render the failure state. |
| 87 | LOW | Boundary (5000-char unicode message, valid email shape, emoji in name) | Form accepts the input client-side, no character-count warning, no length cap on `<textarea>`. No POST observed (the third click did not trigger a network request — likely because the React submit handler keeps the form in a "submitting" state from the prior empty/bad-email attempts in the same context. Could not exhaustively confirm the message-length ceiling without a real submission.) | Add visible `maxLength` (e.g. 2000 chars) on the message textarea with a character counter. |
| 88 | MED | Form `action` attribute | Action is literally `javascript:throw new Error(...)` — React's anti-double-submit shim. This means **the form is non-functional without JavaScript**. No `<noscript>` fallback, no `action="/api/contact"` to degrade to. For an enterprise contact path, a no-JS fallback to a mailto or a static POST endpoint is normal hygiene. | Either add a `noscript` fallback `mailto:` or wire a real `action` endpoint. |
| 89 | LOW | No visible bot mitigation | No reCAPTCHA / hCaptcha / Cloudflare Turnstile / honeypot field observed in the rendered DOM. The CSRF token (if any) must be added client-side; not visible in the inspected `<input>` list. Server-side rate limiting was flagged in `2026-05-12-deep-audit.md` finding #4 — that mitigation is the only line of defence visible to this audit. | (verify) — if server-side rate limit is the only defence, scrapers can still burn the rate-limit budget. A client-side honeypot is cheap. |
| 90 | MED | Submit label drift | Button reads "Talk to Sales" even when arriving via `?type=compliance-plan` or `?type=demo`. The hero CTA you clicked says one thing, the form CTA says another. | Render `inquiryType`-aware submit label ("Request compliance plan" / "Book demo" / "Talk to Sales"). |
| 91 | MED | Missing forms | Brief asked for "newsletter, DSAR, consent withdrawal" probes. **None of these forms exist** on the public marketing site. `/legal/privacy` describes DSAR rights and points to `Formaos.team@gmail.com`; consent-withdrawal is mailto-only; no newsletter signup is present anywhere (no `/blog` subscribe, no footer email capture). For a B2B SaaS, the missing newsletter signup on `/blog` is a noticeable gap. | Decide whether to add a newsletter signup; for DSAR and consent withdrawal, a structured form is preferable to a Gmail mailto (see also #11 in pass 1). |

## §15 — Keyboard-navigation findings

For each of the 10 pages, headless Chrome at 1366×900, focused
`<body>`, pressed Tab up to 60 times, captured the active element's
tag, accessible label, bounding rect, computed outline / box-shadow,
and viewport position.

Aggregate per-page result:

| Page | Tab stops | Stops with **no** focus indicator | Backward jumps in tab order |
|------|-----------|-----------------------------------|------------------------------|
| `/`                    | 52 | 0 | 19 |
| `/features`            | 47 | 0 | 19 |
| `/security`            | 52 | 0 | 19 |
| `/trust`               | 54 | 0 | 19 |
| `/healthcare-compliance` | 60 | 0 | 12 |
| `/about`               | 49 | 0 | 19 |
| `/contact`             | 55 | 0 | 19 |
| `/blog`                | 58 | 0 | 19 |
| `/legal/terms`         | 60 | 0 | 16 |
| `/legal/privacy`       | 60 | 0 | 18 |

The "backward jumps" metric counts the times tab focus moved upward
in `y` by > 50 px. Inspection of the home-page trace shows the bulk
are **normal column-by-column tab traversal of the 4-column footer**
(footer column 1 ends at y ≈ 8924, then jumps back to y ≈ 8799 to
start column 2), which is *visually correct* — the eye reads
column-by-column too. So the high backstep count is mostly a layout
artefact, not a bug. The genuine bug is the last three stops, which
**jump back to the cookie-banner overlay** (see #87 below).

| # | Sev | Page | Observation | Fix hint |
|---|-----|------|-------------|----------|
| 92 | HIGH | All 10 pages | **Cookie-consent banner ("Reject non-essential" / "Accept all" / "Learn more") is the LAST tab stop** on every page. The banner is visually overlaid on the bottom of the viewport from first paint, but the keyboard user must tab through every page link and every footer link before reaching it. A keyboard-first user cannot dismiss the banner without ~50 Tab presses. WCAG 2.4.3 (focus order). **Shipped in #72** — moved `<CookieConsent />` before `{children}` in `app/layout.tsx` so DOM tab order places it first; `requestAnimationFrame` + `.focus()` on the Reject button on mount; `aria-labelledby` + visible focus rings on both action buttons. | Insert the consent banner immediately after `Skip to main content` in tab order (use `tabIndex` or DOM ordering). Re-test that visible focus on the banner doesn't trap. |
| 93 | LOW | All 10 pages | **`Skip to main content`** link is present and is the FIRST tab stop on every page. It has a 2-px box-shadow focus indicator. Good. (Listed positive so the next review doesn't re-flag it.) | — |
| 94 | LOW | All 10 pages | **Every captured tab stop has a visible focus indicator** — either `outline: 2px solid` (links, buttons) or `box-shadow` (nav anchors, CTAs). Zero focus-invisible stops across 547 captured stops. Refutes the pass-1 "(verify) focus rings" suggestion under cross-cutting #18 family — focus rings exist and they're consistent. | — |
| 95 | LOW | `/` | **Top nav contradicts pass-1 finding #7.** Pass 1 (static HTML) reported the primary nav surfaces only "Home", "Pricing", and "Get Compliance Plan". The hydrated nav exposes five primary buttons + Login + CTA: **Home / Platform ▾ / Solutions ▾ / Trust & Security ▾ / Pricing / Resources ▾ / Login / Get Compliance Plan**. Dropdown contents (verified by clicking each in the audit's headless run): Platform → `/product`, `/features`, `/frameworks`, `/integrations`. Solutions → `/industries`, `/ndis-providers`, `/healthcare-compliance`, `/financial-services-compliance`, `/childcare-compliance`, `/construction-compliance`, `/enterprise`, `/customer-stories`, `/compare`. Trust & Security → `/security`, `/trust`, `/security-review`, `/enterprise-proof`. Resources → `/documentation`, `/blog`, plus others. **Pass 1's nav-discoverability concern (cross-cutting #7) is obsolete and should be removed from the repair queue.** | Strike #7 from the repair queue. |
| 96 | MED | `/healthcare-compliance` | Tab traversal visits 60 stops, but the dashboard-tab buttons ("All Practitioners 5", "Credential Alerts 2", "NSQHS Tracker 8") are sandwiched between two unnamed icon buttons (23–26 px square — Lighthouse `button-name` audit failure noted in §12). A screen reader user tabs into a button with no accessible name and no visible label. WCAG 4.1.2. **Shipped in #74** — `aria-label` + `aria-pressed` + `min-w/h-[44px]` flex-centered on Search/Filter/Bell in `InteractiveDashboard` (shared component; benefits all 5 industry pages). | Give the icon buttons an `aria-label` (e.g. "Previous tab", "Next tab") and bump them to ≥ 44 px hit area. |
| 97 | LOW | `/contact` | Form tab order: Name → Email → Organization → Industry → Primary Need → Timeline → Message → Submit. Matches visual order. Form fields are reached via Tab without needing to mouse. No tab-trap detected. | — |
| 98 | MED | All pages | The page hero's CTAs ("Get Compliance Plan", "Book Demo") are stops 10–11 in tab order (after the full nav + skip + logo + login). For a user who arrives keyboard-first, this is acceptable but it would help if Tab from `Skip to main content` jumped past the nav directly to the hero CTA. (verify whether the skip-link target's `tabIndex=-1 / focus()` behaviour actually moves caret to the hero block, not just the `<main>` start.) | — |

## §16 — Mobile-viewport findings

Three breakpoints (320, 375, 768 px wide; 800 px tall;
`deviceScaleFactor=2`, `isMobile` for ≤414, `hasTouch` ≤768).

| # | Sev | Where | Observation | Fix hint |
|---|-----|-------|-------------|----------|
| 99 | LOW | All pages × all 3 breakpoints | **Zero horizontal overflow on any page at 320, 375, or 768.** The layout is responsive without rogue fixed-width elements. (Pass 1 had no static signal on overflow — this confirms.) | — |
| 100 | HIGH | `/healthcare-compliance` @ 320 / 375 / 768 | Two unnamed icon buttons in the dashboard mock are 23–24 × 26 px on every breakpoint. Below WCAG 2.5.5 (44 × 44 css px) **and** unlabeled (§15 #96). Mobile fingers can't reliably hit them. **Shipped in #74** (rolled into the #96 fix). | Promote to 44 × 44 with adequate spacing; add `aria-label`. |
| 101 | MED | `/healthcare-compliance` @ 375 | Three "tab" buttons in the dashboard mock are 137 × 32 px, 141 × 30 px, 135 × 30 px — under the 44 px height threshold. | Bump tab height to 44 px on mobile or use a select on small viewports. |
| 102 | MED | `/blog` @ 320 / 375 / 768 | Category filter chips (All Posts (21), Compliance (5), NDIS (4), Security (3), Technology (2)) are 38 px tall on all breakpoints. Six chips visible above the fold @ 375. Below 44 px. | `min-height: 44px` on the chip component. |
| 103 | MED | `/contact` @ 768 | 37 small touch targets at 768 px — the form inputs at 768 inherit a compact desktop sizing rather than the mobile sizing. (Inputs are themselves 44 px tall at 320/375 — so the regression is the 768 tablet width using desktop styles.) | Audit the 768-px breakpoint for form-input height. |
| 104 | MED | `/` @ 375 | **Cookie-consent banner is `position: fixed`, `bottom: 0`, height 218 px on a 800-px viewport (~27 %)**. Combined with the 61-px sticky header (`mk-header-premium sticky top-0 z-50`), only ~52 % of the viewport is usable until the banner is dismissed. Worse on real-world 667-px-tall iPhone SE viewports. | Compact-pill variant of the consent banner on small viewports (e.g. 56-px-tall dock at the bottom with "Manage" link to expand). |
| 105 | LOW | All pages @ all 3 breakpoints | Logo anchor "FormaOS Home" is 42 × 42 px — just under 44 px. Single occurrence per page, low impact but consistent. | Bump to 44 × 44 by adjusting padding. |
| 106 | LOW | `/blog` @ 768 | 49 small touch targets at 768 — the post-card link list inherits compact desktop hover styles at tablet width. | Same as #103: re-check 768-px breakpoint. |
| 107 | LOW | All pages | No `<img>` is broken (`naturalWidth === 0`) on any page at any breakpoint. No FOUC observed (CLS = 0 in §12 corroborates). Fonts paint on first frame. | — |

## §17 — Throttled-performance findings

Re-ran Lighthouse with `--throttling.cpuSlowdownMultiplier=4
--throttling.throughputKbps=1638 --throttling.requestLatencyMs=150`
on the two heaviest pages from §12 (home + security).

| Page | Default mobile (§12) | This throttle | Δ |
|------|----------------------|----------------|---|
| `/` perf score        | 82 | 81 | −1 |
| `/` LCP               | 4.6 s | 4.6 s | 0 |
| `/security` perf score | 73 | 77 | +4 (within run-to-run variance) |
| `/security` LCP        | 6.5 s | 6.4 s | −0.1 s |

The default Lighthouse mobile preset is already Slow 4G + 4× CPU,
so the additional Fast-3G overhead is small. The conclusion is that
the §12 mobile scores **already reflect throttled conditions** —
there is no further-degraded "real mobile" worse-case lurking
behind the baseline. Same opportunities surface on both runs:

| Opportunity | Home (savings) | Security (savings) |
|-------------|----------------|---------------------|
| Render-blocking resources | 573 ms | 438 ms |
| Unused JavaScript | 450 ms | 600 ms |
| Unused CSS | 300 ms | 300 ms |
| Properly size images (responsive) | 150 ms | **900 ms** |
| Serve images in next-gen formats (AVIF/WebP) | 150 ms | 320 ms |

Findings:

| # | Sev | Page | Observation | Fix hint |
|---|-----|------|-------------|----------|
| 108 | HIGH | `/security` mobile | LCP is **6.5 s** (perf 73). The biggest single opportunity is "Properly size images" at 900 ms — i.e. an image is being served at a resolution far above its rendered size on mobile. The hero image on `/security` is the candidate (verify). **Verified 2026-05-13 with a fresh Lighthouse mobile run** (`tmp/lh-security.json`, prod URL, devtools throttling): performance 61, LCP 7,008 ms; LCP element confirmed `<img class="mk-route-photo-image" src="/marketing-media/security.jpg">` rendered by the shared `<MarketingRouteBackdrop>` portal (not by the security page tree, which is why initial grep over `app/(marketing)/security/` came back empty). Load Time dominates the LCP at **5,263 ms / 75%**. Top three opportunities by `overallSavingsMs`: `uses-responsive-images` 900 ms, `modern-image-formats` 450 ms, `render-blocking-resources` 139 ms — i.e. the audit's named cause was correct, just shipped via a shared component. **Shipped in #75** — converted the bare `<img>` to `next/image` with `fill`, `sizes="100vw"`, `priority`, `quality={60}`; closes both image-related opportunities and benefits every non-home marketing page (covers §17 #109 + #110). | Add explicit `width` / `height` + a `<source media=...>` `srcset` for the security hero image. |
| 109 | MED | `/features` mobile | LCP **6.0 s** (perf 74). Same opportunity profile — render-blocking, unused JS, unused CSS. | Combined fix in #110. |
| 110 | MED | All mobile pages | The 5 opportunities are consistent across pages, suggesting they're framework-wide (the Next.js shared chunks, the Tailwind output, the marketing-hero image component). One fix run benefits the whole site. | Audit pass: turbopack chunk split, Tailwind purge, image component. |
| 111 | LOW | All pages | CLS = 0 under throttling too. The streaming-RSC handoff is well-anchored even on slow networks. | — |

## §18 — Pass-2 summary

**New finding count by dimension (severity):**

| Dimension | CRIT | HIGH | MED | LOW | Total |
|-----------|------|------|-----|-----|-------|
| §13 Browser walk     | 0 | 0 | 1 | 2 | 3   (findings 82–84) |
| §14 Forms            | 0 | 1 | 4 | 2 | 7   (findings 85–91) |
| §15 Keyboard nav     | 0 | 1 | 2 | 4 | 7   (findings 92–98) |
| §16 Mobile viewports | 0 | 1 | 4 | 4 | 9   (findings 99–107) |
| §17 Throttled perf   | 0 | 1 | 2 | 1 | 4   (findings 108–111) |
| **Pass-2 totals**    | **0** | **4** | **13** | **13** | **30** |

Pass 1 + Pass 2 cumulative: 50 + 30 = **80 findings**. Severity
totals across both passes: CRIT 3 / HIGH 18 / MED 35 / LOW 24.

### Pages covered (10/10)

`/`, `/features`, `/security`, `/trust` (substituted for non-
existent `/compliance`), `/healthcare-compliance` (substituted
for non-existent `/care`), `/about`, `/contact`, `/blog`,
`/legal/terms`, `/legal/privacy`. Pricing excluded per Phase D.

### Headline issues (Pass 2)

1. **Cookie consent banner is the last tab stop on every page**
   (§15 #92) — WCAG 2.4.3 focus-order regression and a usability
   blocker for keyboard-first users.
2. **Contact form has no custom validation UI** (§14 #85, #86) —
   silent failure on empty submit / bad email past the browser's
   own tooltip; the existing `required` attributes go unrealised
   in the rendered UI.
3. **`/security` mobile LCP is 6.5 s** (§17 #108) — undersized-image
   savings of 900 ms identifies a single fix. `/features` is 6.0 s
   with the same pattern.
4. **`/healthcare-compliance` has unnamed icon buttons at 23–26 px**
   (§15 #96, §16 #100) — fails accessible-name, fails touch-target,
   single component, fix is mechanical.
5. **Top-nav finding from pass 1 (#7) is obsolete** (§15 #95) — the
   hydrated nav has 5 dropdowns covering the full buyer journey.
   Remove #7 from the repair queue.
6. **Lighthouse confirms pass 1 #1** (§12 SEO 83 universal) — the
   `\n`-in-URL bug fails `robots-txt is not valid` on every page.
   This is now triple-confirmed (curl, JSON-LD raw bytes,
   Lighthouse).
7. **Cookie banner occupies 27 % of mobile viewport** (§16 #104) —
   sticky header (61 px) + banner (218 px) leaves ~52 % usable on
   375 × 800.
8. **No bot mitigation on contact form** (§14 #89) — no captcha,
   no honeypot in rendered DOM; server-side rate limit is the
   only visible defence.
9. **No newsletter / DSAR / consent forms exist** (§14 #91) — gap
   between privacy policy language ("contact us to exercise your
   rights") and a structured intake.
10. **Form `action="javascript:throw new Error..."`** (§14 #88) —
    React anti-double-submit shim; form is dead without JS, no
    `<noscript>` fallback.

### Dimensions reached vs not

All 6 dimensions exercised. The only data point I could not fully
verify is the **server-side response** for a real contact-form
submission (§14 #87 boundary case) — that would have created live
records in the production CRM/email pipeline. The audit defers
that probe to whichever session has authorisation to send a
flagged test record.

### Pass-2 closing

This file is the only artefact from Pass 2. The Pass-1 repair
queue is updated by these notes:

- **Strike `#7` (nav additions)** from the repair queue. The
  hydrated nav already covers buyer-journey pages (§15 #95).
- **Promote a new HIGH** to slot before `#67` (FAQ empty): the
  cookie-consent tab-order issue (§15 #92) — single keyboard
  blocker on every page.
- **Promote `#85`** (no custom validation UI on contact form) into
  the cross-cutting list — same component, every CTA on the site
  routes into it.
- **Pass-1 #18 ("Lighthouse pass before LCP work")** is now
  resolved by §12 + §17. Specific opportunities (responsive
  images on `/security`, render-blocking, unused JS) replace the
  generic "verify" note.

## §19 — Housekeeping: Phase C HIGH+CRIT batch 1 (closed)

Shipped 2026-05-13 in PR order (CI green, merged):

| Audit row | PR | Concern |
|---|---|---|
| #1 CRIT | #67 | siteUrl trailing `\n` strip |
| #2 CRIT | #68 | /status unshipped + redirect + nav cleanup |
| #3 HIGH / #11 MED | #70 | Footer + JSON-LD contact info canonical |
| §11 D | #71 | /compliance + /care → /trust, /healthcare-compliance |
| #85 HIGH | #73 | Contact form inline validation |
| #92 HIGH | #72 | Cookie banner first tab stop |
| #96 MED / #100 HIGH | #74 | InteractiveDashboard touch targets + aria-labels |
| #108 HIGH | #75 | next/image on MarketingRouteBackdrop (verified Lighthouse) |

CI follow-on (cross-reference, surfaced while shipping the above):

- **PR #69** — `compliance-testing` workflow lacked `pull-requests:
  write` permission, so the `compliance-summary` job failed in 5s
  on every PR that touched `app/**/admin/**`, `app/**/privacy/**`,
  `middleware.ts`, or `tests/compliance/**`. Same shape as PR #54
  / #55 (env-var gaps on the same workflow). Permissions block +
  `continue-on-error: true` on the comment step. Worth noting here
  so the next CI sweep doesn't re-discover it from scratch.

Remaining Phase C queue (35 MED + 24 LOW from pass 1, ~13 MED + 13
LOW from pass 2 not yet shipped): walked in audit-file order,
severity-first within each section. Phase D pricing redesign
unblocks after Phase C HIGH+MED clears.

## §19a — Housekeeping: Phase C HIGH batch 2 (closed)

Shipped 2026-05-13 in PR order (CI green, merged):

| Audit row | PR | Concern |
|---|---|---|
| §20b portal cleanup + #112 LOW | #77 | `/status` dead portal entry removed |
| #16 MED | #78 | Drop personal `twitter.com/EjazDev` from JSON-LD `sameAs` |
| #6 HIGH | #79 | `/features` claim/count alignment (18 → 25) |
| #5 HIGH | #80 | Double `<h1>` from `<noscript>` fallback in immersive heroes |
| #4 HIGH | #81 | Framework labels strict taxonomy (no "Certified" without paper) |
| #8 HIGH | #82 | Replace fabricated "Trusted by" customer strip with "Built on" tech-partners |
| §20c industry routes | #83 | Document 5 industry pages as intentional portal opt-out |
| §20d portal images | #84 | Recompress 3 portrait JPEGs (4 landscapes left as-is — already optimal) |

### Ordering self-catch

#78 (MED #16) shipped before the unshipped §3 HIGHs (#4, #5, #6,
#8). The severity-first rule was violated on that one cadence step.
Course-corrected by re-prioritising the four HIGHs immediately and
shipping them as #79 → #82 before resuming the MED queue. Logging
here so the cadence rule remains "severity within section, even on
cross-cutting" without quietly papering over the slip.

## §20 — `<MarketingRouteBackdrop>` portal sweep

Triggered by the user's "pull the shared-portal thread while it's
fresh" directive after #75. The portal config at
`lib/marketing/background-media.ts` maps `pathname → { imageSrc,
imagePosition }`; missing entries silently render no backdrop.

### §20a — Inventory

- **64** filesystem routes under `app/(marketing)/**` with a
  `page.tsx`.
- **55** entries in `ROUTE_MEDIA` (before this PR).
- **0** portal entries reference a missing on-disk image. All 55
  files exist under `public/marketing-media/`.

### §20b — Dead portal entry (shipped this PR)

| # | Sev | Finding | PR |
|---|------|---------|----|
| 112 | LOW | `/status` portal entry pointed at `/marketing-media/status.jpg` after the route was unshipped in #68. The portal never rendered the backdrop in practice (the route returns a 307 to `/`), but the dead entry was confusing. Removed in this PR. The image file is kept on disk for the day `/status` comes back. | This PR |

### §20c — Routes missing portal entries (10) — design call, partly resolved

These routes have a `page.tsx` but no `ROUTE_MEDIA` entry, so they
render without the shared backdrop. The 5 industry money pages were
ruled an **intentional opt-out** per user directive (their themed
`IndustryHero` + `AnimatedHeroBg` + `InteractiveDashboard` mock
converts better than a uniform photographic backdrop). Documented
in-code in PR #83 so the next maintainer doesn't silently add them
back. The remaining 5 (compare/case-studies/features sub-pages) are
still design calls — not regressions, just gaps.

| # | Sev | Route | Resolution |
|---|------|-------|-------|
| 113 | MED | `/healthcare-compliance` | **Resolved #83** — intentional opt-out; documented in `lib/marketing/background-media.ts` comment block. |
| 114 | MED | `/ndis-providers` | **Resolved #83** — same. |
| 115 | MED | `/financial-services-compliance` | **Resolved #83** — same. |
| 116 | MED | `/childcare-compliance` | **Resolved #83** — same. |
| 117 | MED | `/construction-compliance` | **Resolved #83** — same. |
| 118 | LOW | `/compare/complispace` | Compare-page series; the index `/compare` + `/compare/healthmetrics` have entries; complispace/riskware/6clicks do not. Still open. |
| 119 | LOW | `/compare/riskware` | Same series, still open. |
| 120 | LOW | `/compare/6clicks` | Same series, still open. |
| 121 | LOW | `/case-studies` | Page exists at `app/(marketing)/case-studies/page.tsx`; not in the sitemap or pass-1 audit scope. (verify whether the page is intentional or a placeholder.) |
| 122 | LOW | `/features/pillars` | Sub-page; the parent `/features` has an entry. Either intentional (sub-page reuses parent backdrop) or a gap. |

### §20d — Oversized portal images (>200 KB raw) — partly shipped in #84

After PR #75, every portal image is served via `next/image` so
Vercel's image optimizer transcodes to AVIF/WebP at the requested
viewport size. The on-disk raw size still determines the
optimisation budget — bigger sources, more processing per request,
slower cold transcodes.

PR #84 recompressed the **3 portrait sources** (1800×2700) where a
viewport-appropriate downscale to 1280×1920 cut raw bytes
substantially. The remaining 4 entries are landscape sources
already at sensible dimensions — PIL re-encode at q=80 increased
file size by 10–13%, so they were left as-is. The aspirational
≤180 KB target proved too aggressive for already-optimized JPEGs;
the practical win is the served-bytes path (AVIF/WebP via
`next/image`), which PR #75 already unlocked.

| # | Sev | Route | Before | After | Status |
|---|------|-------|------|-------|-------|
| 123 | LOW | `/documentation/api` | 573 KB | 397 KB | **Shipped #84** — 1800×2700 → 1280×1920. |
| 124 | LOW | `/industries` | 537 KB | 413 KB | **Shipped #84** — same. |
| 125 | LOW | `/use-cases/workforce-credentials` | 446 KB | 302 KB | **Shipped #84** — 1800×2687 → 1286×1920. |
| 126 | LOW | `/trust/vendor-assurance` | 310 KB | 310 KB | Not shipped — landscape source; re-encode grew file. |
| 127 | LOW | `/security` | 303 KB | 303 KB | Not shipped — landscape source; AVIF/WebP via #75 already handles served bytes. |
| 128 | LOW | `/trust/incident-response` | 220 KB | 220 KB | Not shipped — landscape, same. |
| 129 | LOW | `/trust` | 213 KB | 213 KB | Not shipped — landscape, same. |

Lesson recorded: the ≤180 KB rule of thumb only buys back bytes
when the source is over-dimensioned (portrait at 1800w). Already
correctly-dimensioned JPEGs from this batch were close to PIL's
quality-80 floor and can't be cheaply re-encoded smaller. Future
asset passes should check dimensions before assuming the source is
recompressible.

### §20e — Alt text + OG alignment — verified clean

- **Alt text:** `<Image alt="">` on all backdrop renders, which is
  correct — the image is decorative ambience behind text content
  (`.mk-route-photo-image { opacity: 0.24; }`). WCAG conformant for
  decorative imagery. No change needed.
- **OG vs portal:** OG images come from `opengraph-image.tsx` per
  page directory (Next.js convention) and are entirely independent
  of the portal mapping. They serve different surfaces (social
  previews vs page backdrop). Drift is not a concern because they
  are not meant to be the same asset. The OG-coverage gap (cross-
  cutting #10: ~42 of 85 pages have no `og:image`) is a separate
  finding queued in the Phase C MED batch.
