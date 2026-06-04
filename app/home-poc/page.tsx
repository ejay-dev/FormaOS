import { Reveal } from './_components/Reveal';
import { Ledger } from './_components/Ledger';
import { Schematic } from './_components/Schematic';
import { Ticker } from './_components/Ticker';
import { CountUp } from './_components/CountUp';
import { HeroIntro } from './_components/HeroIntro';
import { StickyCTA } from './_components/StickyCTA';

export const dynamic = 'force-static';

const CONVICTION = [
  {
    step: 'For operators',
    title: 'Controls run as workflows, not documents',
    body: 'Named tasks, approval gates, and evidence chains execute inside daily operations — not in a separate compliance layer.',
    cta: 'See how it works',
    href: '/product',
  },
  {
    step: 'For enterprise buyers',
    title: 'One flow from security review to rollout',
    body: 'Identity controls, audit exports, hosting posture, and procurement artifacts stay in a single narrative buyers can verify.',
    cta: 'See enterprise path',
    href: '/enterprise',
  },
  {
    step: 'For security reviewers',
    title: 'Trust evidence is visible before the first call',
    body: 'Trust documentation, evidence defensibility, and review-ready context surface early so reviewers can verify substance upfront.',
    cta: 'Visit trust center',
    href: '/trust',
  },
];

const ENGINE = [
  ['Obligation', 'Framework requirements mapped to controls'],
  ['Control', 'Ownership and review cadence assigned'],
  ['Task', 'Work routed to the accountable owner'],
  ['Evidence', 'Artifacts linked and sealed to the control'],
  ['Audit', 'Complete, exportable compliance trail'],
];

const CAPS = [
  ['Automation Engine', 'Triggers for evidence, tasks, policies, and certifications with auto-task generation and escalation.'],
  ['Evidence Vault', 'Every upload, review, and approval tracked with full audit-trail context and chain of custody.'],
  ['8 Framework Packs', 'SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, NIST CSF, CIS, NDIS Practice Standards & Essential Eight — pre-built.'],
  ['Compliance Gates', 'Block non-compliant actions before they happen with real-time validation and enforcement.'],
  ['Executive Dashboard', 'C-level visibility into posture, framework health, risk trends, and control ownership.'],
  ['Multi-Site Operations', 'Each entity keeps its own controls and evidence with cross-site rollup for executive governance.'],
  ['REST API + Webhooks', 'API v1 for compliance data, evidence uploads, and task management. Webhooks for SIEM and tooling.'],
  ['AI Compliance Assistant', 'Context-aware AI drafts policies, runs gap analysis, and gives steps — powered by your live org data.'],
];

const PILLARS = [
  {
    tag: 'Tamper-evident by construction',
    h: 'HMAC-chained rows',
    body: 'Each row carries a sequence number and an HMAC-SHA256 signature linking it to the previous row. A nightly cron re-walks the chain; any drift surfaces as a chain-integrity break before the next audit.',
  },
  {
    tag: 'Verifiable without trusting us',
    h: 'External anchor at 05:30 UTC',
    body: 'Daily, each org’s chain top is submitted to Sigstore Rekor as an RFC 6962 Merkle entry. An auditor can verify the timestamp of any event through Linux Foundation infrastructure — not ours.',
  },
  {
    tag: 'Immutable, even to platform admins',
    h: 'Append-only at the database',
    body: 'A BEFORE UPDATE OR DELETE trigger rejects any mutation of audit rows, backed by restrictive RLS deny policies. Even a service-role admin that bypasses RLS is stopped by the trigger. Enforced by Postgres, not app code.',
  },
];

const FACTS = [
  ['HMAC-SHA256', 'Row signature'],
  ['RFC 6962', 'Merkle proof'],
  ['05:30 UTC', 'Daily anchor'],
  ['Append-only', 'DB trigger + RLS'],
  ['Sigstore Rekor', 'External log'],
];

