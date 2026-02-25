'use client';

import { motion } from 'framer-motion';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { DocSectionCard, docSections } from './DocSectionCard';

export function DocsContent() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <SectionChoreography pattern="cascade" className="relative max-w-4xl mx-auto px-6 lg:px-12 space-y-6">
        {docSections.map((section, index) => (
          <DocSectionCard key={section.id} section={section} index={index} />
        ))}
      </SectionChoreography>
    </section>
  );
}
