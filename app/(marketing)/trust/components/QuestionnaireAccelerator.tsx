'use client';

import Link from 'next/link';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const questionnaireFastLane = [
  {
    title: 'Security questionnaire mapping',
    detail:
      'Map common diligence questions to reusable control and evidence references so teams avoid starting from zero.',
  },
  {
    title: 'Stakeholder-specific packet paths',
    detail:
      'Provide architecture context for security, governance posture for compliance, and procurement readiness for buyer teams.',
  },
  {
    title: 'Operational proof for approval',
    detail:
      'Show live workflow ownership, evidence state, and audit timeline for board and executive confidence.',
  },
] as const;

const stakeholderTracks = [
  { persona: 'Security', artifact: 'Architecture + access control packet' },
  { persona: 'Compliance', artifact: 'Framework control + evidence mapping' },
  { persona: 'Procurement', artifact: 'Trust artifacts + implementation scope' },
] as const;

const trustSignals = [
  'Immutable audit history',
  'Framework-mapped controls',
  'Role-based access governance',
  'Evidence chain integrity',
];

export function QuestionnaireAccelerator() {
  return (
    <>
      {/* Security Questionnaire Fast-Lane */}
      <section className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <ScrollReveal variant="depthScale" range={[0, 0.35]}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-7 backdrop-blur-sm lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                  Security Questionnaire Fast-Lane
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                  Designed to reduce back-and-forth during enterprise review by
                  packaging answers around the actual buyer workflow.
                </p>
              </div>
              <Link
                href="/security-review"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Review Security Packet
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <SectionChoreography pattern="alternating" stagger={0.05} className="mt-6 grid gap-3 md:grid-cols-3">
              {questionnaireFastLane.map((item) => (
                  <article key={item.title} className="rounded-xl border border-white/[0.08] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4">
                    <p className="text-sm font-semibold text-slate-100">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {item.detail}
                    </p>
                  </article>
              ))}
            </SectionChoreography>

            <SectionChoreography pattern="alternating" stagger={0.05} className="mt-6 grid gap-3 md:grid-cols-3">
              {stakeholderTracks.map((track) => (
                  <div key={track.persona} className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                      {track.persona}
                    </p>
                    <p className="mt-1 text-sm text-cyan-100">
                      {track.artifact}
                    </p>
                  </div>
              ))}
            </SectionChoreography>
          </div>
        </ScrollReveal>
      </section>

      {/* Assurance Signals */}
      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <ScrollReveal variant="depthScale" range={[0, 0.35]}>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Assurance Signals
            </div>
            <SectionChoreography pattern="stagger-wave" stagger={0.04} className="mt-4 flex flex-wrap gap-2.5">
              {trustSignals.map((signal) => (
                  <span key={signal} className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {signal}
                  </span>
              ))}
            </SectionChoreography>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
