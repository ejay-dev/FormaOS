'use client';

import { type ReactNode, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { easing } from '@/config/motion';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * One entrance move for the whole marketing shell: the incoming page fades in.
 *
 * There is deliberately no exit phase. Wrapping this in AnimatePresence with
 * mode="wait" held the outgoing page on screen for its full exit duration
 * before the new one could mount, so every click on a static, prerendered site
 * cost a quarter of a second of nothing happening. Scale and y offset are gone
 * for the same reason restraint applies elsewhere — one move, not three.
 */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const isFirstMount = useRef(true);

  useEffect(() => {
    isFirstMount.current = false;
  }, []);

  if (shouldReduceMotion) {
    return <div key={pathname}>{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={isFirstMount.current ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.2,
        ease: easing.signature as [number, number, number, number],
      }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
