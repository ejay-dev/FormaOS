'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export function DocsCTA() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative p-10 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/30"
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Our support team is here to help. Reach out for personalized
              guidance or schedule a technical consultation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                <span>Contact Support</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <Link
                href="/faq"
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all"
              >
                <span>Browse FAQ</span>
                <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
