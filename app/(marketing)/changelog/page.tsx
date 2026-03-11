import type { Metadata } from 'next';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Changelog - FormaOS',
  description:
    'Stay up to date with the latest improvements, new features, and fixes shipped by the FormaOS team.',
  alternates: { canonical: `${siteUrl}/changelog` },
  openGraph: {
    title: 'Changelog | FormaOS',
    description: 'New features, improvements, and fixes from the FormaOS team.',
    type: 'website',
    url: `${siteUrl}/changelog`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog | FormaOS',
    description: 'New features, improvements, and fixes from the FormaOS team.',
  },
};

interface ChangelogEntry {
  readonly version: string;
  readonly date: string;
  readonly tag: string;
  readonly tagColor: string;
  readonly title: string;
  readonly releaseName?: string;
  readonly items: readonly string[];
}

const ENTRIES: readonly ChangelogEntry[] = [
  {
    version: '2.1.0',
    date: '2026-03-11',
    tag: 'Feature',
    tagColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    title: 'SCIM 2.0, integrations expansion & marketing integrity sweep',
    items: [
      'SCIM 2.0 provisioning server shipped (RFC 7644) — Users and Groups CRUD with bearer-token auth for Okta, Entra ID, and other identity providers.',
      'Jira integration launched — bidirectional compliance task sync via Atlassian REST API v3 with status transitions and evidence linking.',
      'Linear integration launched — compliance task push/sync via GraphQL API with automatic state mapping.',
      'Google Drive integration launched — link Drive files as evidence artifacts with chain-of-custody metadata and version tracking.',
      'SHA-256 evidence checksums wired end-to-end — client-side hash computation before upload, stored alongside every evidence artifact for tamper detection.',
      'Automated compliance posture checks running every 6 hours via Vercel cron — expiring credentials, overdue tasks, evidence gaps, and score drift detection.',
      'Data residency configuration system built — AU region active, US and EU regions infrastructure-ready with per-organisation region selection.',
      'OWASP Top 10 automated security scanner added — 8 pattern checks covering secrets, SQL injection, XSS, SSRF, insecure crypto, and dependency vulnerabilities.',
      'Platform Features marketing page shipped — 18 core features across compliance, workflow, security, and collaboration categories.',
      'Public Roadmap page launched — transparent product planning with shipped, in-progress, planned, and exploring items.',
      'Full marketing integrity audit completed — overclaims corrected across 29+ pages, under-advertised features surfaced, fabricated metrics removed.',
      'Integration sync infrastructure added — integration_configs and integration_sync_log tables for cross-system entity mapping.',
    ],
  },
  {
    version: '2.0.2',
    date: '2026-03-05',
    tag: 'Security',
    tagColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    title: 'Security hardening & API quality sweep',
    items: [
      'Full codebase security audit completed — 21 findings identified and resolved across critical, high, and medium severity.',
      'TOTP encryption enforced in production — plaintext fallback restricted to dev/test only.',
      'Rate limiter now fails closed on authentication routes when Redis is unavailable.',
      'HTTP 401 vs 403 semantics corrected across all API routes — proper unauthenticated vs unauthorized responses.',
      'CORS support enabled for the public REST API with preflight OPTIONS handling.',
      'All 159 console statements across 71 API route files migrated to structured Pino logging via routeLog() factory.',
      'All 65 untyped parameters in the API layer replaced with proper TypeScript types — zero `: any` remaining.',
      'Dead code removed, 35+ broken multi-line imports repaired, full test suite passing: 442 tests across 45 suites, 0 TypeScript errors.',
    ],
  },
  {
    version: '2.0.1',
    date: '2026-02-26',
    tag: 'Improvement',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    title: 'SEO overhaul, care provider vertical & architecture audit',
    items: [
      'Full SEO overhaul with 6 high-intent landing pages, canonical URLs, and OG/Twitter card coverage across all key routes.',
      'Care provider vertical launched — industry-specific marketing, compliance network visualisation, and role-based onboarding.',
      'All 5 critical risks and 8 structural weaknesses from full architecture audit resolved.',
      '10 UX/conversion gaps and 8 performance opportunities addressed across the platform.',
      'Premium 3D hero visuals deployed across all 44 marketing pages with reduced-motion guards.',
      'Comprehensive mobile UX hardening — iPhone X layout fixes across marketing and app shells.',
      'Force-static rendering applied across all marketing pages for performance and cacheability.',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-02-13',
    tag: 'Major Release',
    tagColor: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    releaseName: 'Citadel',
    title: 'FormaOS Citadel — enterprise platform release',
    items: [
      'SAML 2.0 SSO with metadata URL import — compatible with Okta, Microsoft Entra ID, and Google Workspace.',
      'Trust center, governance export packs, and enterprise visual system shipped.',
      'Enterprise QA audit completed: authentication, user journeys, compliance graph, performance, and security validated to production grade.',
      'Mobile performance optimisation — LCP improvements with deferred non-critical effects and dynamic code-splitting.',
      '5-layer security architecture validated: frontend gating, API guards, database RLS, environment isolation, and service role restriction.',
      'Unified release versioning and freeze architecture — footer badge, admin system page, and API metadata all reflect release state.',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-02-12',
    tag: 'Feature',
    tagColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    title: 'Enterprise UX maturity overhaul & release architecture',
    items: [
      '20-item enterprise upgrade roadmap implemented across 3 tiers covering UX, marketing, and platform.',
      '5 monolithic marketing pages decomposed into modular section components for maintainability.',
      'Enterprise product versioning, release freeze architecture, and controlled upgrade pipeline added.',
      'Premium dark theme upgrade applied to use-case pages, error states, footer, and navigation.',
      'Procurement flow section and admin risk heatmap added for enterprise buyer workflows.',
      'CI hardened — CodeQL SARIF non-blocking, security scans, and health endpoint integration.',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-02-11',
    tag: 'Improvement',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    title: 'Interactive product demos & app stability',
    items: [
      'Static marketing screenshots replaced with interactive product demo components across all pages.',
      'React hook-order crashes fixed on app shell and onboarding handoff.',
      'Onboarding loop resolved by healing framework state and completion drift.',
      'App link integrity audit — all broken /app routes identified and repaired.',
      'Auth email delivery fixed via Resend with branded auth email templates.',
      'Workspace recovery route added for stuck sessions.',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-02-09',
    tag: 'Feature',
    tagColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    title: 'Premium themes, admin console & cybersecurity hardening',
    items: [
      '4 premium themes launched — Midnight Ink, Graphite, Champagne, and Aurora — with dark + ivory light modes and database-persisted preferences.',
      'Admin console rebuilt — all fake data removed, real database metrics wired in, sidebar navigation fixed.',
      'Google login crash fixed by eliminating double fetchSystemState on OAuth callback.',
      'Mobile Safari OAuth cookie persistence resolved.',
      'Enterprise cybersecurity hardening pass — platform audit covering auth, security, and data integrity.',
      'Dashboard fixes: duplicate sidebar eliminated, quick actions, collapsible roadmap, and role badges.',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-02-07',
    tag: 'Improvement',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    title: 'Controlled product visibility & enterprise observability',
    items: [
      '20 verified production-ready features exposed in a controlled product visibility upgrade.',
      'Enterprise hardening pass — observability, billing reliability, and security improvements.',
      'Marketing aligned with product reality — surface key differentiators, remove speculative claims.',
      'Auth session persistence and timeout UX fixed for enterprise sign-in flows.',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-02-06',
    tag: 'Feature',
    tagColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    title: 'Automation engine, compliance intelligence & framework packs',
    items: [
      'Production-ready workflow automation engine — compliance controls trigger automated task creation on threshold conditions.',
      'Escalation rules: overdue tasks escalate automatically to the next owner level after a configurable window.',
      'Compliance Intelligence Summary system launched with real-time insights.',
      'Framework Pack Engine (Phases 1–5) completed — GDPR and PCI-DSS now selectable alongside existing frameworks.',
      'Blog system shipped — Next.js 15+ compatible pages, hero images, and integrated navigation.',
      'Guided demo mode, in-app tour, onboarding checklist, and contextual help assistant added.',
      'Redis health check and safe client for production reliability.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-02-05',
    tag: 'Fix',
    tagColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    title: 'Auth flow hardening & subscription billing',
    items: [
      'Email signup bootstrap fixed for organisation creation — new users no longer hit a blank state.',
      'Signup access-token hash handling on signin corrected for edge cases.',
      'Subscription upsert hardened for legacy columns with automatic backfill for older organisations.',
      'Task creation and owner settings edits unblocked across all plan types.',
      'Invite auth flow hardened — organisation membership now created on invite acceptance.',
      'Marketing CTAs pointed to real app signup, replacing placeholder links.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-01-22',
    tag: 'Improvement',
    tagColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    title: 'Marketing design sync & QA hardening',
    items: [
      'Complete marketing pages design sync with homepage design system — consistent typography, spacing, and components.',
      'Resources section added to footer — FAQ, Blog, and Documentation links.',
      'Mobile layout and performance fixes applied across Industries and Security sections.',
      'CTA links, auth cookies, QA scripts, and performance thresholds corrected.',
      'Node and wire integrity audit — all marketing CTAs standardised.',
      'Default RLS policies added and Supabase warnings resolved.',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-01-15',
    tag: 'Feature',
    tagColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    title: 'Brand identity, signature motion system & auth security',
    items: [
      'Enterprise SVG logo and brand assets wired across the entire application.',
      'FormaOS Signature Motion System — one-way scroll animations, micro-interactions, and premium header motion.',
      'Brand configuration centralised — header and footer use mark + text consistently.',
      'Complete authentication flow audit with OAuth redirect loop fix.',
      'Node-wire compliance graph validation reports for data integrity assurance.',
      'Feature flag infrastructure and baseline safety measures deployed (Phase 0).',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-01-14',
    tag: 'Major Release',
    tagColor: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
    releaseName: 'Sovereign',
    title: 'FormaOS Sovereign — initial enterprise release',
    items: [
      'Full compliance operating system launched — controls, evidence, policies, tasks, vault, audits, reports, registers, and team management.',
      'Node-wire compliance graph architecture with 7 core node types and 5 wire types for relational integrity.',
      'Complete RBAC integration with role-based routing and multi-layer permission guards.',
      'Row-level security deployed on all database tables — full multi-tenant data isolation.',
      'Enterprise content transformation across Home, Product, Industries, Security, and Pricing pages.',
      'Pricing aligned with Stripe billing — Pro and Enterprise plans with trial support.',
      'Comprehensive QA audit across Phases 1–6: real-time, analytics, workflow, AI, caching, mobile PWA, multi-org, enterprise security, and billing.',
      '81 routes configured, TypeScript clean, production build verified.',
    ],
  },
];

function TagBadge({ tag, className }: { tag: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {tag}
    </span>
  );
}

function LatestBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Latest
    </span>
  );
}

function YearDivider({ year }: { year: number }) {
  return (
    <div className="relative flex items-center gap-4 py-2">
      <div className="absolute -left-[29px] h-5 w-5 rounded-md bg-canvas-900 ring-1 ring-white/10 flex items-center justify-center">
        <span className="text-[8px] font-bold text-slate-400">★</span>
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
        {year}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  );
}

export default function ChangelogPage() {
  let lastYear: number | null = null;

  return (
    <MarketingPageShell>
      <CompactHero
        title="Changelog"
        description="New features, improvements, and fixes shipped by the FormaOS team. Delivered continuously."
        topColor="cyan"
        bottomColor="blue"
      />

      {/* Version summary strip */}
      <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 backdrop-blur-sm">
          <span className="text-xs text-slate-500">Releases:</span>
          <span className="text-xs font-semibold text-violet-400">
            v2.1.0
          </span>
          <span className="text-[10px] text-slate-700">·</span>
          <span className="text-xs text-slate-500">
            v2.0.2 Citadel
          </span>
          <span className="text-[10px] text-slate-700">·</span>
          <span className="text-xs text-slate-500">v1.1 — v1.8</span>
          <span className="text-[10px] text-slate-700">·</span>
          <span className="text-xs font-semibold text-violet-400">
            v1.0 Sovereign
          </span>
          <span className="text-[10px] text-slate-700">·</span>
          <span className="text-xs text-slate-600">
            {ENTRIES.length} updates
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Timeline spine */}
          <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-cyan-500/40 via-white/10 to-transparent" />

          <div className="space-y-14 pl-8">
            {ENTRIES.map((entry, index) => {
              const entryYear = new Date(entry.date).getFullYear();
              const showYear = entryYear !== lastYear;
              lastYear = entryYear;
              const isLatest = index === 0;
              const isMajor = entry.tag === 'Major Release';

              return (
                <div key={entry.version}>
                  {showYear && <YearDivider year={entryYear} />}

                  <article className="relative">
                    {/* Timeline dot — larger + glowing for major */}
                    {isMajor ? (
                      <div className="absolute -left-[35px] top-1.5 h-4 w-4 rounded-full bg-violet-500/20 ring-2 ring-violet-400/80 shadow-[0_0_12px_rgba(139,92,246,0.4)]" />
                    ) : (
                      <div className="absolute -left-[33px] top-1.5 h-3 w-3 rounded-full bg-canvas-800 ring-2 ring-cyan-500/60" />
                    )}

                    {/* Date, version, badges */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <time
                        dateTime={entry.date}
                        className="text-xs font-mono text-slate-500"
                      >
                        {new Date(entry.date).toLocaleDateString('en-AU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                      <span
                        className={`text-xs ${isMajor ? 'font-semibold text-violet-400' : 'text-slate-600'}`}
                      >
                        v{entry.version}
                      </span>
                      {entry.releaseName && (
                        <span className="text-xs italic text-violet-300/70">
                          {entry.releaseName}
                        </span>
                      )}
                      {isLatest && <LatestBadge />}
                    </div>

                    {/* Card — elevated border for major releases */}
                    <div
                      className={`rounded-2xl border p-6 backdrop-blur-sm ${
                        isMajor
                          ? 'border-violet-500/20 bg-violet-500/[0.03] shadow-[0_0_40px_-12px_rgba(139,92,246,0.15)]'
                          : 'border-white/[0.06] bg-white/[0.02]'
                      }`}
                    >
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <TagBadge tag={entry.tag} className={entry.tagColor} />
                        <h2 className="text-base font-bold text-white">
                          {entry.title}
                        </h2>
                      </div>
                      <ul className="space-y-2.5">
                        {entry.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-slate-400"
                          >
                            <span
                              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                isMajor ? 'bg-violet-400/50' : 'bg-cyan-500/50'
                              }`}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscribe nudge */}
        <div className="mt-20 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
          <p className="text-sm font-semibold text-white">Stay in the loop</p>
          <p className="mt-2 text-sm text-slate-400">
            Subscribe to release notes or follow us for product updates.
          </p>
          <a
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-400 ring-1 ring-cyan-500/20 transition hover:bg-cyan-500/20"
          >
            Get release notes →
          </a>
        </div>
      </div>
    </MarketingPageShell>
  );
}
