import { Reveal } from './_components/Reveal';
import { Ledger } from './_components/Ledger';
import { Schematic } from './_components/Schematic';
import { StickyCTA } from './_components/StickyCTA';

export const dynamic = 'force-static';

const MANIFEST = [
  {
    n: '01',
    tag: 'ENFORCE',
    title: 'Obligations get a name on them.',
    body: 'Every regulatory clause maps to a control, an owner and a due date. Nothing lives in a spreadsheet; nothing is “someone’s job, generally.”',
    panel: 'control',
  },
  {
    n: '02',
    tag: 'PROVE',
    title: 'Evidence you can’t quietly edit.',
    body: 'Each action writes an immutable, timestamped record. When the auditor says “show me,” the chain is already assembled and sealed.',
    panel: 'evidence',
  },
  {
    n: '03',
    tag: 'HOLD',
    title: 'Audit-ready is a state, not a sprint.',
    body: 'Posture is scored continuously across every framework. Gaps surface the day they open — not the week before review.',
    panel: 'audit',
  },
];

function ControlPanel() {
  return (
    <div className="bru-panel" aria-hidden>
      <div className="bru-panel-bar">
        <span>CONTROLS / ACCESS</span>
        <span>03 ROWS</span>
      </div>
      {[
        ['AC-2', 'Account review', 'J. OKAFOR', 'met'],
        ['AC-6', 'Least privilege', 'UNASSIGNED', 'gap'],
        ['AC-17', 'Remote access', 'M. TAN', 'met'],
      ].map(([id, label, owner, st]) => (
        <div className="bru-prow" key={id}>
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: 'var(--ink-faint)', width: 38 }}>{id}</span>
            <span style={{ color: 'var(--ink)' }}>{label}</span>
          </span>
          <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: 'var(--ink-dim)', fontSize: 11 }}>{owner}</span>
            <span className={`bru-chip ${st === 'met' ? 'bru-chip-met' : 'bru-chip-gap'}`}>
              {st === 'met' ? 'MET' : 'GAP'}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function EvidencePanel() {
  return (
    <div className="bru-panel" aria-hidden>
      <div className="bru-panel-bar">
        <span>EVIDENCE CHAIN #4821</span>
        <span style={{ color: 'var(--ok)' }}>SEALED</span>
      </div>
      {[
        ['10:04:21', 'policy.ack', 'a3f9…21'],
        ['10:05:02', 'control.eval', 'b7c1…04'],
        ['10:05:40', 'evidence.attach', 'e2d8…9f'],
        ['10:06:08', 'owner.sign', 'c019…7a'],
      ].map(([t, ev, hash]) => (
        <div className="bru-prow" key={hash}>
          <span style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: 'var(--ink-faint)' }}>{t}</span>
            <span style={{ color: 'var(--ink)' }}>{ev}</span>
          </span>
          <span style={{ color: 'var(--ink-dim)' }}>{hash}</span>
        </div>
      ))}
    </div>
  );
}

