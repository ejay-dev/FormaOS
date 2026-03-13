'use client';

import { ArrowRight, CheckCircle, Activity, UserCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const DemoComplianceChain = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceChain'),
  { ssr: false },
);

const flow = [
  { step: 'Obligations', becomes: 'structured controls' },
  { step: 'Controls', becomes: 'owned tasks' },
  { step: 'Tasks', becomes: 'live evidence' },
  { step: 'Evidence', becomes: 'complete audit trail' },
] as const;

export function ObligationToExecution() {
  return (
    <section className="relative py-16 sm:py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="fadeUp">
          <div className="text-center mb-16">
            <span className="mk-badge mk-badge--section mb-6">
              From Obligation to Execution
            </span>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
              You don&apos;t just record compliance.{' '}
              <span className="text-teal-400">You run it.</span>
            </h2>

            <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Most compliance platforms stop at documentation. FormaOS goes
              further. It operationalizes compliance across your organization.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {flow.map((item, index) => (
              <div key={item.step} className="relative">
                <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6">
                  <span className="inline-flex px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/20 text-teal-400 text-xs font-semibold mb-4">
                    {item.step}
                  </span>
                  <p className="text-slate-400">
                    become{' '}
                    <span className="text-white font-medium">
                      {item.becomes}
                    </span>
                  </p>
                </div>
                {index < flow.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp">
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-2">
              <DemoComplianceChain />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp">
          <div className="mt-12 grid sm:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-slate-900/40 p-4 text-sm text-slate-400">
              <Activity className="w-4 h-4 text-teal-400" />
              Every action is tracked
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-slate-900/40 p-4 text-sm text-slate-400">
              <UserCheck className="w-4 h-4 text-teal-400" />
              Every control has an owner
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-slate-900/40 p-4 text-sm text-slate-400">
              <CheckCircle className="w-4 h-4 text-teal-400" />
              Every outcome is provable
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
