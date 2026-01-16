'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useScroll, useVelocity, MotionValue } from 'framer-motion';

interface MotionContextType {
  scrollY: MotionValue<number>;
  velocity: MotionValue<number>;
}

const MotionContext = createContext<MotionContextType | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);

  return (
    <MotionContext.Provider value={{ scrollY, velocity }}>
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