const INDUSTRIES: Array<{ name: string; tags: string[]; href: string }> = [
  { name: 'Healthcare', tags: ['HIPAA', 'RACGP', 'AHPRA', 'NSQHS'], href: '/healthcare-compliance' },
  { name: 'NDIS Providers', tags: ['Practice Standards', 'Q&S Commission'], href: '/ndis-providers' },
  { name: 'Mental Health', tags: ['NSMHS', 'Restrictive Practices'], href: '/mental-health-compliance' },
  { name: 'Financial Services', tags: ['SOC 2', 'ISO 27001', 'ASIC', 'APRA CPS 230'], href: '/financial-services-compliance' },
  { name: 'Education', tags: ['TEQSA', 'ASQA', 'RTO', 'VRQA'], href: '/industries' },
  { name: 'Government', tags: ['ISM', 'PSPF', 'Essential Eight', 'FOI'], href: '/use-cases/government-public-sector' },
];

const BA = [
  {
    impact: 'Auditor bundle, on demand',
    before: 'Evidence scattered across email threads, shared drives, and spreadsheets. Days lost reconstructing trails.',
    after: 'On-demand ZIP export: framework summary, evidence references with SHA-256 hashes, automation log, score history, chain top anchored to Sigstore Rekor.',
    tag: 'Hash-chained',
  },
  {
    impact: 'Statutory clock, automated',
    before: 'Email threads, ad-hoc severity tagging, statutory timelines tracked by memory.',
    after: 'org_incidents writes carry severity, named owner, and the NDIS SIRS 24h-immediate / 5-business-day-detailed clock encoded in the predicate.',
    tag: '24h / 5bd',
  },
  {
    impact: 'Refreshed nightly',
    before: 'Manual status reconciliation. The board gets a stale quarterly snapshot. Drift surfaces too late.',
    after: 'Nightly cron at 06:00 UTC writes org_control_evaluations; /app/compliance/health renders live posture with a 4-week sparkline.',
    tag: 'Cron-driven',
  },
];

const STATS = [
  ['8', 'Framework packs'],
  ['252', 'Controls mapped'],
  ['102', 'Auto-evaluated'],
  ['150', 'Manual attestations'],
  ['16', 'Production crons'],
];