function AuditPanel() {
  const steps = [
    ['GAP', 'gap'],
    ['FIX', 'mid'],
    ['REVIEW', 'mid'],
    ['MET', 'met'],
  ] as const;
  return (
    <div className="bru-panel" aria-hidden>
      <div className="bru-panel-bar">
        <span>CONTROL LIFECYCLE</span>
        <span>AC-2</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', padding: '26px 16px' }}>
        {steps.map(([label, st], i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  background: st === 'met' ? 'var(--ok)' : st === 'gap' ? 'var(--red)' : 'transparent',
                  border: `1.5px solid ${st === 'met' ? 'var(--ok)' : st === 'gap' ? 'var(--red)' : 'var(--line-2)'}`,
                }}
              />
              <span className="bru-mono" style={{ fontSize: 10, color: 'var(--ink-dim)' }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <span style={{ flex: 1, height: 1.5, background: 'var(--line-2)', marginBottom: 20 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Panel({ kind }: { kind: string }) {
  if (kind === 'control') return <ControlPanel />;
  if (kind === 'evidence') return <EvidencePanel />;
  return <AuditPanel />;
}

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
            <div className="bru-mh-cell hidden lg:flex">ADELAIDE · 34.92°S</div>
            <div style={{ flex: 1 }} className="bru-mh-cell" />
            <nav className="bru-mh-cell hidden lg:flex" style={{ gap: 20 }}>
              {['PLATFORM', 'FRAMEWORKS', 'PRICING'].map((l) => (
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

      {/* ========== HERO / COVER ========== */}
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1.5px solid var(--line-2)' }}>
        <div className="bru-cols" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => <span key={i} />)}
        </div>
        <div className="bru-frame" style={{ position: 'relative', paddingTop: 'clamp(2.5rem, 5vw, 4.5rem)', paddingBottom: 'clamp(2rem, 4vw, 3.5rem)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 'clamp(2rem, 5vw, 4rem)' }}>
            <span className="bru-kicker">№01 — <b>THE THESIS</b></span>
            <span className="bru-kicker hidden sm:inline">ISSUE 2026 / VOL.1</span>
          </div>

          <Reveal>
            <h1 className="bru-display" style={{ fontSize: 'clamp(2.4rem, 11vw, 9rem)' }}>
              Compliance
            </h1>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="bru-display" style={{ fontSize: 'clamp(2.4rem, 11vw, 9rem)' }}>
              you can
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <h1 className="bru-display" style={{ fontSize: 'clamp(2.4rem, 11vw, 9rem)', color: 'var(--red)' }}>
              prove<span style={{ color: 'var(--ink)' }}>.</span>
            </h1>
          </Reveal>

          {/* asymmetric foot: deck pinned right, CTA left */}
          <div className="grid gap-x-8 gap-y-8 lg:grid-cols-12" style={{ marginTop: 'clamp(2.5rem, 5vw, 4rem)', alignItems: 'end' }}>
            <div className="lg:col-span-5">
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <a href="#" className="bru-btn bru-btn-red">Book a walkthrough <span className="bru-arrow">→</span></a>
                <a href="#" className="bru-btn">Run the assessment</a>
              </div>
              <p className="bru-mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 18, letterSpacing: '0.04em' }}>
                AU-HOSTED BY DEFAULT · NO CREDIT CARD · EVIDENCE-BACKED
              </p>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <p className="bru-deck">
                FormaOS turns regulatory obligations into enforced workflows — named
                owners, immutable evidence, and audit-ready assurance in one graph.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== LEDGER ========== */}
      <section className="bru-frame" style={{ paddingBlock: 'clamp(3.5rem, 7vw, 6rem)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
          <span className="bru-kicker">№02 — <b>THE READOUT</b></span>
          <span className="bru-kicker hidden sm:inline">/ LIVE POSTURE</span>
        </div>
        <Reveal>
          <Ledger />
        </Reveal>
      </section>

      <hr className="bru-rule-strong" />

      {/* ========== SCHEMATIC ========== */}
      <section className="bru-frame" style={{ paddingBlock: 'clamp(3.5rem, 7vw, 6rem)' }}>
        <div className="grid gap-x-10 gap-y-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <span className="bru-kicker">№03 — <b>THE MODEL</b></span>
            <h2 className="bru-h2" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', marginTop: 18 }}>
              One graph.<br />Every<br />framework.
            </h2>
            <p className="bru-body" style={{ marginTop: 20, maxWidth: '34ch' }}>
              Most tools store compliance as documents. FormaOS stores it as a wired
              graph — obligations into controls, controls into owners and evidence.
              Satisfy one control and every framework that depends on it updates at once.
            </p>
            <p className="bru-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 22, letterSpacing: '0.06em' }}>
              FIG.01 — THE COMPLIANCE GRAPH
            </p>
          </div>
          <div className="lg:col-span-8">
            <Reveal>
              <Schematic />
            </Reveal>
          </div>
        </div>
      </section>

      <hr className="bru-rule-strong" />

      {/* ========== MANIFESTO ========== */}
      <section>
        {MANIFEST.map((m, i) => {
          const flip = i % 2 === 1;
          return (
            <div key={m.n}>
              <div className="bru-frame" style={{ paddingBlock: 'clamp(3rem, 6vw, 5rem)' }}>
                <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12 lg:items-center">
                  {/* text block */}
                  <div className="lg:col-span-6" style={{ order: flip ? 2 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(1rem, 3vw, 2.5rem)' }}>
                      <span className={`bru-index ${i === 1 ? 'bru-index-red' : ''}`}>{m.n}</span>
                      <div style={{ paddingTop: 8 }}>
                        <span className="bru-kicker"><b>{m.tag}</b></span>
                        <Reveal>
                          <h3 className="bru-h2" style={{ fontSize: 'clamp(1.8rem, 3.4vw, 3rem)', marginTop: 12 }}>
                            {m.title}
                          </h3>
                        </Reveal>
                        <p className="bru-body" style={{ marginTop: 16, maxWidth: '38ch' }}>{m.body}</p>
                      </div>
                    </div>
                  </div>
                  {/* panel */}
                  <Reveal className="lg:col-span-5" style={{ order: flip ? 1 : 2, gridColumn: flip ? undefined : 'span 5' }}>
                    <div className={flip ? 'lg:col-start-1' : 'lg:col-start-8'}>
                      <Panel kind={m.panel} />
                    </div>
                  </Reveal>
                </div>
              </div>
              {i < MANIFEST.length - 1 && <hr className="bru-rule" />}
            </div>
          );
        })}
      </section>

      {/* ========== RED STATEMENT BAND ========== */}
      <section className="bru-band">
        <div className="bru-frame" style={{ paddingBlock: 'clamp(3.5rem, 8vw, 7rem)' }}>
          <span className="bru-mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>
            №04 — THE POINT
          </span>
          <h2 className="bru-display" style={{ fontSize: 'clamp(3rem, 11vw, 9rem)', marginTop: 18 }}>
            Proof,<br />not promises.
          </h2>
        </div>
      </section>

      {/* ========== CTA + COLOPHON ========== */}
      <section className="bru-frame" style={{ paddingBlock: 'clamp(3.5rem, 7vw, 6rem)' }}>
        <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.6rem)' }}>
              See your own<br />frameworks mapped.
            </h2>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 28 }}>
              <a href="#" className="bru-btn bru-btn-red">Book a 30-min walkthrough <span className="bru-arrow">→</span></a>
              <a href="#" className="bru-btn">Run the assessment</a>
            </div>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <div style={{ border: '1px solid var(--line-2)' }}>
              {[
                ['HOSTING', 'Australia (Sydney region)'],
                ['HQ', 'Adelaide, South Australia'],
                ['FRAMEWORKS', 'ISO · SOC 2 · NDIS · HIPAA · GDPR'],
                ['CONTACT', 'support@formaos.com.au'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 14px', borderBottom: '1px solid var(--line)' }}>
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
