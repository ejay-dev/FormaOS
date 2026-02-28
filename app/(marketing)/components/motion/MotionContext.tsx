'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useScroll, useVelocity, MotionValue } from 'framer-motion';

interface MotionContextType {
  /** Raw scroll offset in pixels from the top of the document. */
  scrollY: MotionValue<number>;
  /** Scroll velocity (px/s). */
  velocity: MotionValue<number>;
  /**
   * Normalized global scroll progress (0 → top, 1 → bottom).
   * Use this in place of calling `useScroll()` without a target inside
   * marketing components — a single listener shared across all consumers.
   */
  scrollYProgress: MotionValue<number>;
}

const MotionContext = createContext<MotionContextType | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const { scrollY, scrollYProgress } = useScroll();
  const velocity = useVelocity(scrollY);

  return (
    <MotionContext.Provider value={{ scrollY, scrollYProgress, velocity }}>
      {children}
    </MotionContext.Provider>
  );
}

export const useGlobalMotion = () => {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error('useGlobalMotion must be used within a MotionProvider');
  }
  return context;
};
