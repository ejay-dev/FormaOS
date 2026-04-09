'use client';

import Link from 'next/link';
import {
  Shield,
  Heart,
  DollarSign,
  GraduationCap,
  HardHat,
} from 'lucide-react';

const industries = [
  {
    slug: 'ndis-providers',
    name: 'NDIS Providers',
    description: 'Practice Standards, worker screening, SIRS notifications',
    icon: Shield,
  },
  {
    slug: 'healthcare-compliance',
    name: 'Healthcare',
    description: 'AHPRA tracking, NSQHS accreditation, clinical governance',
    icon: Heart,
  },
  {
    slug: 'financial-services-compliance',
    name: 'Financial Services',
    description: 'ASIC obligations, AUSTRAC AML/CTF, breach registers',
    icon: DollarSign,
  },
  {
    slug: 'childcare-compliance',
    name: 'Childcare',
    description: 'NQF quality areas, educator credentials, QIP builder',
    icon: GraduationCap,
  },
  {
    slug: 'construction-compliance',
    name: 'Construction',
    description: 'WHS compliance, SWMS registers, contractor inductions',
    icon: HardHat,
  },
];

interface RelatedIndustriesProps {
  currentSlug: string;
}

export function RelatedIndustries({ currentSlug }: RelatedIndustriesProps) {
  const related = industries.filter((i) => i.slug !== currentSlug);

  return (
    <section className="mt-20 mb-12 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Also see FormaOS for
        </h2>
        <p className="text-slate-400 text-center mb-8">
          Pre-built compliance frameworks for every regulated Australian
          industry
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {related.map((industry) => {
            const Icon = industry.icon;
            return (
              <Link
                key={industry.slug}
                href={`/${industry.slug}`}
                className="group rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-cyan-500/30 hover:bg-white/10"
              >
                <Icon className="h-6 w-6 text-cyan-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                  {industry.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {industry.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
