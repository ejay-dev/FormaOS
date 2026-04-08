'use client';

import Link from 'next/link';
import {
  FileText,
  ArrowRight,
  ShieldCheck,
  Users,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  HeartPulse,
  Baby,
  Landmark,
  Home,
} from 'lucide-react';
import { useAppStore } from '@/lib/stores/app';
import type { LucideIcon } from 'lucide-react';

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  href: string;
}

const NDIS_REPORTS: ReportTemplate[] = [
  {
    id: 'ndis-practice-standards',
    title: 'Practice Standards Posture',
    description:
      'Evidence mapping across all NDIS Practice Standards with gap identification',
    icon: ShieldCheck,
    color: 'from-pink-500/20 to-pink-500/5 border-pink-400/20',
    href: '/api/reports/export?type=ndis-practice-standards&format=pdf&mode=sync',
  },
  {
    id: 'ndis-worker-screening',
    title: 'Worker Screening Report',
    description:
      'Staff clearance status, expiry tracking, and non-compliant worker summary',
    icon: Users,
    color: 'from-rose-500/20 to-rose-500/5 border-rose-400/20',
    href: '/api/reports/export?type=ndis-worker-screening&format=pdf&mode=sync',
  },
  {
    id: 'ndis-sirs',
    title: 'SIRS Incident Summary',
    description:
      'Reportable incidents, notification timelines, and NDIS Commission compliance',
    icon: AlertTriangle,
    color: 'from-amber-500/20 to-amber-500/5 border-amber-400/20',
    href: '/api/reports/export?type=ndis-sirs&format=pdf&mode=sync',
  },
];

const HEALTHCARE_REPORTS: ReportTemplate[] = [
  {
    id: 'healthcare-nsqhs',
    title: 'NSQHS Standards Report',
    description:
      'National Safety and Quality Health Service Standards compliance posture',
    icon: HeartPulse,
    color: 'from-sky-500/20 to-sky-500/5 border-sky-400/20',
    href: '/api/reports/export?type=nsqhs&format=pdf&mode=sync',
  },
  {
    id: 'healthcare-practitioner',
    title: 'Practitioner Credentials',
    description:
      'AHPRA registration, CPD hours, and professional indemnity expiry tracker',
    icon: Users,
    color: 'from-teal-500/20 to-teal-500/5 border-teal-400/20',
    href: '/api/reports/export?type=practitioner-credentials&format=pdf&mode=sync',
  },
  {
    id: 'healthcare-clinical-incidents',
    title: 'Clinical Incident Tracker',
    description:
      'Open/closed incidents with severity breakdown and regulator notification status',
    icon: AlertTriangle,
    color: 'from-rose-500/20 to-rose-500/5 border-rose-400/20',
    href: '/api/reports/export?type=clinical-incidents&format=pdf&mode=sync',
  },
];

const AGED_CARE_REPORTS: ReportTemplate[] = [
  {
    id: 'aged-care-acqs',
    title: 'Aged Care Quality Standards',
    description:
      'ACQS compliance status with evidence mapping and star rating indicators',
    icon: Home,
    color: 'from-violet-500/20 to-violet-500/5 border-violet-400/20',
    href: '/api/reports/export?type=acqs&format=pdf&mode=sync',
  },
  {
    id: 'aged-care-care-plans',
    title: 'Care Plan Compliance',
    description:
      'Plan review timeliness, overdue reviews, and resident care coverage',
    icon: ClipboardList,
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/20',
    href: '/api/reports/export?type=care-plan-compliance&format=pdf&mode=sync',
  },
  {
    id: 'aged-care-star-rating',
    title: 'Star Rating Readiness',
    description:
      'Estimated quality rating breakdown with improvement recommendations',
    icon: BarChart3,
    color: 'from-amber-500/20 to-amber-500/5 border-amber-400/20',
    href: '/api/reports/export?type=star-rating&format=pdf&mode=sync',
  },
];

const CHILDCARE_REPORTS: ReportTemplate[] = [
  {
    id: 'childcare-nqf',
    title: 'NQF Quality Areas',
    description:
      'National Quality Framework compliance across all 7 quality areas',
    icon: Baby,
    color: 'from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-400/20',
    href: '/api/reports/export?type=nqf&format=pdf&mode=sync',
  },
  {
    id: 'childcare-educator',
    title: 'Educator Credentials',
    description:
      'WWC checks, first aid, qualifications status, and renewal timeline',
    icon: Users,
    color: 'from-orange-500/20 to-orange-500/5 border-orange-400/20',
    href: '/api/reports/export?type=educator-credentials&format=pdf&mode=sync',
  },
  {
    id: 'childcare-safety',
    title: 'Child Safety Report',
    description:
      'Incident log, mandatory reporting compliance, and safety audit history',
    icon: ShieldCheck,
    color: 'from-rose-500/20 to-rose-500/5 border-rose-400/20',
    href: '/api/reports/export?type=child-safety&format=pdf&mode=sync',
  },
];

