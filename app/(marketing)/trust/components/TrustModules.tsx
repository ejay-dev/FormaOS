'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, FileLock2, CheckCircle2, ArrowRight } from 'lucide-react';
import { SectionChoreography } from '@/components/motion/SectionChoreography';

const navCards = [
  {
    href: '/security-review',
    icon: ShieldCheck,
    title: 'Security Review Packet',
    description:
      'Architecture, encryption, SAML 2.0 SSO, data handling posture, and DPA details shared early in security review.',
    linkText: 'Review packet',
  },
  {
    href: '/frameworks',
    icon: FileLock2,
    title: 'Framework Coverage',
    description:
      'ISO 27001, SOC 2, HIPAA, GDPR, PCI DSS, NIST CSF, and more, mapped controls that become executable work with contextual evidence. NDIS and NSQHS framework packs in development.',
    linkText: 'View coverage',
  },
  {
    href: '/compare',
    icon: CheckCircle2,
    title: 'Compare Platforms',
    description:
      'Compare FormaOS against Ideagen CompliSpace, Riskware, 6clicks, and HealthMetrics. Evaluate the operational execution difference for AU care, healthcare, and regulated industries.',
    linkText: 'See comparisons',
  },
] as const;

// The audit-chain module that used to sit here repeated AuditChainProof
// higher up the page word for word. One explanation, one place.
const assuranceModules = [
  {
    title: 'Live compliance posture',
    detail:
      'Share real-time framework-level posture snapshots (control coverage, drift alerts, and evidence readiness) with auditors and enterprise buyers.',
  },
  {
    title: 'Security questionnaire acceleration',
    detail:
      'Respond to due-diligence requests using pre-built control-and-evidence mappings and documented answers on architecture, identity, encryption, and data handling.',
  },
  {
    title: 'Controlled document access',
    detail:
      'Grant time-bound, auditable access to policies, controls, certification artifacts, and evidence bundles, with a traceable access log for every view.',
  },
];

export function TrustModules() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      {/* Trust center navigation cards */}
      <SectionChoreography pattern="alternating" stagger={0.05} className="grid gap-4 lg:grid-cols-3">
          {navCards.map((card) => {
            const Icon = card.icon;
            return (
                <motion.div
                  key={card.href}
                  whileHover={{ y: -6 }}
                >
                  <Link
                    href={card.href}
                    className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="mb-4 inline-flex rounded-lg border border-white/[0.1] bg-white/[0.06] p-2">
                      <Icon className="h-5 w-5 text-slate-300" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">
                      {card.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {card.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                      {card.linkText}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </motion.div>
            );
          })}
      </SectionChoreography>

      <div className="mt-12 border-t border-white/[0.08] pt-8">
        <h2 className="text-lg font-semibold text-white">
          What the Trust Center supports during a review
        </h2>
        <div className="mt-5 grid gap-8 md:grid-cols-3">
          {assuranceModules.map((mod) => (
            <div key={mod.title}>
              <h3 className="text-sm font-semibold text-slate-100">
                {mod.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {mod.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
