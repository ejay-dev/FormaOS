'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const trustWorkflow = [
  {
    step: 'Evaluate',
    detail:
      'Security and procurement teams review architecture, data handling, and governance posture before engaging further.',
    subpoints: [
      'Multi-tenant architecture with Row-Level Security - strict org boundary enforcement reviewed upfront',
      'AES-256 encryption at rest and TLS 1.3 in transit documented in review materials',
      'AU-hosted deployment by default, with additional residency requirements reviewed during procurement',
      'Security review approach, remediation process, and current assessment artifacts shared when available and appropriate',
    ],
  },
  {
    step: 'Validate',
    detail:
      'Buyer stakeholders verify control ownership, evidence traceability, and operational accountability against their internal requirements.',
    subpoints: [
      'SAML 2.0 SSO integration with Okta, Azure AD, and Google Workspace reviewed during implementation planning',
      'Role-based access control, session settings, and identity-lifecycle requirements reviewed during enterprise deployment',
      'Tamper-evident audit logs reviewed: every compliance action timestamped, immutable, and exportable',
      'DPA, vendor assurance materials, and SLA review documentation shared for legal and risk review',
    ],
  },
  {
    step: 'Accelerate',
    detail:
      'Teams move into buyer review or procurement with fewer blockers, reusable trust artifacts, and pre-answered security questionnaires.',
    subpoints: [
      'Pre-built security review packet covers common procurement and security-review topics',
      'Trust Center with public documentation: architecture overview, encryption posture, and data handling',
      'Guided implementation support available for enterprise onboarding and buyer review',
      'Framework-mapped evidence bundles and compliance posture snapshots available during evaluation',
    ],
  },
] as const;

export function TrustWorkflow() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      <ScrollReveal variant="depthScale" range={[0, 0.35]}>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-7 backdrop-blur-sm lg:p-10">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-white/25" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Trust Workflow
            </span>
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            From early evaluation through procurement
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            FormaOS trust artifacts are structured to support enterprise review
            gates at every stage of the buyer journey.
          </p>

          <SectionChoreography
            pattern="alternating"
            stagger={0.05}
            className="mt-8 grid gap-3 md:grid-cols-3"
          >
            {trustWorkflow.map((item, i) => (
              <article
                key={item.step}
                className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium tabular-nums text-slate-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {item.step}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {item.detail}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {item.subpoints.map((sp) => (
                    <li
                      key={sp}
                      className="flex items-start gap-2 text-xs leading-relaxed text-slate-400"
                    >
                      <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-white/40" />
                      <span>{sp}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </SectionChoreography>
        </div>
      </ScrollReveal>
    </section>
  );
}
