'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function FinalCTA() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp">
          <div className="rounded-3xl border border-white/[0.08] bg-slate-900/60 overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 sm:px-8 lg:px-12 py-8 sm:py-10 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
                Most platforms <span className="text-slate-500">store</span>{' '}
                compliance.
                <br />
                <span className="text-teal-400">FormaOS operates it.</span>
              </h2>

              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                From obligation to execution, validation, and defense. FormaOS
                is the operating system for modern compliance.
              </p>
            </div>

            <div className="px-5 sm:px-8 lg:px-12 py-8 sm:py-10 text-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <Link
                  href="/contact"
                  className="mk-btn mk-btn-primary group w-full sm:w-auto px-8 py-4 text-base"
                >
                  <span className="relative z-10">Request a Demo</span>
                </Link>

                <Link
                  href={`${appBase}/auth/signup`}
                  className="mk-btn mk-btn-secondary group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-base"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                  Full platform access
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
