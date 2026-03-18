'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

const ENGAGEMENT_STEPS = [
  {
    title: 'Discovery call',
    detail: 'Scope rollout goals, current stack, and audit pressure.',
    tone: 'from-blue-500/30 to-cyan-500/15',
  },
  {
    title: 'Security review',
    detail: 'Share procurement packet, controls map, and deployment model.',
    tone: 'from-cyan-500/30 to-emerald-500/15',
  },
  {
    title: 'Implementation plan',
    detail: 'Define onboarding path, evidence migration, and team readiness.',
    tone: 'from-violet-500/30 to-blue-500/15',
  },
] as const;

const HIGHLIGHTS = [
  'Response within 1 business day',
  'Security packet ready',
  'Architecture workshop available',
] as const;

function ContactHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const cursor = useCursorPosition();
  const rotateY = useTransform(cursor.mouseX, [0, 1], [-4, 4]);
  const rotateX = useTransform(cursor.mouseY, [0, 1], [4, -4]);
  const floatX = useTransform(cursor.mouseX, [0, 1], [-8, 8]);
  const floatY = useTransform(cursor.mouseY, [0, 1], [6, -6]);

  const boardStyle = shouldReduceMotion
    ? undefined
    : {
        rotateX: cursor.isActive ? rotateX : 0,
        rotateY: cursor.isActive ? rotateY : 0,
      };

  const chipStyle = shouldReduceMotion
    ? undefined
    : {
        x: cursor.isActive ? floatX : 0,
        y: cursor.isActive ? floatY : 0,
      };

  return (
    <div className="pointer-events-none hidden lg:flex h-[420px] w-[460px] items-center justify-center">
      <div className="relative h-[420px] w-[460px]">
        <motion.div
          className="absolute left-0 top-6 w-[320px] rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(10,15,28,0.94),rgba(12,20,38,0.84))] p-6 shadow-[0_28px_90px_rgba(3,7,18,0.45)] backdrop-blur-xl"
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={boardStyle}
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/70">
                Engagement Brief
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                What happens after you reach out
              </h3>
            </div>
            <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
              Live team
            </div>
          </div>

          <div className="space-y-3">
            {ENGAGEMENT_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/8 bg-white/[0.04] p-4"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${step.tone} text-sm font-semibold text-white`}
                  >
                    0{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-400/15 bg-cyan-500/10 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">
                  Procurement Pack
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  Security review materials ready on first reply
                </p>
              </div>
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute right-0 top-0 w-[186px] rounded-[24px] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={chipStyle}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-100/70">
            Response SLA
          </p>
          <p className="mt-2 text-2xl font-semibold text-white">24h</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Typical first response with next-step recommendations.
          </p>
        </motion.div>

        <motion.div
          className="absolute bottom-16 right-3 w-[210px] rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,rgba(34,211,238,0.16),rgba(15,23,42,0.72))] p-4 shadow-[0_20px_60px_rgba(8,47,73,0.35)] backdrop-blur-xl"
          initial={{ opacity: 0, x: 18, y: 12 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={chipStyle}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">
            Included Up Front
          </p>
          <div className="mt-3 space-y-2">
            {HIGHLIGHTS.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />
                <p className="text-xs leading-5 text-white/90">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export const ContactHeroVisual = memo(ContactHeroVisualInner);
export default ContactHeroVisual;
