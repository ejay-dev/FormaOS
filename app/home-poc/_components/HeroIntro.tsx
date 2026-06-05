'use client';

import { useRef } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Magnetic } from './Magnetic';

/**
 * Hero with a mechanical staggered entrance (on mount, so the LCP headline
 * always resolves visible) + a pointer-reactive technical HUD: a red crosshair
 * with live coordinates tracks the cursor and the exposed grid parallaxes
 * slightly. Engineered, not glowy.
 */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const pad = (n: number) => String(Math.round(n)).padStart(4, '0');

export function HeroIntro() {
  const reduce = useReducedMotion();
  const mv = reduce ? undefined : item;
  const secRef = useRef<HTMLElement>(null);
  const vRef = useRef<HTMLSpanElement>(null);
  const hRef = useRef<HTMLSpanElement>(null);
  const rRef = useRef<HTMLSpanElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (reduce || !secRef.current) return;
    const rect = secRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (vRef.current) vRef.current.style.left = `${x}px`;
    if (hRef.current) hRef.current.style.top = `${y}px`;
    if (rRef.current) {
      rRef.current.style.left = `${x}px`;
      rRef.current.style.top = `${y}px`;
      rRef.current.textContent = `X ${pad(x)}  Y ${pad(y)}`;
    }
    if (gridRef.current) {
      const dx = (x / rect.width - 0.5) * -14;
      const dy = (y / rect.height - 0.5) * -10;
      gridRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  };
  const setHud = (on: boolean) => hudRef.current?.classList.toggle('is-on', on);

  return (
    <section
      ref={secRef}
      style={{ position: 'relative', overflow: 'hidden', borderBottom: '1.5px solid var(--line-2)' }}
      onMouseMove={onMove}
      onMouseEnter={() => setHud(true)}
      onMouseLeave={() => {
        setHud(false);
        if (gridRef.current) gridRef.current.style.transform = '';
      }}
    >
      <div ref={gridRef} className="bru-cols" aria-hidden style={{ transition: 'transform 0.25s ease-out' }}>
        {Array.from({ length: 12 }).map((_, i) => <span key={i} />)}
      </div>

      {/* pointer HUD */}
      <div ref={hudRef} className="bru-hud" aria-hidden>
        <span ref={vRef} className="bru-hud-vline" />
        <span ref={hRef} className="bru-hud-hline" />
        <span ref={rRef} className="bru-hud-read">X 0000  Y 0000</span>
      </div>

      <motion.div
        className="bru-frame"
        style={{ position: 'relative', zIndex: 1, paddingTop: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)' }}
        variants={reduce ? undefined : container}
        initial={reduce ? undefined : 'hidden'}
        animate={reduce ? undefined : 'show'}
      >
        <motion.span variants={mv} className="bru-chip" style={{ display: 'inline-block', marginBottom: 'clamp(2rem, 5vw, 3.5rem)' }}>
          COMPLIANCE OS FOR NDIS · AGED CARE · HEALTHCARE
        </motion.span>

        <motion.h1 variants={mv} className="bru-display" style={{ fontSize: 'clamp(2.6rem, 11vw, 9rem)' }}>
          Audit-ready
        </motion.h1>
        <motion.h1 variants={mv} className="bru-display" style={{ fontSize: 'clamp(2.6rem, 11vw, 9rem)' }}>
          every day<span style={{ color: 'var(--red)' }}>.</span>
        </motion.h1>
        <motion.p
          variants={mv}
          className="bru-h2"
          style={{ fontSize: 'clamp(1.25rem, 2.6vw, 2.1rem)', marginTop: 'clamp(1.25rem, 2vw, 1.75rem)', fontVariationSettings: "'wght' 600, 'wdth' 105", color: 'var(--ink-dim)', textTransform: 'none', lineHeight: 1.1 }}
        >
          Not the week before the <span style={{ color: 'var(--red)' }}>Commission</span> visits.
        </motion.p>

        <div className="grid gap-x-8 gap-y-8 lg:grid-cols-12" style={{ marginTop: 'clamp(2.5rem, 4vw, 3.5rem)', alignItems: 'end' }}>
          <motion.div variants={mv} className="lg:col-span-6">
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Magnetic>
                <a href="/contact?type=compliance-plan" className="bru-btn bru-btn-red">Get Compliance Plan <span className="bru-arrow">→</span></a>
              </Magnetic>
              <Magnetic strength={0.25}>
                <a href="/contact?type=demo" className="bru-btn">Book Demo</a>
              </Magnetic>
            </div>
            <p className="bru-mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 18, letterSpacing: '0.04em' }}>
              GUIDED ASSESSMENT · AU-HOSTED BY DEFAULT · EVIDENCE-BACKED WORKFLOWS
            </p>
          </motion.div>
          <motion.div variants={mv} className="lg:col-span-5 lg:col-start-8">
            <p className="bru-deck">
              FormaOS turns NDIS Practice Standards, Aged Care Quality Standards, and the
              rest of your obligations into enforced workflows — named owners, blocked
              failure paths, and an immutable evidence trail that passes review the first time.
            </p>
          </motion.div>
        </div>

        <motion.div variants={mv} className="bru-herostats">
          {[
            ['8', 'Framework packs'],
            ['252', 'Controls mapped'],
            ['100%', 'Audit coverage'],
            ['05:30', 'UTC Rekor anchor'],
          ].map(([n, l]) => (
            <div className="bru-herostat" key={l}>
              <div className="bru-herostat-n">{n}</div>
              <div className="bru-herostat-l">{l}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
