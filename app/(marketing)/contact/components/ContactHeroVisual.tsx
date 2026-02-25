'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

/**
 * ContactHeroVisual — "Communication Portal"
 * ───────────────────────────────────────────
 * Large glass form panel with 3 fake input fields (staggered glow),
 * a shimmer submit button, and 3 orbiting "sent message" glass cards.
 * Cursor tilts the form panel; orbiting cards parallax at different rates.
 * Desktop-only, pointer-events-none.
 */

const INPUT_FIELDS = [
  { label: 'Name', labelWidth: 'w-10', delay: 0 },
  { label: 'Email', labelWidth: 'w-12', delay: 0.3 },
  { label: 'Message', labelWidth: 'w-16', delay: 0.6 },
] as const;

const ORBIT_CARDS = [
  { z: -30, speed: 8, startAngle: 0, radius: 190 },
  { z: -50, speed: 12, startAngle: 120, radius: 210 },
  { z: -70, speed: 16, startAngle: 240, radius: 230 },
] as const;

function ContactHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const cursor = useCursorPosition();

  // Cursor-driven tilt for the form panel (+-4deg)
  const rotateY = useTransform(cursor.mouseX, [0, 1], [-4, 4]);
  const rotateX = useTransform(cursor.mouseY, [0, 1], [4, -4]);

  // Static layout for reduced motion
  if (shouldReduceMotion) {
    return (
      <div className="hidden lg:flex items-center justify-center pointer-events-none w-[420px] h-[400px]">
        <div
          className="rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 flex flex-col"
          style={{ width: 320, height: 380 }}
        >
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {INPUT_FIELDS.map((field) => (
              <div key={field.label} className="space-y-2">
                <div className={`${field.labelWidth} h-2 bg-white/15 rounded`} />
                <div className="w-full h-10 rounded-lg border border-white/[0.10]" />
              </div>
            ))}
          </div>
          <div className="w-full h-10 bg-blue-500/30 rounded-lg mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[420px] h-[400px]">
      <motion.div
        className="relative"
        style={{
          width: 420,
          height: 400,
          perspective: 900,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Orbiting "sent message" cards behind the form */}
        {ORBIT_CARDS.map((orb, i) => {
          // Parallax for each orbiting card based on Z depth
          const orbParallaxX = useTransform(cursor.mouseX, [0, 1], [orb.z * 0.12, -orb.z * 0.12]);
          const orbParallaxY = useTransform(cursor.mouseY, [0, 1], [orb.z * 0.08, -orb.z * 0.08]);

          return (
            <motion.div
              key={i}
              className="absolute rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center gap-1.5 px-2"
              style={{
                width: 80,
                height: 50,
                top: '50%',
                left: '50%',
                marginTop: -25,
                marginLeft: -40,
                translateZ: orb.z,
                translateX: cursor.isActive ? orbParallaxX : 0,
                translateY: cursor.isActive ? orbParallaxY : 0,
                transformStyle: 'preserve-3d',
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: [0.6, 0.8, 0.6],
                x: [
                  Math.cos((orb.startAngle * Math.PI) / 180) * orb.radius,
                  Math.cos(((orb.startAngle + 120) * Math.PI) / 180) * orb.radius,
                  Math.cos(((orb.startAngle + 240) * Math.PI) / 180) * orb.radius,
                  Math.cos((orb.startAngle * Math.PI) / 180) * orb.radius,
                ],
                y: [
                  Math.sin((orb.startAngle * Math.PI) / 180) * (orb.radius * 0.4),
                  Math.sin(((orb.startAngle + 120) * Math.PI) / 180) * (orb.radius * 0.4),
                  Math.sin(((orb.startAngle + 240) * Math.PI) / 180) * (orb.radius * 0.4),
                  Math.sin((orb.startAngle * Math.PI) / 180) * (orb.radius * 0.4),
                ],
                scale: 1,
              }}
              transition={{
                duration: orb.speed,
                repeat: Infinity,
                ease: 'linear',
                delay: 1.2 + i * 0.2,
                scale: { duration: 0.6, delay: 1.2 + i * 0.2 },
              }}
            >
              {/* Check icon */}
              <svg
                className="w-3.5 h-3.5 text-emerald-400/70 shrink-0"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8.5l3.5 3.5 6.5-8" />
              </svg>
              <span className="text-[10px] text-white/50 font-medium">Sent</span>
            </motion.div>
          );
        })}

        {/* Main form panel */}
        <motion.div
          className="absolute top-1/2 left-1/2 rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 flex flex-col"
          style={{
            width: 320,
            height: 380,
            marginTop: -190,
            marginLeft: -160,
            rotateX: cursor.isActive ? rotateX : 0,
            rotateY: cursor.isActive ? rotateY : 0,
            translateZ: 10,
            transformStyle: 'preserve-3d',
          }}
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{
            duration: 0.8,
            delay: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* Input fields */}
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {INPUT_FIELDS.map((field, i) => (
              <div key={field.label} className="space-y-2">
                {/* Label placeholder */}
                <div className={`${field.labelWidth} h-2 bg-white/15 rounded`} />

                {/* Input outline with staggered glowing box-shadow */}
                <motion.div
                  className="w-full h-10 rounded-lg border border-white/[0.10]"
                  animate={{
                    boxShadow: [
                      '0 0 0px rgba(59,130,246,0)',
                      '0 0 12px rgba(59,130,246,0.18)',
                      '0 0 0px rgba(59,130,246,0)',
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 0.8 + field.delay,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Submit button with shimmer sweep */}
          <div className="relative w-full h-10 bg-blue-500/30 rounded-lg overflow-hidden mt-4">
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              }}
              animate={{ x: [-300, 300] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatDelay: 0.8,
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export const ContactHeroVisual = memo(ContactHeroVisualInner);
export default ContactHeroVisual;
