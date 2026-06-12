# FormaOS App — UI Elevation Audit & Findings

_Authenticated product (`app/app/**`, `app/admin/**`, `app/audit-portal/**`, `app/onboarding/**`, `app/auth/**`) + shared primitives (`components/ui/**`, `components/**`) + theme tokens (`app/globals.css`)._
_Marketing (`app/(marketing)/**`, `marketing.css`, `design-system.css`) and `app/home-poc/**` are **out of scope**._

Date: 2026-06-07 · Method: 5-agent read-only census (token layer, 18 UI primitives, always-on chrome, app-wide ripgrep census, 9 representative pages).

---

## TL;DR — the headline is good news

The token layer is **already ~70% migrated**. The brief's "biggest single tell" — cyan `--primary`/`--ring` in `:root` — **is already neutralized for the app**: the shell div carries `app-shell app-theme` ([app/app/layout.tsx:242](app/app/layout.tsx:242)), and `.app-theme` remaps `--primary` and `--ring` to a calm Tabler **blue** (`213 94% 68%` dark / `217 91% 55%` light) across **all** themes. Tailwind's `cyan` + `teal` ramps are also globally remapped to a grey/charcoal scale ([tailwind.config.ts:34-59](tailwind.config.ts)), so most `text-cyan-*`/`bg-teal-*` classes already render grey.

So this is **not** a from-scratch rebrand. It's finishing the job: closing the token leaks `.app-theme` missed, sweeping residual literal cyan/violet/sky out of always-on chrome, consolidating a fragmented status palette, and deleting dead decorative CSS.

**One scope guard:** `components/motion/**` holds the worst gradient-blob/violet debt (280 hits) but is **marketing-only — 0 imports from any app surface** — so it stays out of scope despite living under `components/`.

---

## Prioritized findings

### TIER 1 — Token layer (highest leverage; fix once, propagates everywhere across all 5 themes)

