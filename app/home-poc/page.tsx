import { Reveal } from './_components/Reveal';
import { PostureRing } from './_components/PostureRing';
import { ComplianceGraph } from './_components/ComplianceGraph';
import { StickyCTA } from './_components/StickyCTA';

export const dynamic = 'force-static';

const FRAMEWORKS = ['SOC 2', 'ISO 27001', 'HIPAA', 'GDPR', 'NDIS', 'PCI-DSS'];

const FEATURES = [
  {
    n: '01',
    kicker: 'Enforce',
    title: 'Obligations become workflows with a name on them.',
    body: 'Every regulatory clause maps to a control, an owner, and a due date. Nothing lives in a spreadsheet; nothing is “someone’s job in general.”',
    vignette: 'control',
  },
  {
    n: '02',
    kicker: 'Prove',
    title: 'Evidence captured as a chain you can’t quietly edit.',
    body: 'Each action writes an immutable, timestamped record. When an auditor asks “show me,” the answer is already assembled.',
    vignette: 'evidence',
  },
  {
    n: '03',
    kicker: 'Stay ready',
    title: 'Audit-ready is a state you hold, not a sprint you survive.',
    body: 'Posture is scored continuously across every framework. You watch gaps close in real time instead of discovering them the week before review.',
    vignette: 'audit',
  },
];

function ControlVignette() {
  return (
    <div className="poc-card" aria-hidden>
      <div className="poc-card-head">
        <span className="poc-mono" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--grey)' }}>
          CONTROLS · ACCESS MANAGEMENT
        </span>
        <span className="poc-card-dot" />
      </div>
      {[
        ['AC-2 Account review', 'J. Okafor', 'met'],
        ['AC-6 Least privilege', 'Unassigned', 'gap'],
        ['AC-17 Remote access', 'M. Tan', 'met'],
      ].map(([label, owner, state]) => (
        <div className="poc-vrow" key={label}>
          <div>
            <div style={{ fontSize: 13.5, color: 'var(--ink)', fontWeight: 500 }}>{label}</div>
            <div className="poc-mono" style={{ fontSize: 11, color: 'var(--grey)', marginTop: 2 }}>
              {owner}
            </div>
          </div>
          <span className={`poc-chip ${state === 'met' ? 'poc-chip-met' : 'poc-chip-gap'}`}>
            {state === 'met' ? 'MET' : 'GAP'}
          </span>
        </div>
      ))}
    </div>
  );
}

function EvidenceVignette() {
  return (
    <div className="poc-card" aria-hidden>
      <div className="poc-card-head">
        <span className="poc-mono" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--grey)' }}>
          EVIDENCE CHAIN · #4821
        </span>
        <span className="poc-chip poc-chip-met">SEALED</span>
      </div>
      {[
        ['10:04', 'Policy acknowledged', 'a3f9…21'],
        ['10:05', 'Control evaluated', 'b7c1…04'],
        ['10:05', 'Evidence attached', 'e2d8…9f'],
        ['10:06', 'Owner signed off', 'c019…7a'],
      ].map(([t, label, hash]) => (
        <div className="poc-vrow" key={hash}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="poc-mono" style={{ fontSize: 11, color: 'var(--grey-mute)' }}>{t}</span>
            <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>{label}</span>
          </div>
          <span className="poc-mono" style={{ fontSize: 11, color: 'var(--grey)' }}>{hash}</span>
        </div>
      ))}
    </div>
  );
}

