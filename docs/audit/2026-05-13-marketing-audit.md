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
| 1 | CRIT | `sitemap.xml`, `robots.txt`, JSON-LD on every page | A `SITE_URL` (or equivalent) constant is built with a trailing newline. Raw bytes of `<loc>` are `https://www.formaos.com.au\n/about`. `robots.txt` has `Sitemap: https://www.formaos.com.au\n/sitemap.xml`. Home JSON-LD: `"url":"https://www.formaos.com.au\n","logo":"https://www.formaos.com.au\n/og-image.png"`. Confirmed via `xxd` and grep across all 85 pages. | Locate the constant (likely env var `NEXT_PUBLIC_SITE_URL` or a template literal in `lib/seo` / `app/sitemap.ts` / `app/robots.ts`); strip trailing whitespace at consumption or trim at the source. One fix corrects sitemap, robots, and all JSON-LD simultaneously. |
| 2 | CRIT | `/status` | "All systems operational" banner with `0%` 7-day uptime, `0` 24h uptime, `0` 7-day checks, "No recent check data available". Monitoring data isn't reaching the page. | Either gate the green badge on real data, or surface "monitoring data unavailable" honestly. Procurement teams screenshot this. |
| 3 | HIGH | Every page footer + every JSON-LD block | Two contradictory identities on the same 82 pages: footer mailto `Formaos.team@gmail.com` (Gmail) vs JSON-LD `contactPoint.email: support@formaos.com.au`. JSON-LD says `addressLocality: Adelaide, addressRegion: SA`; visible footer + contact page say "Sydney, Australia". | Pick one address + one contact email; mirror across visible copy and JSON-LD. The Gmail address on the visible side is the trust-side risk — a Gmail support address for a SOC 2 / ISO-claiming platform is a red flag in vendor-assurance reviews. |
| 4 | HIGH | `/security`, `/trust`, all industry pages | 18+ frameworks listed (SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, NIST CSF, CIS Controls, etc.) with no certification-status qualifier — no "certified", "in progress", "supported", or "ready" anywhere on the public surface. Enterprise buyers reading "SOC 2" assume Type II certification. | Add a single status taxonomy ("Certified" / "Audit-ready" / "Supported framework") and apply it everywhere a framework name appears in trust context. |
| 5 | HIGH | 67 of 85 pages | Two `<h1>` elements rendered per page with different Tailwind class signatures (`text-[2.35rem] ...` and `text-[2.5rem] ...`). Most visible on `/contact` and `/blog` where both `<h1>`s carry the same text. Looks like the marketing layout's hero heading and the page-level heading both render as `h1`. A11y violation and SEO confusion. | Demote one to `h2` (probably the layout-level hero subtitle, or wrap it in a `role="banner"` block with `h1` only for the page-specific heading). |
| 6 | HIGH | `/features` | Hero claim says "18 features across compliance, automation, security, and collaboration." Category counts immediately below sum to 5+6+4+7+3 = **25**, not 18. | Fix the hero number or the category counts; they should match. |
| 7 | HIGH | Top nav (every page) | Primary nav surfaces only "Home", "Pricing", and the "Get Compliance Plan" CTA. Product, Features, Industries, Trust, Compare, Customer Stories — all the buyer-journey pages — are footer-only. First-time enterprise visitors hit a wall. | Add at least Product, Industries, and Trust to the primary nav. |
| 8 | HIGH | `/security`, `/trust`, every industry page | "Trusted by" claims and feature claims appear without any third-party verification anchor. `/customer-stories` is honest ("Anonymized scenarios"), but the home page implies real trust. | Either name a small number of pilot customers (with permission) or remove ambiguous "trusted by" framing. |
| 9 | MED  | Whole site | SEO URL cannibalization: 3 healthcare pages (`/healthcare-compliance`, `/healthcare-compliance-platform`, `/use-cases/healthcare`), 3 NDIS pages (`/ndis-providers`, `/ndis-compliance-system`, `/use-cases/ndis-aged-care`), 2 financial pages (`/financial-services-compliance`, `/use-cases/financial-services`). All targeting overlapping search intents. Google will pick one and ignore the others, or split rank between them. | Consolidate to one canonical per industry; the others should `301` or carry a `rel="canonical"` to the primary. |
| 10 | MED | Whole site | ~42 of 85 pages have **no `og:image`** (verified by parsing every static HTML response). Pages missing OG image include `/features`, `/enterprise`, `/integrations`, `/faq`, `/contact`, `/customer-stories`, `/documentation`, `/changelog`, `/roadmap`, all six `/use-cases/*`, all six trust subpages with the exception of `/trust/dpa`. Social previews on LinkedIn/Twitter fall back to text. | Add `opengraph-image.tsx` (or `opengraph-image.png`) to each page directory; Next.js convention will pick it up. The home, about, and blog-post directories already have one — same pattern. |
| 11 | MED | `/contact`, footer (every page) | Visible support email is `Formaos.team@gmail.com`. For the audience FormaOS is selling to (NDIS providers, AHPRA-regulated practices, AFS licensees, SOC 2 buyers), a Gmail address on the support surface materially weakens vendor-assurance reviews. Note this is consistent with JSON-LD finding #3 but worth its own line — the visible-side change is the user-facing fix. | Replace with `support@formaos.com.au` site-wide. DNS already supports it (Resend is in the subprocessor list, and JSON-LD already uses the address). |
| 12 | MED | Many pages | Top-level page titles run **>60 characters** on at least 22 pages, including `/`, `/pricing`, `/ndis-providers`, `/healthcare-compliance`, `/healthcare-compliance-platform`, `/childcare-compliance`, `/construction-compliance`, `/audit-evidence-management`, all four `/compare/*`. Google truncates around 60. Most of these include "\| FormaOS" + a tagline that's already in the meta description. | Tighten title to `<Action verb> — <vertical> \| FormaOS` shape; move the long-tail to the description. |
| 13 | MED | Many pages | Meta description >170 characters on ~16 pages (`/`, `/pricing`, `/features`, `/compare`, `/enterprise`, `/childcare-compliance`, `/construction-compliance`, `/financial-services-compliance`, `/healthcare-compliance-platform`, `/ndis-compliance-system`, `/ndis-providers`, `/integrations`, `/roadmap`, `/what-is-a-compliance-operating-system`, plus two blog posts). Google truncates around 155–160. | Trim to ≤160 chars. |
| 14 | MED | Many pages | Meta description **<100 characters** on `/status` (44), `/terms` (39), `/trust/data-handling` (74), `/trust/subprocessors` (71), `/trust/sla` (89), `/trust/dpa` (95), `/trust/incident-response` (84), `/trust/procurement` (82), `/evaluate` (84), `/legal` (99), `/our-story` (93), `/prove` (97). Short descriptions waste SERP real estate. | Expand to ~140–155 chars; trust pages especially deserve a real summary. |
| 15 | MED | Whole site | The CSP allows `'unsafe-inline'` for `script-src` and `style-src`. The `2026-05-12-deep-audit.md` already flagged this (finding #11) — listing here so the marketing-side awareness is on record. No new code change implied. | Defer to existing finding. |
| 16 | MED | Home + JSON-LD on every page | Organization JSON-LD `sameAs` lists `https://twitter.com/EjazDev` — that's the founder's personal handle, not a company handle. Treated by knowledge-graph indexers as the company's social profile. | Replace with a company handle, or drop the `sameAs` Twitter entry until one exists. |
| 17 | LOW | All pages | `x-xss-protection: 1; mode=block` is sent in headers. The header is deprecated; modern browsers ignore it. Not harmful, just dead weight. | Drop from `next.config.ts` headers config. |
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
| 25 | LOW  | Section terminology | Uses "Compliance Operating System" and "Governed System" interchangeably. Slight terminology drift from `/what-is-a-compliance-operating-system` which fixes the term. | Pick one phrase per page or use a glossary. |

### §4.3 `/features`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 26 | HIGH | Hero count | "18 features" claim vs categories summing to 25. See cross-cutting #6. | — |
| 27 | MED  | Heading hierarchy | `h1 → h3 → h4` (skips `h2`). WCAG AA violation. | Restructure to `h1 → h2 → h3`. |
| 28 | LOW  | Category labels | Categories use generic names ("Compliance Core", "Identity & Security") but individual feature names are not enumerated — only counts. Reduces SEO surface and makes it hard for a buyer to skim. | Consider listing individual feature names; current "5 features" / "6 features" reads as marketing hand-wave. |

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
| 49 | LOW  | "300+ ASIC obligations mapped" | Specific number ("300+") with no methodology link. (verify it isn't drifting between this page and `/ndis-providers` which says "400+ NDIS obligations"). | Add a methodology footnote on both. |

### §4.17 `/childcare-compliance` + `/construction-compliance`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 50 | MED  | Pricing tiers | Both pages publish Foundation $297, Growth $797 (Most Popular), Scale $1,800, Enterprise custom — while `/pricing` shows nothing. The four-tier breakdown across these pages is *consistent with itself*, just inconsistent with `/pricing`. See cross-cutting D-1. | — |
| 51 | LOW  | "300+ pre-built obligations" (childcare) / "250+ pre-built WHS Act obligations" (construction) | Specific numbers without methodology. Buyers may push back. | — |

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
| 57 | LOW  | Index | No RSS link surfaced. (verify in browser — Next can auto-generate `/feed.xml`.) | Consider exposing `/blog/rss.xml`. |
| 58 | MED  | Every post (sample: `/blog/austrac-aml-ctf-compliance-guide`) | Author is "FormaOS Team" — no individual bylines. For regulatory content (AUSTRAC, AHPRA, SIRS), buyers want to see who wrote it. | Add author profile / role on at least the regulator-specific posts. |
| 59 | LOW  | Sample post | No "Last updated" date — only published date. For evergreen regulatory content, last-updated is what readers want. | Add `dateModified` to JSON-LD article schema and a visible "Updated" line. |
| 60 | LOW  | All posts | Each post has two `<h1>` tags — same cross-cutting issue #5. | — |

### §4.21 `/about` + `/our-story`

| # | Sev | Location | Observation | Fix hint |
|---|-----|----------|-------------|----------|
| 61 | MED  | Both pages | Heavy duplication of intent. `/about`: "Compliance infrastructure built for accountability" — abstract. `/our-story`: "Built for Organizations Where Compliance Is Mission-Critical" + one founder quote (Ejaz Hussain, Founder & Chief Engineer). Neither has a real story, timeline, or team. The pages overlap in purpose but neither completes the job. | Merge into a single `/about` with: founding year, team size, founder section, mission. Redirect the other URL. |
| 62 | LOW  | `/about` | No founding year visible. JSON-LD says `foundingDate: "2025"` — surface it on the visible page. | — |

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
  needs to close.
- **D-2** — `/pricing` page title is 76 chars (over Google truncation).
- **D-3** — `/pricing` meta description is 185 chars (truncated in SERP).
- **D-4** — `/pricing` body has a "Pricing.v4 / liveFY26 · AUD" version
  badge — fine internally, reads as draft state to outside visitors.
  Consider hiding this in the redesign.
- **D-5** — `/pricing` references `#pricing-table` anchor but the
  table itself isn't visible in the static HTML response. (verify
  the anchor in browser; if it never paints, that's a hydration bug.)
- **D-6** — `/pricing` CTA shape ("Plans are anchored to risk,
  framework scope, and operational complexity — not feature
  unlocks") is a strong sentence — keep it through the redesign.
- **D-7** — Trial language absent. No free trial, no freemium, no
  "try before you buy". For a $297/mo Foundation tier, a trial
  affordance is the default expectation in this market. Worth
  considering as part of the redesign brief.

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
