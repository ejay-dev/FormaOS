'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';

const CAPABILITIES = [
  {
    area: 'Control Enforcement',
    statement:
      'Compliance is a behavior, not a document. FormaOS enforces controls at the point of work — before non-compliant actions proceed.',
    items: [
      'Controls block non-compliant actions before they happen',
      'Automated task generation from control obligations',
      'Named ownership on every control with escalation rules',
      'Immutable execution logs on every compliance action',
    ],
  },
  {
    area: 'Evidence Architecture',
    statement:
      'Evidence is generated automatically as your team operates. No manual collection. No reconstruction before audits.',
    items: [
      'Evidence produced at point of task execution',
      'Full chain-of-custody: actor, timestamp, approval, control',
      'Tamper-evident audit log for every compliance event',
      'Framework-mapped evidence bundles exportable in minutes',
    ],
  },
  {
    area: 'Framework Intelligence',
    statement:
      'Seven pre-built framework packs. Cross-framework control mapping. Continuous gap detection across all of them simultaneously.',
    items: [
      'ISO 27001, SOC 2, GDPR, HIPAA, NDIS, PCI-DSS, Essential Eight',
      'Cross-framework control mapping and overlap detection',
      'Real-time compliance scoring per framework',
      'Automated gap analysis — before auditors find them',
    ],
  },
  {
    area: 'Scale & Governance',
    statement:
      'Multi-entity architecture built for complex organizations. One executive view across all entities, sites, and frameworks.',
    items: [
      'Multi-entity management with separate control and evidence domains',
      'Executive dashboard with org-wide compliance posture',
      'Role-based access with least-privilege enforcement',
      'REST API + webhook integration with existing tooling',
    ],
  },
] as const;

export function CapabilitiesGrid() {
  return (
    <section className="mk-section home-section relative">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">

        {/* Section label */}
        <ScrollReveal variant="fadeUp">
          <div className="mb-14 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-4">
              Platform capabilities
            </p>
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white">
              Four capability domains.
              <br />
              <span className="text-slate-400">One operating system.</span>
            </h2>
          </div>
        </ScrollReveal>

        {/* Capability areas — vertical stack */}
        <div className="space-y-2">
          {CAPABILITIES.map((cap, i) => (
            <ScrollReveal key={cap.area} variant="fadeUp">
              <div className="group grid md:grid-cols-[1fr_1.5fr] gap-0 overflow-hidden rounded-2xl border border-white/[0.07] hover:border-white/[0.1] transition-colors duration-300">

                {/* Left — area name + statement */}
                <div className="bg-slate-900/60 px-7 py-7 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-teal-500/70 mb-3">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h3 className="text-lg font-semibold tracking-tight text-white mb-3">
                      {cap.area}
                    </h3>
                    <p className="text-sm leading-[1.7] text-slate-400">
                      {cap.statement}
                    </p>
                  </div>
                </div>

                {/* Right — supporting items */}
                <div className="bg-slate-900/30 border-l border-white/[0.05] px-7 py-7">
                  <ul className="space-y-3">
                    {cap.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm text-slate-400 leading-[1.6]"
                      >
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-teal-500/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
