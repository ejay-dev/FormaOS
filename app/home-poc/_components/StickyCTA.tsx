'use client';

import { useEffect, useState } from 'react';

/** Mobile-only sticky action bar: split red/ghost, appears past the hero. */
export function StickyCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!show) return null;
  return (
    <div className="bru-sticky lg:hidden">
      <a href="#" style={{ background: 'var(--red)', color: '#fff' }}>
        Book a walkthrough →
      </a>
      <a href="#" style={{ color: 'var(--ink)', borderLeft: '1.5px solid var(--line-2)' }}>
        Assess
      </a>
    </div>
  );
}