const FINANCIAL_REPORTS: ReportTemplate[] = [
  {
    id: 'financial-breach-register',
    title: 'Breach Register Report',
    description:
      'Open breaches, self-reported incidents, and ASIC/APRA notification log',
    icon: AlertTriangle,
    color: 'from-red-500/20 to-red-500/5 border-red-400/20',
    href: '/api/reports/export?type=breach-register&format=pdf&mode=sync',
  },
  {
    id: 'financial-board-report',
    title: 'Board Compliance Pack',
    description:
      'Executive summary for board reporting with RAG status across obligations',
    icon: Landmark,
    color: 'from-indigo-500/20 to-indigo-500/5 border-indigo-400/20',
    href: '/api/reports/export?type=board-compliance&format=pdf&mode=sync',
  },
  {
    id: 'financial-aml-kyc',
    title: 'AML/KYC Status Report',
    description:
      'Anti-money laundering program compliance and customer due diligence status',
    icon: ShieldCheck,
    color: 'from-sky-500/20 to-sky-500/5 border-sky-400/20',
    href: '/api/reports/export?type=aml-kyc&format=pdf&mode=sync',
  },
];

const RAG_STATUS_REPORT: ReportTemplate = {
  id: 'rag-status-report',
  title: 'RAG Status Report',
  description:
    'Comprehensive red/amber/green status across all obligations, controls, and frameworks',
  icon: BarChart3,
  color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-400/20',
  href: '/api/reports/export?type=rag-status&format=pdf&mode=sync',
};

function getIndustryReports(industry: string | null): {
  label: string;
  templates: ReportTemplate[];
} {
  switch (industry) {
    case 'ndis':
      return { label: 'NDIS Provider', templates: NDIS_REPORTS };
    case 'healthcare':
      return { label: 'Healthcare', templates: HEALTHCARE_REPORTS };
    case 'aged_care':
      return { label: 'Aged Care', templates: AGED_CARE_REPORTS };
    case 'childcare':
      return { label: 'Childcare', templates: CHILDCARE_REPORTS };
    case 'financial_services':
      return { label: 'Financial Services', templates: FINANCIAL_REPORTS };
    default:
      return { label: '', templates: [] };
  }
}

export function IndustryReportTemplates() {
  const organization = useAppStore((state) => state.organization);
  const industry = organization?.industry ?? null;
  const { label, templates } = getIndustryReports(industry);

  return (
    <div className="space-y-6">
      {/* Industry-specific reports */}
      {templates.length > 0 && (
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-4 sm:p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2 text-violet-300">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-widest">
              {label} Reports
            </span>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className={`rounded-2xl border bg-gradient-to-br p-5 ${tmpl.color}`}
              >
                <div className="flex items-start gap-3">
                  <tmpl.icon className="mt-0.5 h-5 w-5 text-foreground/70 shrink-0" />
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      {tmpl.title}
                    </h4>
                    <p className="mt-1.5 text-xs leading-relaxed text-foreground/70">
                      {tmpl.description}
                    </p>
                  </div>
                </div>
                <Link
                  href={tmpl.href}
                  prefetch={false}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-cyan-100"
                >
                  Generate report
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Universal RAG Status Report — available to all industries */}
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-4 sm:p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2 text-emerald-300">
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Universal Reports
          </span>
        </div>
        <div
          className={`rounded-2xl border bg-gradient-to-br p-5 max-w-md ${RAG_STATUS_REPORT.color}`}
        >
          <div className="flex items-start gap-3">
            <RAG_STATUS_REPORT.icon className="mt-0.5 h-5 w-5 text-foreground/70 shrink-0" />
            <div>
              <h4 className="text-base font-bold text-foreground">
                {RAG_STATUS_REPORT.title}
              </h4>
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/70">
                {RAG_STATUS_REPORT.description}
              </p>
            </div>
          </div>
          <Link
            href={RAG_STATUS_REPORT.href}
            prefetch={false}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-cyan-100"
          >
            Generate report
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
