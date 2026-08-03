'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

export function QuestionnaireAccelerator() {
  return (
    <>
      {/* Security Questionnaire Fast-Lane */}
      <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <ScrollReveal variant="depthScale" range={[0, 0.35]}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Answering a security questionnaire
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                  Most of what a diligence questionnaire asks is already
                  written down, mapped to the control it belongs to, so the
                  back-and-forth is about your specifics rather than the basics.
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
                  <article key={item.title} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <p className="text-sm font-semibold text-slate-100">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {item.detail}
                    </p>
                  </article>
              ))}
            </SectionChoreography>

            <dl className="mt-6 grid gap-x-8 gap-y-4 border-t border-white/[0.08] pt-6 sm:grid-cols-3">
              {stakeholderTracks.map((track) => (
                <div key={track.persona}>
                  <dt className="text-sm font-semibold text-white">
                    {track.persona}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-400">
                    {track.artifact}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
