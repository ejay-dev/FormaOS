'use client';

import { ArrowRight, Users, Target, Lightbulb, AlertTriangle, Building2, Shield, CheckCircle } from 'lucide-react';
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
      headline={<>Compliance infrastructure<br /><span className="bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">built for accountability</span></>}
      subheadline="FormaOS was built for regulated teams where compliance failure has real consequences — and where leadership needs more than a spreadsheet to prove they're in control."
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
            <ScrollReveal variant="depthScale" range={[0, 0.3]} className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Why FormaOS Exists
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Regulated organizations face a structural gap: governance requirements that grow faster than the tools available to meet them.
              </p>
            </ScrollReveal>

            <SectionChoreography pattern="alternating" stagger={0.06} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-purple-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Mission
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    Deliver operational clarity for regulated industries by connecting controls, evidence, and accountability in a single compliance operating system.
                  </p>
                </div>

                <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-cyan-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="h-6 w-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Why it matters
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    Regulators expect defensible evidence, not just documentation. FormaOS provides the audit trail and proof required to protect leadership teams and their organizations.
                  </p>
                </div>

                <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-amber-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    The problem we solve
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    Compliance teams are stuck managing obligations across spreadsheets, shared drives, and disconnected tools — with no single source of truth when auditors arrive.
                  </p>
                </div>

                <div className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Our commitment
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    FormaOS is built for the organizations where compliance failure has real consequences — clinical, financial, reputational. We take that accountability seriously.
                  </p>
                </div>
            </SectionChoreography>
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Who We Serve */}
      <DeferredSection minHeight={250}>
        <section className="mk-section relative">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <ScrollReveal variant="depthScale" range={[0, 0.3]} className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Who We Serve
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto text-sm">
                FormaOS is purpose-built for organizations operating in regulated environments where accountability is mandatory, not aspirational.
              </p>
            </ScrollReveal>
            <SectionChoreography pattern="cascade" stagger={0.04} className="flex flex-wrap justify-center gap-3">
              {[
                { label: 'Healthcare Providers', icon: Building2 },
                { label: 'NDIS & Aged Care Operators', icon: Users },
                { label: 'Financial Services', icon: CheckCircle },
                { label: 'Government Bodies', icon: Shield },
                { label: 'Education & Workforce', icon: CheckCircle },
                { label: 'Technology & SaaS (ISO/SOC 2)', icon: Shield },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm text-slate-300">
                  <Icon className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  {label}
                </div>
              ))}
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
                The Audit Trail Never Lies
              </h3>
              <p className="text-sm text-gray-400">
                Every action timestamped, attributed, and preserved — exactly as regulators expect
              </p>
            </ScrollReveal>
            <ScrollReveal variant="depthSlide" range={[0.04, 0.34]}>
              <DemoAuditTrailCard
                glowColor="from-purple-500/15 to-pink-500/15"
                entries={[
                  {
                    action: 'Audit packet exported',
                    user: 'Sarah Chen',
                    target: 'SOC 2 Type II — Q4 2025',
                    time: '09:47',
                    type: 'compliance',
                  },
                  {
                    action: 'Policy approved',
                    user: 'Marcus Rivera',
                    target: 'Data Retention Policy v3.0',
                    time: '09:14',
                    type: 'policy',
                  },
                  {
                    action: 'Evidence uploaded',
                    user: 'Emma Rodriguez',
                    target: 'ISO 27001 A.12.1.3 — Capacity Management',
                    time: '08:42',
                    type: 'evidence',
                  },
                  {
                    action: 'Risk assessed',
                    user: 'James Wilson',
                    target: 'Third-Party Vendor Security Review',
                    time: '08:15',
                    type: 'compliance',
                  },
                  {
                    action: 'Control verified',
                    user: 'Priya Nair',
                    target: 'HIPAA § 164.312(a)(1) — Access Control',
                    time: '07:58',
                    type: 'task',
                  },
                  {
                    action: 'Control mapped',
                    user: 'System',
                    target: 'NDIS Practice Standard 4.2 — Incident Management',
                    time: '07:30',
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
                      Ready to evaluate?
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      See the compliance operating system in action
                    </h2>
                    <p className="text-gray-400 leading-relaxed">
                      We work with regulated operators who need certainty, defensible evidence, and the operational infrastructure to prove it. Request a demo or start a trial today.
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