function AuditVignette() {
  const steps = [
    ['Gap', 'gap'],
    ['Remediating', 'mid'],
    ['Reviewed', 'mid'],
    ['Met', 'met'],
  ] as const;
  return (
    <div className="poc-card" aria-hidden style={{ padding: '1.2rem 1.1rem' }}>
      <span className="poc-mono" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--grey)' }}>
        CONTROL LIFECYCLE
      </span>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 22, marginBottom: 8 }}>
        {steps.map(([label, state], i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background:
                    state === 'met' ? 'var(--signal)' : state === 'gap' ? 'var(--accent)' : 'var(--paper)',
                  border: `1.5px solid ${state === 'met' ? 'var(--signal)' : state === 'gap' ? 'var(--accent)' : 'var(--hair-strong)'}`,
                }}
              />
              <span className="poc-mono" style={{ fontSize: 10, color: 'var(--grey)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span style={{ flex: 1, height: 1.5, background: 'var(--hair-strong)', margin: '0 6px', marginBottom: 22 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Vignette({ kind }: { kind: string }) {
  if (kind === 'control') return <ControlVignette />;
  if (kind === 'evidence') return <EvidenceVignette />;
  return <AuditVignette />;
}

export default function HomePocPage() {
  return (
    <main id="main-content">
      {/* ---------- Header ---------- */}
      <header className="poc-header">
        <div className="poc-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          <span className="poc-wordmark">FORMAOS</span>
          <nav className="hidden items-center gap-8 lg:flex">
            {['Platform', 'Frameworks', 'Industries', 'Pricing'].map((l) => (
              <a key={l} href="#" className="poc-nav-link">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="#" className="poc-nav-link hidden sm:inline">Sign in</a>
            <a href="#" className="poc-btn poc-btn-primary" style={{ padding: '0.6rem 1rem' }}>
              Book a walkthrough
            </a>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="poc-grid-bg" />
        <div className="poc-wrap" style={{ position: 'relative', paddingTop: 'clamp(3.5rem, 7vw, 6.5rem)', paddingBottom: 'clamp(3rem, 6vw, 5.5rem)' }}>
          <div className="grid items-center gap-x-12 gap-y-12 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left: editorial statement */}
            <div>
              <Reveal>
                <p className="poc-eyebrow">Compliance Operating System · Adelaide, AU</p>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="poc-display" style={{ marginTop: 22 }}>
                  Compliance<br />you can <em className="poc-mark">actually</em><br />prove.
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="poc-lede" style={{ marginTop: 26 }}>
                  FormaOS turns regulatory obligations into enforced workflows — named owners,
                  immutable evidence, and audit-ready assurance in one graph.
                </p>
              </Reveal>
              <Reveal delay={0.24}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 34 }}>
                  <a href="#" className="poc-btn poc-btn-primary">
                    Book a walkthrough
                    <span className="poc-arrow">→</span>
                  </a>
                  <a href="#" className="poc-textlink">Take the 2-minute assessment</a>
                </div>
              </Reveal>
              <Reveal delay={0.32}>
                <p className="poc-mono" style={{ fontSize: 11.5, color: 'var(--grey-mute)', marginTop: 26, letterSpacing: '0.04em' }}>
                  AU-HOSTED BY DEFAULT · EVIDENCE-BACKED · NO CREDIT CARD
                </p>
              </Reveal>
            </div>

            {/* Right: posture vignette */}
            <Reveal delay={0.2}>
              <div className="poc-card" style={{ padding: '1.4rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span className="poc-mono" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--grey)' }}>
                    POSTURE · ALL FRAMEWORKS
                  </span>
                  <span className="poc-chip poc-chip-met">LIVE</span>
                </div>
                <PostureRing target={98} />
                <div style={{ marginTop: 22, borderTop: '1px solid var(--hair)', paddingTop: 4 }}>
                  {[
                    ['ISO 27001', '100%'],
                    ['SOC 2 Type II', '97%'],
                    ['NDIS Practice', '96%'],
                  ].map(([f, v]) => (
                    <div className="poc-vrow" key={f} style={{ paddingInline: 0 }}>
                      <span style={{ fontSize: 13.5, color: 'var(--ink)' }}>{f}</span>
                      <span className="poc-mono" style={{ fontSize: 13, color: 'var(--signal)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <hr className="poc-rule" />
      <section className="poc-wrap" style={{ paddingBlock: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="poc-eyebrow" style={{ flexShrink: 0 }}>Mapped to the frameworks you answer to</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {FRAMEWORKS.map((f) => (
              <span key={f} className="poc-serif" style={{ fontSize: 20, color: 'var(--ink-soft)', letterSpacing: '0.01em' }}>
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>
      <hr className="poc-rule" />

      {/* ---------- Signature: the graph ---------- */}
      <section className="poc-wrap" style={{ paddingBlock: 'clamp(4rem, 8vw, 7rem)' }}>
        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Reveal>
              <p className="poc-eyebrow">The model</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="poc-h2" style={{ marginTop: 18 }}>
                One graph.<br />Every framework.
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="poc-body" style={{ marginTop: 22, maxWidth: '38ch' }}>
                Most tools store compliance as documents. FormaOS stores it as a living graph —
                obligations wired to controls, controls to owners, owners to evidence. Satisfy one
                control and every framework that depends on it updates at once.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <ComplianceGraph />
          </Reveal>
        </div>
      </section>
      <hr className="poc-rule" />

      {/* ---------- Feature rows (desktop) ---------- */}
      <section className="hidden lg:block">
        {FEATURES.map((f, i) => {
          const flip = i % 2 === 1;
          return (
            <div key={f.n}>
              <div className="poc-wrap" style={{ paddingBlock: 'clamp(3.5rem, 6vw, 5.5rem)' }}>
                <div className="grid items-center gap-x-16 lg:grid-cols-2">
                  <div style={{ order: flip ? 2 : 1 }}>
                    <Reveal>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                        <span className="poc-index"><sup>{f.n}</sup></span>
                        <span className="poc-eyebrow">{f.kicker}</span>
                      </div>
                    </Reveal>
                    <Reveal delay={0.08}>
                      <h3 className="poc-h2" style={{ marginTop: 16, fontSize: 'clamp(1.7rem, 2.4vw, 2.5rem)' }}>
                        {f.title}
                      </h3>
                    </Reveal>
                    <Reveal delay={0.16}>
                      <p className="poc-body" style={{ marginTop: 20, maxWidth: '42ch' }}>{f.body}</p>
                    </Reveal>
                  </div>
                  <Reveal delay={0.12} className="self-center" style={{ order: flip ? 1 : 2 }}>
                    <Vignette kind={f.vignette} />
                  </Reveal>
                </div>
              </div>
              {i < FEATURES.length - 1 && <hr className="poc-rule" />}
            </div>
          );
        })}
      </section>

      {/* ---------- Feature carousel (mobile) ---------- */}
      <section className="lg:hidden" style={{ paddingBlock: '3rem' }}>
        <div className="poc-wrap" style={{ marginBottom: 22 }}>
          <p className="poc-eyebrow">How it works</p>
          <h2 className="poc-h2" style={{ marginTop: 14 }}>Enforce. Prove.<br />Stay ready.</h2>
        </div>
        <div className="poc-carousel">
          {FEATURES.map((f) => (
            <div className="poc-slide" key={f.n}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
                <span className="poc-index" style={{ fontSize: 40 }}><sup>{f.n}</sup></span>
                <span className="poc-eyebrow">{f.kicker}</span>
              </div>
              <h3 className="poc-serif" style={{ fontWeight: 300, fontSize: 22, lineHeight: 1.1, marginBottom: 16, color: 'var(--ink)' }}>
                {f.title}
              </h3>
              <Vignette kind={f.vignette} />
            </div>
          ))}
        </div>
      </section>
      <hr className="poc-rule" />

      {/* ---------- Outcome band ---------- */}
      <section className="poc-wrap" style={{ paddingBlock: 'clamp(4rem, 7vw, 6rem)' }}>
        <Reveal>
          <p className="poc-eyebrow" style={{ marginBottom: 38 }}>What changes</p>
        </Reveal>
        <div className="grid gap-x-12 gap-y-12 sm:grid-cols-3">
          {[
            ['Every control', 'has one named, accountable owner.'],
            ['Every action', 'writes evidence you can’t silently edit.'],
            ['Every framework', 'scored live — no pre-audit scramble.'],
          ].map(([big, sub], i) => (
            <Reveal key={big} delay={i * 0.1}>
              <div>
                <p className="poc-stat">{big}</p>
                <p className="poc-body" style={{ marginTop: 14, maxWidth: '24ch' }}>{sub}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- Dark close ---------- */}
      <section className="poc-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="poc-wrap" style={{ paddingBlock: 'clamp(4.5rem, 8vw, 7rem)' }}>
          <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
            <Reveal>
              <h2 className="poc-display" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.4rem)' }}>
                Stop assembling<br /><em>proof</em>. Start <em>holding</em> it.
              </h2>
            </Reveal>
            <Reveal delay={0.12}>
              <div>
                <p style={{ color: 'var(--grey-mute)', fontSize: '1.05rem', lineHeight: 1.55, marginBottom: 26 }}>
                  See your own frameworks mapped in a 30-minute walkthrough. AU-hosted, evidence-backed,
                  built in Adelaide.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  <a href="#" className="poc-btn" style={{ background: 'var(--paper-pure)', color: 'var(--ink)', border: '1px solid var(--paper-pure)' }}>
                    Book a walkthrough <span className="poc-arrow">→</span>
                  </a>
                  <a href="#" className="poc-btn poc-btn-ghost" style={{ color: 'var(--paper)', borderColor: 'rgba(246,244,239,0.3)' }}>
                    Take the assessment
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="poc-wrap" style={{ paddingBlock: '3rem' }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="poc-wordmark">FORMAOS</span>
          <p className="poc-mono" style={{ fontSize: 11, color: 'var(--grey-mute)', letterSpacing: '0.04em' }}>
            COMPLIANCE OPERATING SYSTEM · ADELAIDE, SOUTH AUSTRALIA
          </p>
        </div>
      </footer>

      <StickyCTA />
      {/* spacer so the sticky bar never covers the footer on mobile */}
      <div className="lg:hidden" style={{ height: 72 }} />
    </main>
  );
}
