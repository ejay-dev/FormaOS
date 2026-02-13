'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-10 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: duration.slower }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white"
            >
              Most platforms <span className="text-gray-500">store</span> compliance.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                FormaOS operates it.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: duration.slower }}
              className="text-lg text-gray-400 max-w-2xl mx-auto"
            >
              From obligation to execution, validation, and defense. FormaOS is
              the operating system for modern compliance.
            </motion.p>
          </div>

          <div className="px-8 sm:px-12 py-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: duration.slower }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
            >
              <Link
                href="/contact"
                className="group w-full sm:w-auto relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Request a Demo</span>
              </Link>

              <Link
                href={`${appBase}/auth/signup`}
                className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-gray-300 hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: duration.slower }}
              className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500"
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                14-day free trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Full platform access
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
