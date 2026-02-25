'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

/**
 * ContactHeroVisual
 * ─────────────────
 * Unique visual for the Contact page hero:
 * - Stylized glass form mockup with 3 fake input fields
 * - Input outlines pulse with staggered blue glow
 * - Fake submit button with shimmer gradient sweep
 * - Blur-to-clear + scale entrance animation
 * - Gentle Y-axis float oscillation
 *
 * Rendered in the midground DepthLayer of ImmersiveHero.
 * Desktop-only (hidden on mobile for performance).
 */

const INPUT_FIELDS = [
  { labelWidth: 'w-16', delay: 0 },
  { labelWidth: 'w-12', delay: 0.3 },
  { labelWidth: 'w-20', delay: 0.6 },
];

function ContactHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Glass form mockup — desktop only */}
      <div className="hidden lg:block relative w-[600px] h-[600px] xl:w-[700px] xl:h-[700px]">
        {/* Float wrapper */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={sa ? { y: [0, -8, 0] } : undefined}
          transition={sa ? {
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          } : undefined}
        >
          {/* Form card with blur-reveal entrance */}
          <motion.div
            className="relative w-[300px] h-[350px] bg-white/[0.05] border border-white/[0.1] backdrop-blur-md rounded-2xl p-6 flex flex-col"
            initial={sa ? { opacity: 0, scale: 0.9, filter: 'blur(8px)' } : false}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={sa ? {
              duration: duration.slower,
              delay: 0.3,
              ease: signatureEase,
            } : { duration: 0 }}
          >
            {/* Input fields */}
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {INPUT_FIELDS.map((field, i) => (
                <div key={i} className="space-y-2">
                  {/* Label placeholder */}
                  <div className={`${field.labelWidth} h-2 bg-white/15 rounded`} />

                  {/* Input outline with pulsing glow */}
                  <motion.div
                    className="w-full h-10 rounded-lg border border-white/[0.1]"
                    animate={sa ? {
                      boxShadow: [
                        '0 0 0px rgba(59,130,246,0)',
                        '0 0 12px rgba(59,130,246,0.15)',
                        '0 0 0px rgba(59,130,246,0)',
                      ],
                    } : undefined}
                    transition={sa ? {
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.8 + field.delay,
                    } : undefined}
                  />
                </div>
              ))}
            </div>

            {/* Submit button with shimmer */}
            <div className="relative w-full h-10 bg-blue-500/30 rounded-lg overflow-hidden mt-4">
              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
                }}
                animate={sa ? { x: [-300, 300] } : undefined}
                transition={sa ? {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: 1,
                } : undefined}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export const ContactHeroVisual = memo(ContactHeroVisualInner);
export default ContactHeroVisual;
