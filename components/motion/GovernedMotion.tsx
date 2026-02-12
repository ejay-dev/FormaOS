'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { getMotionLayerTransition, motionBudgets } from '@/config/motion';

export function OrientationReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: motionBudgets.orientation.maxDistancePx / 2 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={getMotionLayerTransition('orientation', { delay }) as any}
    >
      {children}
    </motion.div>
  );
}

export function FeedbackScale({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1 + motionBudgets.feedback.maxScaleDelta / 2 }}
      whileTap={{ scale: 1 - motionBudgets.feedback.maxScaleDelta / 2 }}
      transition={getMotionLayerTransition('feedback') as any}
    >
      {children}
    </motion.div>
  );
}

export function DelightFloat({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [
          0,
          -(motionBudgets.delight.maxDistancePx / 2),
          0,
          motionBudgets.delight.maxDistancePx / 2,
          0,
        ],
      }}
      transition={{
        ...getMotionLayerTransition('delight'),
        repeat: Infinity,
        repeatType: 'mirror',
      } as any}
    >
      {children}
    </motion.div>
  );
}
