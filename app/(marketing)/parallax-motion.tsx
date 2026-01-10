"use client";

import { useEffect } from "react";

export function ParallaxMotion() {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const root = document.documentElement;
    let ticking = false;

    const update = () => {
      const y = window.scrollY || 0;
      const ratio = Math.min(1.6, y / 420);
      root.style.setProperty("--mk-parallax", ratio.toFixed(3));
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
