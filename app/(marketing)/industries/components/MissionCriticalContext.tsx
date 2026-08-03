'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const consequences = [
  {
    label: 'Regulatory fines, enforcement action, and legal liability',
    color: 'bg-slate-400',
  },
  {
    label:
      'Licence suspension, registration cancellation, or accreditation loss',
    color: 'bg-slate-400',
  },
  {
    label: 'Criminal liability for executives and board members',
    color: 'bg-slate-400',
  },
  {
    label: 'Service suspension affecting vulnerable participants',
    color: 'bg-slate-400',
  },
  {
    label: 'Reputational damage with media coverage and public disclosure',
    color: 'bg-slate-400',
  },
  {
    label: 'Contract termination with government and enterprise buyers',
    color: 'bg-slate-400',
  },
];

export function MissionCriticalContext() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="depthScale" range={[0, 0.35]}>
          <div className="mb-14 flex items-start gap-5">
            <span className="mt-1.5 hidden h-14 w-px flex-shrink-0 bg-gradient-to-b from-white/35 to-transparent sm:block" />
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Built for environments where{' '}
                <span className="text-slate-400">
                  accountability is non-negotiable
                </span>
              </h2>
            </div>
          </div>
        </ScrollReveal>

        {/* Mission Critical Card */}
        <ScrollReveal variant="depthSlide" range={[0.04, 0.38]}>
          <div className="bg-white/[0.03] rounded-3xl border border-white/[0.08] p-8 sm:p-12">
            <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
              When compliance failures have serious consequences
            </h3>
            <p className="text-sm text-slate-500 text-center mb-8 max-w-2xl mx-auto">
              In regulated industries, the cost of a compliance failure is not a
              fine. It is a shutdown. FormaOS is built for organisations that
              cannot afford to treat governance as optional.
            </p>

            <SectionChoreography
              pattern="center-burst"
              stagger={0.06}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {consequences.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div
                    className={`flex-shrink-0 w-2.5 h-2.5 ${item.color} rounded-full mt-1.5`}
                  />
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">
                    {item.label}
                  </p>
                </div>
              ))}
            </SectionChoreography>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default MissionCriticalContext;
