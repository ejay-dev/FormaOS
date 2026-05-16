import {
  Shield,
  Lock,
  Database,
  Users,
  FileCheck,
  Zap,
  Globe,
  Activity,
} from 'lucide-react';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  SystemSection,
  systemPanelClass,
} from '@/components/marketing/SystemMarketingPrimitives';

/**
 * AllPlansInclude — feature foundation grid. Strips the earlier animated
 * radial blur, hover scale+glow choreography, and gradient pulse rings;
 * lifts the same IconFrame + systemPanelClass pattern the home page uses.
 */
const allPlansFeatures = [
  {
    icon: FileCheck,
    title: 'Immutable Audit Trail',
    description:
      'Every action timestamped and tamper-evident — ready for regulator review.',
  },
  {
    icon: Database,
    title: 'Evidence Vault',
    description:
      'Versioned, encrypted, and chain-of-custody documentation for every control.',
  },
  {
    icon: Shield,
    title: 'Workflow Governance',
    description:
      'Enforce how compliance work is executed and owned, not just documented.',
  },
  {
    icon: Lock,
    title: 'Role-Based Security',
    description:
      'Granular access controls by role, function, and organisational boundary.',
  },
  {
    icon: Users,
    title: 'Control Ownership',
    description:
      'Every control assigned, tracked, and accountable to a named person or team.',
  },
  {
    icon: Activity,
    title: 'Real-Time Monitoring',
    description:
      'Continuous compliance score with drift detection across all frameworks.',
  },
  {
    icon: Globe,
    title: 'Multi-Framework Support',
    description:
      'NDIS Practice Standards, NSQHS, NQF, ISO 27001, SOC 2, HIPAA, GDPR — mapped and maintained.',
  },
  {
    icon: Zap,
    title: 'Live Data Portability',
    description:
      'Upgrade, downgrade, or exit with full evidence export — no contractual lock-in.',
  },
];

export function AllPlansInclude() {
  return (
    <SystemSection variant="emerald">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <SectionEyebrow icon={Zap} tone="valid">
          Core foundation
        </SectionEyebrow>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          What every plan{' '}
          <AccentText>includes by default.</AccentText>
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Every FormaOS plan provides the foundations of a true compliance
          operating system. Tiers change scope and procurement motion, not
          regulatory defensibility.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {allPlansFeatures.map((feature) => (
          <article
            key={feature.title}
            className={`flex flex-col p-6 ${systemPanelClass}`}
          >
            <IconFrame icon={feature.icon} tone="valid" />
            <h3 className="mt-5 text-base font-semibold text-white">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {feature.description}
            </p>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/[0.07] bg-white/[0.025] px-6 py-5 text-center text-sm leading-relaxed text-slate-300">
        Every plan delivers the core compliance operating layer your team
        needs.{' '}
        <span className="font-semibold text-white">
          No tier compromises regulatory defensibility.
        </span>{' '}
        Upgrade or downgrade with full data portability, no penalty.
      </div>
    </SystemSection>
  );
}
