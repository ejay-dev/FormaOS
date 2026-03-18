import {
  Building2,
  Stethoscope,
  Baby,
  HeartHandshake,
  CheckCircle2,
  Users,
  Landmark,
  Laptop,
  Briefcase,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { applyIndustryPack } from '@/app/app/actions/onboarding';

interface IndustryCard {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
}

const INDUSTRY_CARDS: IndustryCard[] = [
  {
    id: 'ndis',
    name: 'NDIS Provider',
    description:
      'Compliance framework for National Disability Insurance Scheme providers.',
    icon: Building2,
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-300',
  },
  {
    id: 'healthcare',
    name: 'GP / Medical',
    description: 'RACGP Standards for general practices and medical centers.',
    icon: Stethoscope,
    bgColor: 'bg-sky-500/10',
    textColor: 'text-sky-300',
  },
  {
    id: 'childcare',
    name: 'Childcare',
    description:
      'National Quality Framework (NQF) for early childhood education.',
    icon: Baby,
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-300',
  },
  {
    id: 'aged_care',
    name: 'Aged Care',
    description: 'Aged Care Quality Standards for residential facilities.',
    icon: HeartHandshake,
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-300',
  },
  {
    id: 'community_services',
    name: 'Community Services',
    description:
      'Compliance for community service organizations and NGOs.',
    icon: Users,
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-300',
  },
  {
    id: 'financial_services',
    name: 'Financial Services',
    description:
      'Regulatory compliance for financial services providers.',
    icon: Landmark,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-300',
  },
  {
    id: 'saas_technology',
    name: 'SaaS / Technology',
    description:
      'SOC 2, ISO 27001, and GDPR controls for tech companies.',
    icon: Laptop,
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-300',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description:
      'Multi-framework compliance for large enterprises.',
    icon: Briefcase,
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-300',
  },
  {
    id: 'other',
    name: 'Other',
    description: 'General compliance framework for regulated services.',
    icon: HelpCircle,
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-300',
  },
];

export function IndustrySelector() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      data-testid="industry-pack-selector"
    >
      {INDUSTRY_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 shadow-sm transition-all hover:border-white/10 hover:shadow-md"
          >
            <div>
              <div
                className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${card.bgColor} ${card.textColor}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-100">{card.name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {card.description}
              </p>
            </div>
            <form
              action={async () => {
                'use server';
                await applyIndustryPack(card.id);
              }}
            >
              <button
                type="submit"
                data-testid={`apply-pack-${card.id}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-3 text-xs font-bold text-slate-100 transition-colors hover:bg-white/10"
              >
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
                APPLY PACK
              </button>
            </form>
          </div>
        );
      })}
    </div>
  );
}
