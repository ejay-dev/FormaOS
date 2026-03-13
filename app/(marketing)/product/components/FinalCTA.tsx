'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-4xl px-6 lg:px-12">
        <ScrollReveal variant="fadeUp">
          <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 px-8 py-12 sm:px-12 text-center">

            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-500/70 mb-5">
              Get started
            </p>

            <h2 className="text-3xl font-semibold leading-[1.12] tracking-[-0.02em] text-white mb-4 sm:text-4xl">
              Most platforms{' '}
              <span className="text-slate-500">store</span> compliance.
              <br />
              <span className="text-teal-400">FormaOS operates it.</span>
            </h2>

            <p className="text-base leading-[1.75] text-slate-400 max-w-xl mx-auto mb-10">
              From obligation to execution, validation, and audit defense.
              Start your trial and see the difference in the first week.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`${appBase}/auth/signup?plan=pro`}
                className="mk-btn mk-btn-primary group min-h-[50px] w-full sm:w-auto px-8 py-3.5 text-[0.9375rem] font-semibold justify-center"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </a>
              <Link
                href="/contact"
                className="mk-btn mk-btn-secondary min-h-[50px] w-full sm:w-auto px-8 py-3.5 text-[0.9375rem] justify-center"
              >
                Request a Demo
              </Link>
            </div>

            <p className="mt-6 text-xs text-slate-600">
              14-day free trial · No credit card required · Full platform access
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
