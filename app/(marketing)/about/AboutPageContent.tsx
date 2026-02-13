'use client';

import { useRef } from 'react';
import { ArrowRight, Users, Target, Lightbulb } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import CinematicField from '../components/motion/CinematicField';

const DemoAuditTrailCard = dynamic(() => import('@/components/marketing/demo/DemoAuditTrailCard'), { ssr: false });

function AboutHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-purple-500/5 to-transparent rounded-full" />
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1 opacity-40">
        <CinematicField />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(139, 92, 246, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8 backdrop-blur-sm"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium tracking-wide">
                About FormaOS
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Built for teams
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
                accountable to regulators
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto text-center leading-relaxed"
            >
              FormaOS exists to help regulated organizations operate with
              confidence. Compliance teams need more than spreadsheets. They
              need a defensible system that proves governance, evidence, and
              oversight.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.a
                href="/our-story"
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
              >
                <span>Read Our Story</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <motion.a
                href="/product"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-purple-400/50 hover:bg-purple-400/5 transition-all"
              >
                <span>See How It Works</span>
              </motion.a>
            </motion.div>
          </motion.div>
        </div>
      </div>

    </section>
  );
}

export default function AboutPageContent() {
  return (
    <div className="relative">
      <AboutHero />

      {/* Mission & Purpose */}
      <section className="relative py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-purple-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Mission</h2>
              <p className="text-gray-400 leading-relaxed">
                Deliver operational clarity for regulated industries by
                connecting controls, evidence, and accountability in a single
                compliance operating system.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lightbulb className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Why it matters
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Regulators expect defensible evidence, not just documentation.
                FormaOS provides the audit trail and proof required to protect
                leadership teams and their organizations.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="relative py-16 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421]">
        <div className="mx-auto max-w-xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h3 className="text-xl font-bold text-white mb-2">The Audit Trail</h3>
            <p className="text-sm text-gray-400">Every action timestamped, every decision defensible</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <DemoAuditTrailCard
              glowColor="from-purple-500/15 to-pink-500/15"
              entries={[
                { action: 'Policy approved', user: 'Sarah Chen', target: 'Data Retention Policy v2.1', time: '09:14', type: 'policy' },
                { action: 'Evidence uploaded', user: 'Marcus Rivera', target: 'SOC 2 — Access Controls', time: '08:42', type: 'evidence' },
                { action: 'Risk assessed', user: 'Emma Rodriguez', target: 'Vendor Security Review', time: '08:15', type: 'compliance' },
                { action: 'Task completed', user: 'James Wilson', target: 'Quarterly Access Review', time: '07:30', type: 'task' },
                { action: 'Control mapped', user: 'System', target: 'ISO 27001 A.9.2.3', time: '07:00', type: 'system' },
              ]}
            />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-10 shadow-2xl"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-purple-400 font-semibold mb-3">
                  Ready to talk?
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Let us show you the FormaOS command center
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  We work with regulated operators who need certainty and speed.
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}
