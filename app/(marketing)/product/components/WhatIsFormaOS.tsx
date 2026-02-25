'use client';

import { Building2, FileCheck, Database, AlertTriangle, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

export function WhatIsFormaOS() {
  const unifies = [
    { icon: Building2, label: 'Governance structure' },
    { icon: FileCheck, label: 'Policy and control execution' },
    { icon: Database, label: 'Evidence generation' },
    { icon: AlertTriangle, label: 'Risk visibility' },
    { icon: Shield, label: 'Audit defense' },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-teal-500/10 to-emerald-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="depthSlide" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="depthScale" range={[0, 0.3]}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                What Is FormaOS?
              </div>
            </ScrollReveal>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              An End-to-End
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                {' '}
                Compliance Operating System
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
              Designed for regulated teams that need certainty, accountability,
              and defensible audit outcomes.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="blurIn" range={[0.05, 0.4]}>
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12">
            <h3 className="text-xl font-semibold text-white text-center mb-8">
              FormaOS unifies:
            </h3>

            <SectionChoreography pattern="cascade" stagger={0.04} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {unifies.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex flex-col items-center text-center group">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-teal-400" />
                    </div>
                    <span className="text-sm text-gray-400">{item.label}</span>
                  </div>
                );
              })}
            </SectionChoreography>

            <p className="text-center text-gray-500 mt-8 text-sm">
              ...into a single, continuously operating system.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No silos
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No manual reconciliation
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No last-minute audit panic
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
