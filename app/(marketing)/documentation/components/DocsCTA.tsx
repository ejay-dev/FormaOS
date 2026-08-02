'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

export function DocsCTA() {
  const shouldReduceMotion = useReducedMotion();
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <section className="relative py-24 ">
      <div className="relative max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="relative p-10 rounded-3xl bg-white/[0.03] border border-white/5 shadow-2xl shadow-black/30">
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Can&apos;t find what you&apos;re looking for?
              </h2>
              <p className="text-slate-400 mb-8 max-w-xl mx-auto">
                Send the question through and you will get a direct answer. If a
                document is missing, that is worth knowing too.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.a
                  href="/contact"
                  onClick={() =>
                    trackCtaClick({
                      surface: 'docs',
                      section: 'docs_cta',
                      location: 'docs_primary',
                      ctaLabel: 'Contact Support',
                      ctaHref: '/contact',
                      variant: 'primary',
                    })
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  className="mk-btn mk-btn-primary group px-8 py-4 text-lg"
                >
                  <span>Contact us</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.a>

                <Link
                  href="/faq"
                  onClick={() =>
                    trackCtaClick({
                      surface: 'docs',
                      section: 'docs_cta',
                      location: 'docs_secondary',
                      ctaLabel: 'Browse FAQ',
                      ctaHref: '/faq',
                      variant: 'secondary',
                    })
                  }
                  className="mk-btn mk-btn-secondary group px-8 py-4 text-lg"
                >
                  <span>Browse FAQ</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