| # | Finding | Where | Fix |
|---|---------|-------|-----|
| T1 | **`--accent` / `--secondary` leak non-blue hue into the app.** `.app-theme` remaps `--primary`/`--ring` but NOT `--accent`/`--secondary`, which stay violet (dark `258 90% 66%`), magenta (aurora), teal (graphite/midnight). | `hover:bg-accent`/`bg-accent/30-50` ×30 (forms, tasks, visits, policies, registers, incidents, vault, executive, reports), sidebar active link, `badge` outline+secondary, `button` secondary | Add `--accent`/`--accent-foreground`/`--secondary`/`--secondary-foreground` to the `.app-theme` scope as a **neutral surface** (mirrors how `--primary` was handled). Kills 70 token-based + 24 gradient-stop violet renders in one edit. |
| T2 | **`--info` reintroduces the killed palette per theme** — aurora `--info` = cyan `189 94% 53%`, midnight-blue = violet `243 75% 51%`. | `badge variant="info"`, `compliance/frameworks` | Pin `--info` to the app blue under `.app-theme`. |
| T3 | **Three near-identical blues** for one "interactive/info" role: `--primary` (.app-theme), `--app-primary` (`217 91% 60%`), `--info` (`213 100% 60%`). | filter-bar, avatar-stack, kpi-bar, attention-rail, badge | Collapse to **one** interactive-blue token. |
| T4 | **Status hexes ≠ status tokens.** `--wire-alert` (#f43f5e) / `--wire-success` (#10b981) are hardcoded and don't equal `--destructive`/`--success`; `metric-card-warning/success` use raw `amber-500`/`emerald-500`. | globals.css `:1177-1187`, `:1405-1410` | Re-point wires + metric-card borders to `hsl(var(--destructive))` / `hsl(var(--success))`. |
| T5 | **Light-theme sidebar active link is hardcoded indigo `!important`**, defeating the rationalized `--primary`. | [globals.css:2095](app/globals.css) | Change to `hsl(var(--primary) / …)`. |
| T6 | **Dead decorative classes/keyframes** (0 in-app consumers): `holo-border`, `command-grid`, `flow-lines`, `animate-float`, `animate-border-flow`, `node-active/at-risk/verified` (+ `node-pulse`/`node-at-risk`/`node-verified` keyframes), `wire-flowing/pulsing`, `glow-blue/violet`, `text-gradient`, `.vignette`, bare `.shimmer`, `.glass-intense`/`.glass-frosted`. | globals.css | Delete classes + keyframes + the `--glow-blue/violet` vars. Low risk. |
| T7 | **`--node-*` 7-hue rainbow** (policy=cyan, control=teal, evidence=violet, audit=amber, risk=rose, task=emerald, entity=slate). Only `--node-evidence` is consumed; the other 6 are dead and overlap the status palette. | globals.css `:1152-1160` | Prune the 6 dead tokens; keep/neutralize evidence. |

### TIER 2 — Always-on chrome (renders on every authed page → outsized first-impression weight; small file count)

| Finding | File:line |
|---------|-----------|
| **Cyan selected-state** on the global ⌘K palette | `CommandPalette.tsx:660-661, 711` |
| **Full cyan theme + hardcoded white-alpha glass** (breaks on light) on the persistent feedback FAB | `FeedbackWidget.tsx:105,126,136,162` + `white/[0.06]`, `bg-white/[0.03]` |
| **`Sparkles` + cyan-300** ornament in Help panel header | `HelpAssistant.tsx:161` |
| **Cyan-400 Bot icon** in AI assistant slide-over | `AiAssistantPanel.tsx:236` |
| **Rainbow type-chips** (sky/emerald/purple) in global search | `topbar-search.tsx:122,126,130` |
| **`bg-slate-950/95` panel + sky active-filter + raw rose unread badge** (all off-token, break on light) | `notification-center.tsx:302,330,293` |
| **`Sparkles` misused as the Compliance nav icon** (mobile, always visible) | `mobile/bottom-nav.tsx:55` → use `ShieldCheck` |
| **Sparkle ornament** on onboarding strip | `OnboardingStrip.tsx:24` |
| **Neon pulsing "Healthy" dot** | `admin-shell.tsx:153` |
| Sidebar RAG dots use raw red/amber/emerald **and are colour-only** (generic `aria-label`) | `sidebar.tsx:82-100` |

`ComplianceStatusStrip.tsx` is the **reference pattern** to copy: colour + icon + label, `--wire-*` tokens. `toaster.tsx` (richColors=false), `dialog.tsx`, `Logo.tsx`, `theme-switcher.tsx` are already clean.

### TIER 3 — Shared UI primitives (`components/ui/**`)

- **Retire `glass` variant** on `button.tsx`, `badge.tsx`; swap `sheet.tsx` drawer surface from `bg-glass-strong` → opaque `bg-popover`.
- **Off-token status reds** → `--destructive`: `error-boundary.tsx` (red-50/200/600), `alert-dialog.tsx:140` (red-600) + `:156` dark-only slate Cancel button (breaks on light/aurora).
- **`page-hero.tsx:23-28`** metric tone (amber-500/rose-500/emerald-500) → tokens, and pair with icon/label (currently colour-alone). _Highest-value semantic primitive edit — 19 page heroes._
- **`submit-button.tsx`** is the most off-brand primitive: `font-black uppercase tracking-[0.2em]`, glass + off-token rose variants, card-coloured primary that fails contrast on light, **no focus rings**. Candidate to deprecate toward `Button` + `useFormStatus`.
- **`avatar-stack.tsx`** hashes user names into a 7-colour rainbow incl. `bg-violet-700`/`bg-cyan-800` → drop those tones.
- **Missing `focus-visible` rings**: submit-button (×3), error-boundary, avatar-stack OwnerChip, filter-bar (remove/clear), data-table sort header. **`breadcrumbs.tsx:42`** uses a one-off `ring-emerald-500` → `ring-ring`.
- **`badge.tsx` is the canonical status set** — document the "pair icon/label, never colour-alone" rule; verify AA on the 15%-tint variants.

### TIER 4 — Status/severity consolidation (biggest _visible_ inconsistency; **high blast radius >100 files → staged, never bulk find-replace**)

**≥9 independent helper functions re-derive RAG with raw palette hexes, drifting in shade AND hue.** The same "open/pass" status is `green-500` on one page, `green-600` on another, `green-400` on a third:

- `incidents/page.tsx:37-48` `getSeverityColor` (red/orange/amber/green-500+600)
- `forms/page.tsx:29-40` `getStatusBadge` (green/amber/gray-400)
- `care-plans/page.tsx:40-119` `getReviewStatus` + `STATUS_LABELS` (red/orange/amber/green/blue-600)
- `compliance/…/ObligationsTable.tsx:71-75` (red/orange/green-500+700+400)
- `admin/dashboard/page.tsx` `KPICard.colorMap` + risk/health maps (blue/emerald/purple/amber/sky/rose)
- `settings/page.tsx` `StatusBadge` + `SummaryValue` (emerald/amber/rose at -500 **and** -300/-200)
- `dashboard/tabler-primitives.tsx` `Tone`/`gaugeTone`/`directionColor` (emerald/amber/rose-500 + raw `hsl()`)
- `page-hero.tsx` + `DashboardHero.tsx` re-declare the same warning=amber/danger=rose/success=emerald inline.

**Off-palette hues to fold in:** ORANGE (incidents follow-up, care-plans ≤14d) → warning; PURPLE (admin KPI/MRR, gradient progress) → remove (no meaning); SKY/BLUE-info (admin "watch", care-plans under_review) → one info token; PINK (reports NDIS card) → remove.

**Plan:** define & document one set (`--success`/`--warning`/`--destructive`/`--info`), expose via the existing `badge`/`status-pill`/`count-chip` primitives, then migrate per-area. Status stays colour-coded but **always paired with icon/label**.

### TIER 5 — Heavy per-area offenders (fix after the shared layers land)

- **`form-builder-client.tsx`** — _single heaviest surface._ Entirely off-token raw gray/blue palette (`bg-gray-900/50`, `bg-blue-600`, `ring-blue-500`, `text-white`); ignores theme, breaks on light/aurora.
- **`dashboard/tabler-primitives.tsx`** — shared decoration source: `CARD_HOVER` lift+double-shadow halo, `Sparkline` gradient-fill + glow-dot, `IconTileStat` ring-4 tinted icon halo. Flatten once → benefits dashboard + vault + every StatTile page.
- **Auth shell cluster** (`app/auth/**`) — uniform `bg-gradient-to-br from-slate-900…` backdrops + glass cards + cyan/sky focus rings. Replace with one flat tokenized auth shell.
- **`admin/dashboard/page.tsx`** — rainbow gradient KPI cards, decorative purple, neon "Healthy" pulse.
- **`care-plans/page.tsx`** — only data page still on legacy `.page-header`/`.metric-card-*` (smaller title, **non-tabular numbers**, orange tier) → migrate to `PageHero`.

### Glassmorphism — biggest offender by raw count (904 hits / 138 files)

It's baked into the design system (`.glass-panel`, `--glass-*`). **Keep** on shell chrome (sidebar/header/mobile drawer/command palette) + modal scrims; **replace in-content `bg-glass-*`** with the flat `surface-1/2/3` elevation tokens (which exist for exactly this); strip `backdrop-blur` from inner cards. Heaviest: `industry-widgets.tsx` (41), `progress-indicator.tsx` (37), `workflow-builder.tsx` (34).

### Already clean (no action)
`app/audit-portal` (0 hits); within `app/app`: dashboard, incidents, participants, team, governance, profile; `executive/ExecutiveDashboardClient.tsx` is the model. `Logo.tsx`, `toaster.tsx`, `dialog.tsx`, `theme-switcher.tsx`, `input.tsx`, `select.tsx`, `separator.tsx`.

---

## Census numbers (in-scope dirs, marketing excluded)

| Pattern | Hits | Verdict |
|---|---|---|
| `glass-*` utilities | 904 / 138 files | decorative (rationalise at token layer) |
| gradients (`bg-gradient-`/`from-`/`via-`/`to-`) | 817 | decorative (≈103 chromatic, rest neutral) |
| cyan trio (text/bg/border) | 342 | decorative — already grey via Tailwind remap; sweep literals |
| emerald+green | 456 | **mixed** — status (keep) + decorative tail |
| amber | 273 | **semantic** (warning) |
| red+rose | 501 | **semantic** (fail/critical) |
| sky | 98 | decorative |
| violet/purple/indigo/fuchsia | 153 | decorative |
| `Sparkles` (lucide) | 53 / 25 files | decorative ornament |
| `backdrop-blur` | 97 | decorative |
| `animate-pulse` | 105 | mixed (~16 legit skeletons) |

---

## Verification gates (run before any PR)
`npm run type-check` (0 source errors) · `npm run lint` (changed files) · `npm run build` (definitive) · `npm run test:coverage` (for shared components) · visual spot-check ≥ `dark` + `light`. Known-flaky/pre-red on main (not our regressions): `db:test:verify`, gdpr/soc2/a11y.

> **GitNexus note:** the GitNexus MCP tools are **not connected this session**, so the CLAUDE.md-mandated `gitnexus_impact`/`gitnexus_detect_changes` can't run. I'll substitute grep-based blast-radius for shared `components/ui/**` edits and call it out, or run `npx gitnexus` from the CLI if you want the index-backed analysis.
