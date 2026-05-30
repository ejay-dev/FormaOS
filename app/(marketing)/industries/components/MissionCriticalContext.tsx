'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { useDeviceTier } from '@/lib/device-tier';

const consequences = [
  { label: 'Regulatory fines, enforcement action, and legal liability', color: 'bg-slate-400' },
  { label: 'License suspension, registration cancellation, or accreditation loss', color: 'bg-slate-400' },
  { label: 'Criminal liability for executives and board members', color: 'bg-slate-400' },
  { label: 'Service suspension affecting vulnerable participants', color: 'bg-slate-400' },
  { label: 'Reputational damage with media coverage and public disclosure', color: 'bg-slate-400' },
  { label: 'Contract termination with government and enterprise buyers', color: 'bg-slate-400' },
];

export function MissionCriticalContext() {
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const allowAmbientMotion =
    !shouldReduceMotion && tierConfig.tier === 'high' && !tierConfig.isTouch;

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.04] rounded-full blur-3xl"
        animate={
          allowAmbientMotion
            ? {
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }
            : undefined
        }
        transition={
          allowAmbientMotion
            ? { duration: 15, repeat: Infinity, ease: 'easeInOut' }
            : undefined
        }
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="depthScale" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Industry Use
              </p>
            </ScrollReveal>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Built for Environments Where
              <span className="text-foreground">
                {' '}
                Accountability Is Non-Negotiable
              </span>
            </h2>
          </div>
        </ScrollReveal>

        {/* Mission Critical Card */}
        <ScrollReveal variant="depthSlide" range={[0.04, 0.38]}>
          <div
            className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/[0.08] p-8 sm:p-12"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
              When compliance failures have serious consequences
            </h3>
            <p className="text-sm text-gray-500 text-center mb-8 max-w-2xl mx-auto">
              In regulated industries, the cost of a compliance failure is not a fine - it is a shutdown. FormaOS is built for organizations that cannot afford to treat governance as optional.
            </p>

            <SectionChoreography pattern="center-burst" stagger={0.06} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {consequences.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-2.5 h-2.5 ${item.color} rounded-full mt-1.5`}
                    />
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">{item.label}</p>
                  </div>
              ))}
            </SectionChoreography>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default MissionCriticalContext;