export default function HomePocPage() {
  return (
    <main id="main-content">
      {/* ========== MASTHEAD ========== */}
      <header className="bru-masthead">
        <div className="bru-frame">
          <div className="bru-masthead-row">
            <div className="bru-mh-cell" style={{ flex: '0 0 auto' }}>
              <span className="bru-wordmark">FORMAOS</span>
            </div>
            <div className="bru-mh-cell hidden md:flex">COMPLIANCE OPERATING SYSTEM</div>
            <div className="bru-mh-cell hidden lg:flex">ADELAIDE · AU</div>
            <div style={{ flex: 1 }} className="bru-mh-cell" />
            <nav className="bru-mh-cell hidden lg:flex" style={{ gap: 20 }}>
              {['PLATFORM', 'FRAMEWORKS', 'INDUSTRIES', 'PRICING'].map((l) => (
                <a key={l} href="#" style={{ color: 'var(--ink-dim)', textDecoration: 'none' }}>{l}</a>
              ))}
            </nav>
            <div className="bru-mh-cell">
              <span className="bru-live-dot" />
              <span className="hidden sm:inline">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </header>

      {/* ========== HERO ========== */}
      <HeroIntro />

      {/* ========== TICKER ========== */}
      <Ticker />

      {/* ========== WHY BUYERS STAY ========== */}
      <section className="bru-frame bru-section">
        <div className="bru-head">
          <div>
            <span className="bru-eyebrow">Why buyers stay</span>
            <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.6rem)', marginTop: 16 }}>
              Three paths to conviction,<br />visible before the first call.
            </h2>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {CONVICTION.map((c, i) => (
            <Reveal key={c.step} delay={i * 0.08}>
              <article className="bru-card-b">
                <span className="bru-card-step">{c.step}</span>
                <h3 className="bru-card-title">{c.title}</h3>
                <p className="bru-body" style={{ marginTop: 14 }}>{c.body}</p>
                <a href={c.href} className="bru-card-link">{c.cta} <span className="bru-arrow">→</span></a>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <hr className="bru-rule-strong" />

      {/* ========== LIVE SYSTEM / LEDGER ========== */}
      <section className="bru-frame bru-section">
        <div className="bru-head">
          <div>
            <span className="bru-eyebrow">Operating system architecture</span>
            <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', marginTop: 16 }}>
              Not a repository. A live system.
            </h2>
          </div>
          <p className="bru-body hidden lg:block" style={{ maxWidth: '34ch' }}>
            Other tools store documents. FormaOS enforces the program: controls are gated,
            ownership is structural, evidence is generated as teams operate.
          </p>
        </div>
        <Ledger />
      </section>

      <hr className="bru-rule-strong" />

      {/* ========== COMPLIANCE ENGINE / SCHEMATIC ========== */}
      <section className="bru-frame bru-section">
        <div className="bru-head" style={{ alignItems: 'end' }}>
          <div className="lg:max-w-[60%]">
            <span className="bru-eyebrow">Compliance engine</span>
            <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', marginTop: 16 }}>
              One connected lifecycle.
            </h2>
          </div>
          <p className="bru-body" style={{ maxWidth: '36ch' }}>
            Obligations become controls, controls generate tasks, tasks produce evidence —
            and every step stays audit-ready.
          </p>
        </div>
        <Reveal y={0}>
          <div style={{ border: '1px solid var(--line-2)', background: 'var(--bg)', padding: 'clamp(0.5rem, 1.5vw, 1.25rem)' }}>
            <Schematic />
          </div>
        </Reveal>
        <div className="grid gap-px sm:grid-cols-5" style={{ marginTop: 28, border: '1px solid var(--line-2)', background: 'var(--line)' }}>
          {ENGINE.map(([t, d], i) => (
            <div key={t} style={{ background: 'var(--bg)', padding: '22px 18px', position: 'relative' }}>
              <div className="bru-card-title" style={{ fontSize: '1.05rem' }}>{t}</div>
              <p className="bru-body" style={{ fontSize: '0.82rem', marginTop: 12 }}>{d}</p>
              {i < ENGINE.length - 1 && <span className="bru-flow-arrow" aria-hidden>→</span>}
            </div>
          ))}
        </div>
      </section>

      <hr className="bru-rule-strong" />

      {/* ========== CAPABILITIES ========== */}
      <section className="bru-frame bru-section">
        <div className="bru-head">
          <div>
            <span className="bru-eyebrow">Platform capabilities</span>
            <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.6rem)', marginTop: 16 }}>
              Everything you need.<br />Nothing you don’t.
            </h2>
          </div>
        </div>
        <Reveal>
          <div className="bru-cap-grid">
            {CAPS.map(([t, d]) => (
              <div className="bru-cap" key={t}>
                <span className="bru-cap-tick" aria-hidden />
                <div className="bru-cap-t">{t}</div>
                <p className="bru-cap-d">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <hr className="bru-rule-strong" />

      {/* ========== CRYPTOGRAPHIC AUDIT CHAIN ========== */}
      <section className="bru-frame bru-section">
        <div className="bru-head" style={{ alignItems: 'end' }}>
          <div className="lg:max-w-[58%]">
            <span className="bru-eyebrow">Cryptographic audit chain</span>
            <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', marginTop: 16 }}>
              Verifiable, not just<br />“we have logs.”
            </h2>
          </div>
          <p className="bru-body" style={{ maxWidth: '38ch' }}>
            Every org’s audit log is hash-chained, RLS-locked against mutation, and anchored
            daily to Sigstore Rekor — the same transparency log the Linux Foundation runs for
            signed open-source releases.
          </p>
        </div>
        <Reveal>
          <div className="bru-pillars">
            {PILLARS.map((p) => (
              <div className="bru-pillar" key={p.h}>
                <span className="bru-pillar-tag">{p.tag}</span>
                <h3 className="bru-pillar-h">{p.h}</h3>
                <p className="bru-body" style={{ fontSize: '0.88rem' }}>{p.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="bru-facts">
            {FACTS.map(([k, v]) => (
              <div className="bru-fact" key={k}>
                <div className="bru-fact-k">{k}</div>
                <div className="bru-fact-v">{v}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <hr className="bru-rule-strong" />

      {/* ========== INDUSTRIES INDEX ========== */}
      <section className="bru-frame bru-section">
        <div className="bru-head">
          <div>
            <span className="bru-eyebrow">Regulated industries</span>
            <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.6rem)', marginTop: 16 }}>
              Built for high-accountability industries.
            </h2>
          </div>
        </div>
        <Reveal>
          <div>
            {INDUSTRIES.map((ind) => (
              <a key={ind.name} href={ind.href} className="bru-idx-row">
                <span className="bru-idx-name">{ind.name}</span>
                <span className="bru-idx-tags hidden md:flex">
                  {ind.tags.map((t) => (
                    <span className="bru-idx-tag" key={t}>{t}</span>
                  ))}
                </span>
                <span className="bru-idx-arrow">→</span>
              </a>
            ))}
          </div>
        </Reveal>
      </section>

      <hr className="bru-rule-strong" />

      {/* ========== OUTCOME PROOF ========== */}
      <section className="bru-frame bru-section">
        <div className="bru-head" style={{ alignItems: 'end' }}>
          <div className="lg:max-w-[58%]">
            <span className="bru-eyebrow">What ships, what runs</span>
            <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', marginTop: 16 }}>
              Operational mechanics,<br />not customer claims.
            </h2>
          </div>
          <p className="bru-body" style={{ maxWidth: '38ch' }}>
            Every number below comes from the framework registry checked into the codebase
            or the cron schedule running in production.
          </p>
        </div>

        <Reveal>
          <div style={{ marginBottom: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
            {BA.map((b) => (
              <div className="bru-ba" key={b.impact}>
                <div className="bru-ba-impact">{b.impact}</div>
                <div className="bru-ba-col">
                  <span className="bru-ba-label">Status quo</span>
                  <p className="bru-ba-before">{b.before}</p>
                </div>
                <div className="bru-ba-col">
                  <span className="bru-ba-label" style={{ color: 'var(--red)' }}>With FormaOS · {b.tag}</span>
                  <p className="bru-ba-after">{b.after}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="bru-stats">
            {STATS.map(([n, l]) => (
              <div className="bru-stat-cell" key={l}>
                <div className="bru-stat-n"><CountUp value={Number(n)} /></div>
                <div className="bru-stat-l">{l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ========== RED STATEMENT BAND ========== */}
      <section className="bru-band">
        <div className="bru-frame" style={{ paddingBlock: 'clamp(4rem, 8vw, 7rem)' }}>
          <h2 className="bru-display" style={{ fontSize: 'clamp(2.4rem, 8vw, 6.5rem)' }}>
            Stop preparing<br />for audits.
          </h2>
          <h2 className="bru-display" style={{ fontSize: 'clamp(2.4rem, 8vw, 6.5rem)', color: 'rgba(255,255,255,0.55)' }}>
            Start being audit-ready.
          </h2>
        </div>
      </section>

      {/* ========== CTA + COLOPHON ========== */}
      <section className="bru-frame bru-section-sm">
        <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="/contact?type=compliance-plan" className="bru-btn bru-btn-red">Get Compliance Plan <span className="bru-arrow">→</span></a>
              <a href="/contact?type=demo" className="bru-btn">Book Demo</a>
            </div>
            <p className="bru-mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 18, letterSpacing: '0.04em' }}>
              GUIDED ASSESSMENT · SECURITY REVIEW PACKET · AU-HOSTED BY DEFAULT
            </p>
            <div className="grid gap-px sm:grid-cols-3" style={{ marginTop: 30, border: '1px solid var(--line-2)', background: 'var(--line)' }}>
              {[
                ['SOC 2-ALIGNED', 'Trust framework'],
                ['AU-HOSTED', 'Data sovereignty'],
                ['ENTERPRISE SSO', 'SAML 2.0 + MFA'],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg)', padding: '16px 18px' }}>
                  <div className="bru-fact-k">{k}</div>
                  <div className="bru-fact-v">{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <div style={{ border: '1px solid var(--line-2)' }}>
              {[
                ['HOSTING', 'Australia (Sydney region)'],
                ['HQ', 'Adelaide, South Australia'],
                ['FRAMEWORKS', '8 packs shipping today'],
                ['CONTACT', 'support@formaos.com.au'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 14px', borderBottom: '1px solid var(--line)' }}>
                  <span className="bru-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.08em' }}>{k}</span>
                  <span className="bru-mono" style={{ fontSize: 11.5, color: 'var(--ink-dim)', textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="bru-rule-strong" />
      <footer className="bru-frame" style={{ paddingBlock: '2.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span className="bru-wordmark">FORMAOS</span>
        <span className="bru-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
          © 2026 · COMPLIANCE OPERATING SYSTEM · ADELAIDE AU
        </span>
      </footer>

      <StickyCTA />
      <div className="lg:hidden" style={{ height: 60 }} />
    </main>
  );
}
