'use client';

import { useEffect, useState } from 'react';

/**
 * Mobile-only sticky CTA bar. Appears after the hero scrolls away so the
 * primary action is always one tap from anywhere on the page.
 */
export function StickyCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 620);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="poc-sticky-cta lg:hidden">
      <div>
        <div className="poc-mono" style={{ fontSize: 11, color: 'var(--grey)', letterSpacing: '0.04em' }}>
          FORMAOS
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
          Prove compliance, faster.
        </div>
      </div>
      <a href="#" className="poc-btn poc-btn-primary" style={{ padding: '0.7rem 1.1rem' }}>
        Book a walkthrough
      </a>
    </div>
  );
}
