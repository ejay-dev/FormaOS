'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/** Filmic grain + scanlines for depth, and a red scroll-progress line.
 *  Texture, not decoration — kills the flat dead-black. */
export function Atmosphere() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <>
      <motion.div className="bru-progress" style={{ width: '100%', scaleX }} aria-hidden />
      <div className="bru-scan" aria-hidden />
      <div className="bru-grain" aria-hidden />
    </>
  );
}
