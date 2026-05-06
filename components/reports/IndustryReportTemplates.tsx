'use client';

import {
  FileText,
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
  reportType: 'soc2' | 'iso27001' | 'ndis' | 'hipaa' | 'trust';
}

const NDIS_REPORTS: ReportTemplate[] = [
  {
    id: 'ndis-practice-standards',
    title: 'Practice Standards Posture',
    description:
      'Evidence mapping across all NDIS Practice Standards with gap identification',
    icon: ShieldCheck,
    color: 'from-pink-500/20 to-pink-500/5 border-pink-400/20',
    reportType: 'ndis',
  },
  {
    id: 'ndis-worker-screening',
    title: 'Worker Screening Report',
    description:
      'Staff clearance status, expiry tracking, and non-compliant worker summary',
    icon: Users,
    color: 'from-rose-500/20 to-rose-500/5 border-rose-400/20',
    reportType: 'ndis',
  },
  {
    id: 'ndis-sirs',
    title: 'SIRS Incident Summary',
    description:
      'Reportable incidents, notification timelines, and NDIS Commission compliance',
    icon: AlertTriangle,
    color: 'from-amber-500/20 to-amber-500/5 border-amber-400/20',
    reportType: 'ndis',
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
    reportType: 'hipaa',
  },
  {
    id: 'healthcare-practitioner',
    title: 'Practitioner Credentials',
    description:
      'AHPRA registration, CPD hours, and professional indemnity expiry tracker',
    icon: Users,
    color: 'from-teal-500/20 to-teal-500/5 border-teal-400/20',
    reportType: 'hipaa',
  },
  {
    id: 'healthcare-clinical-incidents',
    title: 'Clinical Incident Tracker',
    description:
      'Open/closed incidents with severity breakdown and regulator notification status',
    icon: AlertTriangle,
    color: 'from-rose-500/20 to-rose-500/5 border-rose-400/20',
    reportType: 'hipaa',
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
    reportType: 'ndis',
  },
  {
    id: 'aged-care-care-plans',
    title: 'Care Plan Compliance',
    description:
      'Plan review timeliness, overdue reviews, and resident care coverage',
    icon: ClipboardList,
    color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-400/20',
    reportType: 'ndis',
  },
  {
    id: 'aged-care-star-rating',
    title: 'Star Rating Readiness',
    description:
      'Estimated quality rating breakdown with improvement recommendations',
    icon: BarChart3,
    color: 'from-amber-500/20 to-amber-500/5 border-amber-400/20',
    reportType: 'trust',
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
    reportType: 'trust',
  },
  {
    id: 'childcare-educator',
    title: 'Educator Credentials',
    description:
      'WWC checks, first aid, qualifications status, and renewal timeline',
    icon: Users,
    color: 'from-orange-500/20 to-orange-500/5 border-orange-400/20',
    reportType: 'trust',
  },
  {
    id: 'childcare-safety',
    title: 'Child Safety Report',
    description:
      'Incident log, mandatory reporting compliance, and safety audit history',
    icon: ShieldCheck,
    color: 'from-rose-500/20 to-rose-500/5 border-rose-400/20',
    reportType: 'trust',
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
    reportType: 'trust',
  },
  {
    id: 'financial-board-report',
    title: 'Board Compliance Pack',
    description:
      'Executive summary for board reporting with RAG status across obligations',
    icon: Landmark,
    color: 'from-indigo-500/20 to-indigo-500/5 border-indigo-400/20',
    reportType: 'trust',
  },
  {
    id: 'financial-aml-kyc',
    title: 'AML/KYC Status Report',
    description:
      'Anti-money laundering program compliance and customer due diligence status',
    icon: ShieldCheck,
    color: 'from-sky-500/20 to-sky-500/5 border-sky-400/20',
    reportType: 'soc2',
  },
];

const RAG_STATUS_REPORT: ReportTemplate = {
  id: 'rag-status-report',
  title: 'RAG Status Report',
  description:
    'Comprehensive red/amber/green status across all obligations, controls, and frameworks',
  icon: BarChart3,
  color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-400/20',
  reportType: 'trust',
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

export function IndustryReportTemplates({
  disableExports = false,
}: {
  disableExports?: boolean;
}) {
  const organization = useAppStore((state) => state.organization);
  const industry = organization?.industry ?? null;
  const { label, templates } = getIndustryReports(industry);

  return (
    <div className="space-y-6">
      {/* Industry-specific reports */}
      {templates.length > 0 && (
        <div className="rounded-[2rem] border border-edge-2 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-4 sm:p-6 md:p-8">
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
                className={`rounded-2xl border bg-gradient-to-br p-5 ${tmpl.color} ${
                  disableExports ? 'opacity-60' : ''
                }`}
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
                    {disableExports ? (
                      <button
                        type="button"
                        disabled
                        className="mt-3 text-xs font-semibold text-muted-foreground"
                      >
                        Requires export access
                      </button>
                    ) : (
                      <a
                        href={`/api/reports/export?type=${tmpl.reportType}&format=pdf&mode=sync`}
                        className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
                      >
                        Generate
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Universal RAG Status Report — available to all industries */}
      <div className="rounded-[2rem] border border-edge-2 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-4 sm:p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2 text-emerald-300">
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Universal Reports
          </span>
        </div>
        <div
          className={`rounded-2xl border bg-gradient-to-br p-5 max-w-md ${RAG_STATUS_REPORT.color} ${
            disableExports ? 'opacity-60' : ''
          }`}
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
              {disableExports ? (
                <button
                  type="button"
                  disabled
                  className="mt-3 text-xs font-semibold text-muted-foreground"
                >
                  Requires export access
                </button>
              ) : (
                <a
                  href={`/api/reports/export?type=${RAG_STATUS_REPORT.reportType}&format=pdf&mode=sync`}
                  className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
                >
                  Generate
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
