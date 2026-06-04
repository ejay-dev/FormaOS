'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';

/**
 * Hero with a mechanical, staggered entrance that plays ON MOUNT (not on
 * scroll) so the LCP headline always resolves visible. Each line rises and
 * un-blurs in sequence; the red period punches in last.
 */

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroIntro() {
  const reduce = useReducedMotion();
  const mv = reduce ? undefined : item;

  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1.5px solid var(--line-2)' }}>
      <div className="bru-cols" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => <span key={i} />)}
      </div>
      <motion.div
        className="bru-frame"
        style={{ position: 'relative', paddingTop: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(2.5rem, 5vw, 4rem)' }}
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
              <a href="/contact?type=compliance-plan" className="bru-btn bru-btn-red">Get Compliance Plan <span className="bru-arrow">→</span></a>
              <a href="/contact?type=demo" className="bru-btn">Book Demo</a>
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
