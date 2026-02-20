'use client';

import { Shield, TrendingUp, Settings, FileCheck, AlertTriangle, Users } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const audiences = [
  { label: 'Compliance leaders who need certainty', icon: Shield },
  { label: 'Executives who need defensibility', icon: TrendingUp },
  { label: 'Operations teams who need clarity', icon: Settings },
  { label: 'Auditors who demand evidence', icon: FileCheck },
  { label: 'Organizations that cannot afford failure', icon: AlertTriangle },
];

export function WhoIsFor() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.35]}>
          <div className="text-center mb-12">
            <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6">
                <Users className="w-4 h-4" />
                Who FormaOS Is For
              </div>
            </ScrollReveal>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Built for Those Who
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                {' '}Can't Afford to Guess
              </span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="flex flex-wrap justify-center gap-4">
          {audiences.map((audience, index) => {
            const Icon = audience.icon;
            return (
              <ScrollReveal
                key={audience.label}
                variant="scaleUp"
                range={[index * 0.04, 0.3 + index * 0.04]}
              >
                <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/20">
                  <Icon className="w-4 h-4 text-teal-400" />
                  <span className="text-sm text-gray-300">{audience.label}</span>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
