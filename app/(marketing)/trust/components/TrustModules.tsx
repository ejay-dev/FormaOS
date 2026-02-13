'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, FileLock2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion';
import { easing, duration } from '@/config/motion';

const navCards = [
  {
    href: '/security-review',
    icon: ShieldCheck,
    title: 'Security Review Packet',
    description:
      'Procurement-ready walkthrough covering architecture, access controls, audit logging, and evidence defensibility.',
    linkText: 'Review packet',
  },
  {
    href: '/frameworks',
    icon: FileLock2,
    title: 'Framework Coverage',
    description:
      'See mapped framework packs and how controls become executable work with contextual evidence.',
    linkText: 'View coverage',
  },
  {
    href: '/compare',
    icon: CheckCircle2,
    title: 'Compare',
    description:
      'Compare FormaOS against popular compliance tools and evaluate the execution-first difference.',
    linkText: 'See comparisons',
  },
  {
    href: '/trust/packet',
    icon: FileLock2,
    title: 'Download Trust Packet',
    description:
      'Procurement-ready vendor trust packet PDF generated from current system status and maintained trust disclosures.',
    linkText: 'Download PDF',
  },
  {
    href: '/trust/vendor-assurance',
    icon: ShieldCheck,
    title: 'Vendor Assurance',
    description:
      'Procurement-ready process overview for independent assessment artifacts and contract-accurate assurance wording.',
    linkText: 'View process',
  },
] as const;

const assuranceModules = [
  {
    title: 'Live compliance posture',
    detail:
      'Share framework-level posture snapshots with auditors and enterprise buyers.',
  },
  {
    title: 'Security questionnaire acceleration',
    detail:
      'Respond to due-diligence requests using reusable control-and-evidence mappings.',
  },
  {
    title: 'Controlled document access',
    detail:
      'Grant time-bound access to policies, controls, and certification artifacts.',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: duration.normal,
      ease: easing.signature,
    },
  }),
};

export function TrustModules() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
      {/* Trust center navigation cards */}
      <Reveal variant="fadeInUp">
        <div className="grid gap-4 lg:grid-cols-4">
          {navCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.href}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                whileHover={{ y: -6 }}
                transition={{ duration: duration.fast, ease: easing.signature }}
              >
                <Link
                  href={card.href}
                  className="group flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">
                    {card.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {card.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                    {card.linkText}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </Reveal>

      {/* Assurance module cards */}
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {assuranceModules.map((mod, i) => (
          <motion.article
            key={mod.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardVariants}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm"
          >
            <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
              <FileLock2 className="h-5 w-5 text-cyan-300" />
            </div>
            <h2 className="text-lg font-semibold text-white">{mod.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {mod.detail}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
