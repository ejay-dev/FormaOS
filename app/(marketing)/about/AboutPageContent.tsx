'use client';

import { ArrowRight, Users, Target, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import dynamic from 'next/dynamic';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { AboutHeroVisual } from './components/AboutHeroVisual';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';

const DemoAuditTrailCard = dynamic(
  () => import('@/components/marketing/demo/DemoAuditTrailCard'),
  { ssr: false },
);

function AboutHero() {
  return (
    <ImmersiveHero
      theme="about"
      visualContent={<AboutHeroVisual />}
      badge={{ icon: <Users className="w-4 h-4 text-violet-400" />, text: 'About FormaOS', colorClass: 'violet' }}
      headline={<>Built for teams<br /><span className="bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">accountable to regulators</span></>}
      subheadline="FormaOS exists to help regulated organizations operate with confidence. Compliance teams need more than spreadsheets. They need a defensible system that proves governance, evidence, and oversight."
      primaryCta={{ href: '/our-story', label: 'Read Our Story' }}
      secondaryCta={{ href: '/product', label: 'See How It Works' }}
    />
  );
}

export default function AboutPageContent() {
  return (
    <MarketingPageShell>
      <AboutHero />

      <VisualDivider gradient />

      {/* Mission & Purpose */}
      <DeferredSection minHeight={300}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <SectionChoreography pattern="alternating" stagger={0.06} className="grid gap-8 md:grid-cols-2">
                <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-purple-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Mission
                  </h2>
                  <p className="text-gray-400 leading-relaxed">
                    Deliver operational clarity for regulated industries by
                    connecting controls, evidence, and accountability in a
                    single compliance operating system.
                  </p>
                </div>

                <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-cyan-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Why it matters
                  </h2>
                  <p className="text-gray-400 leading-relaxed">
                    Regulators expect defensible evidence, not just
                    documentation. FormaOS provides the audit trail and proof
                    required to protect leadership teams and their
                    organizations.
                  </p>
                </div>
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Live Activity Feed */}
      <DeferredSection minHeight={300}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-xl px-6 lg:px-8">
            <ScrollReveal
              variant="depthScale"
              range={[0, 0.3]}
              className="text-center mb-8"
            >
              <h3 className="text-xl font-bold text-white mb-2">
                The Audit Trail
              </h3>
              <p className="text-sm text-gray-400">
                Every action timestamped, every decision defensible
              </p>
            </ScrollReveal>
            <ScrollReveal variant="depthSlide" range={[0.04, 0.34]}>
              <DemoAuditTrailCard
                glowColor="from-purple-500/15 to-pink-500/15"
                entries={[
                  {
                    action: 'Policy approved',
                    user: 'Sarah Chen',
                    target: 'Data Retention Policy v2.1',
                    time: '09:14',
                    type: 'policy',
                  },
                  {
                    action: 'Evidence uploaded',
                    user: 'Marcus Rivera',
                    target: 'SOC 2 — Access Controls',
                    time: '08:42',
                    type: 'evidence',
                  },
                  {
                    action: 'Risk assessed',
                    user: 'Emma Rodriguez',
                    target: 'Vendor Security Review',
                    time: '08:15',
                    type: 'compliance',
                  },
                  {
                    action: 'Task completed',
                    user: 'James Wilson',
                    target: 'Quarterly Access Review',
                    time: '07:30',
                    type: 'task',
                  },
                  {
                    action: 'Control mapped',
                    user: 'System',
                    target: 'ISO 27001 A.9.2.3',
                    time: '07:00',
                    type: 'system',
                  },
                ]}
              />
            </ScrollReveal>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* CTA Section */}
      <DeferredSection minHeight={250}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <ScrollReveal variant="depthSlide" range={[0, 0.3]}>
              <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-10 shadow-2xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-purple-400 font-semibold mb-3">
                      Ready to talk?
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      Let us show you the FormaOS command center
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                      We work with regulated operators who need certainty and
                      speed.
                    </p>
                  </div>
                  <motion.a
                    href="/contact"
                    whileHover={{
                      scale: 1.05,
                      boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    className="group px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all whitespace-nowrap"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
