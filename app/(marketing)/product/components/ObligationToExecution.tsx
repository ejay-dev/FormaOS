'use client';

import { ArrowRight, CheckCircle, Activity, UserCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const DemoComplianceChain = dynamic(() => import('@/components/marketing/demo/DemoComplianceChain'), { ssr: false });

const flow = [
  { step: 'Obligations', becomes: 'structured controls', color: 'from-teal-400 to-emerald-500' },
  { step: 'Controls', becomes: 'owned tasks', color: 'from-emerald-500 to-teal-600' },
  { step: 'Tasks', becomes: 'live evidence', color: 'from-teal-600 to-emerald-600' },
  { step: 'Evidence', becomes: 'complete audit trail', color: 'from-amber-500 to-teal-500' },
];

export function ObligationToExecution() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                From Obligation to Execution
              </div>
            </ScrollReveal>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              You Don't Just Record
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                {' '}
                Compliance. You Run It.
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Most compliance platforms stop at documentation. FormaOS goes
              further. It operationalizes compliance across your organization.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flow.map((item, index) => (
            <ScrollReveal
              key={item.step}
              variant="fadeUp"
              range={[index * 0.04, 0.3 + index * 0.04]}
            >
              <div className="relative group">
                <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-teal-500/30 transition-all">
                  <div className={`inline-flex px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white text-xs font-semibold mb-4`}>
                    {item.step}
                  </div>
                  <p className="text-gray-400">
                    become{' '}
                    <span className="text-white font-medium">{item.becomes}</span>
                  </p>
                </div>
                {index < flow.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal variant="fadeUp" range={[0.1, 0.4]}>
          <div className="mt-12 max-w-2xl mx-auto">
            <DemoComplianceChain glowColor="from-purple-500/15 to-pink-500/15" />
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" range={[0.12, 0.42]}>
          <div className="mt-12 grid sm:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Activity className="w-4 h-4 text-teal-400" />
              Every action is tracked
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Every control has an owner
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Every outcome is provable
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
