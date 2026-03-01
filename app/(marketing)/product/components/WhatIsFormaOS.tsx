'use client';

import { Building2, FileCheck, Database, AlertTriangle, Shield, CheckCircle, Users, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

export function WhatIsFormaOS() {
  const unifies = [
    { icon: Building2, label: 'Governance structure and framework alignment' },
    { icon: FileCheck, label: 'Policy, control, and obligation execution' },
    { icon: Database, label: 'Automated evidence generation and vault' },
    { icon: AlertTriangle, label: 'Real-time risk scoring and drift detection' },
    { icon: Shield, label: 'Audit defense with exportable evidence packages' },
    { icon: Users, label: 'Control ownership across teams and entities' },
    { icon: Lock, label: 'Role-based accountability and access governance' },
  ];

  return (
    <section className="product-section product-section--core relative py-32 overflow-hidden">
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
              Not a GRC checklist tool. Not a document repository. FormaOS is an operational layer that enforces compliance as your organization works — continuously, with evidence generated automatically.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="blurIn" range={[0.05, 0.4]}>
          <div className="product-panel product-panel--strong backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/10 p-8 sm:p-12">
            <h3 className="text-xl font-semibold text-white text-center mb-8">
              FormaOS unifies:
            </h3>

            <SectionChoreography pattern="cascade" stagger={0.04} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {unifies.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="product-panel product-panel--soft flex flex-col items-center text-center group rounded-2xl px-3 py-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-teal-400" />
                    </div>
                    <span className="text-sm text-gray-400">{item.label}</span>
                  </div>
                );
              })}
            </SectionChoreography>

            <p className="text-center text-gray-500 mt-8 text-sm">
              Unified in a single, continuously operating compliance layer.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No compliance silos
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No manual evidence reconciliation
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No last-minute audit reconstruction
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No undocumented ownership gaps
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
