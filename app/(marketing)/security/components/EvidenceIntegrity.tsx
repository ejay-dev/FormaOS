'use client';

import {
  Clock,
  User,
  Link2,
  Archive,
  FileCheck,
  CheckCircle,
} from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const DemoAuditTrailCard = dynamic(
  () => import('@/components/marketing/demo/DemoAuditTrailCard'),
  { ssr: false }
);

const evidenceProperties = [
  {
    number: '01',
    icon: Clock,
    title: 'Time-Stamped',
    description:
      'Every piece of evidence is time-stamped to show when it was created or updated.',
    detail: 'Immutable temporal records',
  },
  {
    number: '02',
    icon: User,
    title: 'User-Attributed',
    description:
      'Complete attribution chain from creation through every modification. Know exactly who did what.',
    detail: 'Full accountability trail',
  },
  {
    number: '03',
    icon: Link2,
    title: 'Control-Linked',
    description:
      'Evidence can be linked to specific controls and requirements to maintain compliance context.',
    detail: 'Compliance mapping context',
  },
  {
    number: '04',
    icon: Archive,
    title: 'Audit-Preserved',
    description:
      'Evidence updates are logged with a full audit trail for complete traceability.',
    detail: 'Audit history',
  },
];

function TimelineNode({
  property,
  index,
  total,
}: {
  property: (typeof evidenceProperties)[number];
  index: number;
  total: number;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: '-10% 0px -10% 0px' });

  return (
    <div ref={nodeRef} className="relative flex flex-col items-center">
      {/* Connector line (not on last) */}
      {index < total - 1 && (
        <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-px">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-orange-500/40 to-amber-500/40 origin-left"
          />
        </div>
      )}

      {/* Node dot */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 border-2 border-orange-500/50 flex items-center justify-center mb-4 z-10"
      >
        <property.icon className="h-5 w-5 text-orange-400" />
      </motion.div>

      {/* Detail card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, delay: 0.15 + index * 0.1 }}
        className="text-center max-w-[180px]"
      >
        <span className="text-xs font-bold text-orange-400/60 tracking-widest">
          {property.number}
        </span>
        <h4 className="text-sm font-bold text-white mt-1">{property.title}</h4>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          {property.detail}
        </p>
      </motion.div>
    </div>
  );
}

export function EvidenceIntegrity() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Progress bar that fills as the section scrolls
  const progressWidth = useTransform(scrollYProgress, [0.1, 0.6], ['0%', '100%']);
  const progressOpacity = useTransform(scrollYProgress, [0.05, 0.15, 0.7, 0.85], [0, 1, 1, 0]);

  return (
    <section ref={sectionRef} className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1/3 h-1/3 rounded-full bg-gradient-to-br from-orange-500/15 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal variant="blurIn" range={[0, 0.35]} className="text-center mb-20">
          <div>
            <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs font-semibold uppercase tracking-wider mb-6">
                <FileCheck className="h-3 w-3 text-orange-400" />
                <span className="text-gray-300">Evidence Integrity</span>
              </div>
            </ScrollReveal>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Evidence that auditors</span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                can actually trust.
              </span>
            </h2>

            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              In governance, the quality of evidence determines the quality of
              decisions. FormaOS ensures every piece of evidence maintains its
              integrity from creation through audit.
            </p>
          </div>
        </ScrollReveal>

        {/* Scroll-driven progress bar */}
        {!prefersReducedMotion && (
          <motion.div
            style={{ opacity: progressOpacity }}
            className="mb-12"
          >
            <div className="relative h-1 rounded-full bg-white/[0.06] overflow-hidden max-w-3xl mx-auto">
              <motion.div
                style={{ width: progressWidth }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400"
              />
            </div>
          </motion.div>
        )}

        {/* Horizontal Timeline — nodes reveal on intersection */}
        {!prefersReducedMotion && (
          <div className="hidden md:grid grid-cols-4 gap-4 mb-16">
            {evidenceProperties.map((property, index) => (
              <TimelineNode
                key={property.title}
                property={property}
                index={index}
                total={evidenceProperties.length}
              />
            ))}
          </div>
        )}

        {/* Evidence Properties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {evidenceProperties.map((property, index) => (
            <ScrollReveal
              key={property.title}
              variant="scaleUp"
              range={[index * 0.04, 0.3 + index * 0.04]}
            >
              <div className="group relative backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-orange-500/30 transition-all duration-500">
                {/* Number indicator */}
                <div className="absolute top-6 right-6">
                  <span className="text-5xl font-bold text-white/[0.06] group-hover:text-orange-500/20 transition-colors duration-300">
                    {property.number}
                  </span>
                </div>

                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <property.icon className="h-7 w-7 text-orange-400" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {property.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed mb-3">
                      {property.description}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                      <CheckCircle className="h-3 w-3 text-orange-400" />
                      <span className="text-xs font-medium text-orange-300">
                        {property.detail}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Live audit trail demo */}
        <ScrollReveal variant="fadeUp" range={[0.04, 0.35]} className="mt-12 max-w-xl mx-auto">
          <DemoAuditTrailCard glowColor="from-orange-500/15 to-amber-500/15" />
        </ScrollReveal>

        {/* Quality Metrics */}
        <ScrollReveal variant="fadeUp" range={[0.06, 0.38]} className="mt-16">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] rounded-3xl border border-white/10 p-8 lg:p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { value: 'Full', label: 'Evidence Traceability' },
                { value: 'Enforced', label: 'Data Integrity Controls' },
                { value: 'Real-time', label: 'Activity Monitoring' },
                { value: 'Complete', label: 'Audit Coverage' },
              ].map((metric, index) => (
                <ScrollReveal
                  key={metric.label}
                  variant="scaleUp"
                  range={[index * 0.04, 0.3 + index * 0.04]}
                >
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-2">
                      {metric.value}
                    </div>
                    <div className="text-sm text-gray-500">{metric.label}</div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
