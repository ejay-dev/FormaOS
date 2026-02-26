'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { LaserFlow } from '@/components/motion/LaserFlow';

/**
 * LaserFlowSection — premium section divider between hero and content.
 *
 * - Fixed height (360–480px desktop, 280px mobile)
 * - Fades out as user scrolls past
 * - Behind content, no blocking clicks
 * - Single instance only
 */
export function LaserFlowSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Fade in as it enters viewport, fade out as it exits
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        height: 'clamp(280px, 40vh, 480px)',
        background: '#030712',
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={prefersReduced ? undefined : { opacity }}
      >
        <LaserFlow
          color="#8B5CF6"
          horizontalBeamOffset={0.1}
          verticalBeamOffset={0.0}
          flowSpeed={0.3}
          verticalSizing={2.2}
          horizontalSizing={0.6}
          fogIntensity={0.4}
          fogScale={0.28}
          wispDensity={0.8}
          wispSpeed={12}
          wispIntensity={6}
          flowStrength={0.3}
          decay={1.1}
          falloffStart={1.2}
          fogFallSpeed={0.5}
        />
      </motion.div>

      {/* Top edge fade from hero */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #030712, transparent)' }}
      />
      {/* Bottom edge fade into next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #030712, transparent)' }}
      />
    </section>
  );
}
