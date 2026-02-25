'use client';

import { Layers, Building2, Database, UserCheck, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const differentiators = [
  { icon: Layers, title: 'A True Compliance Operating System', description: 'FormaOS is infrastructure, not a tool. It orchestrates governance, execution, and evidence across your organization.', color: 'from-teal-400 to-emerald-500' },
  { icon: Building2, title: 'Built for Regulated Environments', description: 'Designed specifically for healthcare, NDIS, finance, education, and government-aligned organizations.', color: 'from-emerald-500 to-teal-600' },
  { icon: Database, title: 'Evidence by Design', description: 'Every action produces verifiable, structured evidence automatically.', color: 'from-teal-600 to-emerald-600' },
  { icon: UserCheck, title: 'Accountability at Scale', description: 'Every control has a defined owner, status, and outcome. No ambiguity.', color: 'from-amber-500 to-teal-500' },
  { icon: Shield, title: 'Audit Defense, Not Audit Prep', description: 'You are always audit-ready because your compliance is continuously running.', color: 'from-rose-500 to-amber-500' },
];

export function WhatMakesDifferent() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                What Makes FormaOS Different
              </div>
            </ScrollReveal>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Not Just Another
              <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-pink-500 bg-clip-text text-transparent">
                {' '}Compliance Tool
              </span>
            </h2>
          </div>
        </ScrollReveal>

        <SectionChoreography pattern="alternating" stagger={0.04} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {differentiators.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                whileHover={{ y: -4 }}
                className={`group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer backdrop-blur-sm ${index === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.color} mb-5 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-orange-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </motion.div>
            );
          })}
        </SectionChoreography>
      </div>
    </section>
  );
}
