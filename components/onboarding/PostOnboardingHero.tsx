import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Mail,
  NotebookPen,
  ShieldCheck,
  Star,
  TriangleAlert,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

import type { FirstSessionState } from '@/lib/onboarding/first-session';

// ── Industry-specific next steps ─────────────────────────

type NextStepCard = {
  icon: React.ElementType;
  iconColorClass: string;
  label: string;
  description: string;
  href: string;
  testId: string;
};

function getIndustryNextSteps(
  industry: string | null | undefined,
): NextStepCard[] {
  switch (industry) {
    case 'ndis':
      return [
        {
          icon: TriangleAlert,
          iconColorClass:
            'border-warning/20 bg-warning/10 text-warning',
          label: 'Log your first SIRS incident',
          description:
            'SIRS reportable incidents must reach the NDIS Commission within 24–5 days. Log one now to validate your workflow.',
          href: '/app/incidents',
          testId: 'post-onboarding-cta-incidents',
        },
        {
          icon: UserCheck,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Onboard your support workers',
          description:
            'Invite staff and start tracking NDIS Worker Screening, First Aid, and training expiry dates.',
          href: '/app/staff-compliance',
          testId: 'post-onboarding-cta-staff',
        },
        {
          icon: ShieldCheck,
          iconColorClass:
            'border-success/20 bg-success/10 text-success',
          label: 'Review your NDIS posture',
          description:
            'See which NDIS Practice Standards are covered and where action is needed.',
          href: '/app/compliance',
          testId: 'post-onboarding-cta-compliance',
        },
      ];

    case 'healthcare':
      return [
        {
          icon: NotebookPen,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Create your first clinical note',
          description:
            'Start building the clinical documentation habit — templated notes tied to patients and care plans.',
          href: '/app/progress-notes',
          testId: 'post-onboarding-cta-notes',
        },
        {
          icon: UserCheck,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Track practitioner credentials',
          description:
            'Add AHPRA registrations and CPD requirements so expiry alerts fire before lapse.',
          href: '/app/staff-compliance',
          testId: 'post-onboarding-cta-staff',
        },
        {
          icon: ShieldCheck,
          iconColorClass:
            'border-success/20 bg-success/10 text-success',
          label: 'Check your NSQHS posture',
          description:
            'Map your current documentation against National Safety and Quality Health Standards.',
          href: '/app/compliance',
          testId: 'post-onboarding-cta-compliance',
        },
      ];

    case 'aged_care':
      return [
        {
          icon: Star,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Improve your Star Rating inputs',
          description:
            'Documentation quality and staffing data feed into your published Star Rating. Start here.',
          href: '/app/compliance',
          testId: 'post-onboarding-cta-compliance',
        },
        {
          icon: UserCheck,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Set up workforce compliance',
          description:
            'Track Aged Care Screening, First Aid, and mandatory training for all care workers.',
          href: '/app/staff-compliance',
          testId: 'post-onboarding-cta-staff',
        },
        {
          icon: TriangleAlert,
          iconColorClass:
            'border-destructive/20 bg-destructive/10 text-destructive',
          label: 'Log your first serious incident',
          description:
            'Serious incident reporting to the ACQSC is a regulated requirement. Verify your workflow now.',
          href: '/app/incidents',
          testId: 'post-onboarding-cta-incidents',
        },
      ];

    case 'childcare':
      return [
        {
          icon: ShieldCheck,
          iconColorClass:
            'border-border bg-muted text-muted-foreground',
          label: 'Review your NQF posture',
          description:
            'Check your Quality Area ratings and identify where documentation needs strengthening.',
          href: '/app/compliance',
          testId: 'post-onboarding-cta-compliance',
        },
        {
          icon: UserCheck,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Track educator credentials',
          description:
            'Add WWCC, First Aid, Anaphylaxis, and Asthma training for every educator.',
          href: '/app/staff-compliance',
          testId: 'post-onboarding-cta-staff',
        },
        {
          icon: TriangleAlert,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Set up incident reporting',
          description:
            'Notify and Regulatory Authority notifications must happen fast. Test the workflow.',
          href: '/app/incidents',
          testId: 'post-onboarding-cta-incidents',
        },
      ];

    case 'financial_services':
      return [
        {
          icon: FileText,
          iconColorClass:
            'border-border bg-muted text-muted-foreground',
          label: 'Publish your first board report',
          description:
            'Generate a compliance posture summary for the board — data from your controls, not from scratch.',
          href: '/app/reports',
          testId: 'post-onboarding-cta-reports',
        },
        {
          icon: Users,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Assign staff compliance tasks',
          description:
            'Push policy acknowledgements and training tasks to your team members.',
          href: '/app/staff-compliance',
          testId: 'post-onboarding-cta-staff',
        },
        {
          icon: ShieldCheck,
          iconColorClass:
            'border-border bg-muted text-muted-foreground',
          label: 'Review your regulatory posture',
          description:
            'See where your controls map against ASIC, AUSTRAC, and APRA obligations.',
          href: '/app/compliance',
          testId: 'post-onboarding-cta-compliance',
        },
      ];

    case 'saas_technology':
      return [
        {
          icon: ShieldCheck,
          iconColorClass:
            'border-border bg-muted text-muted-foreground',
          label: 'Check your SOC 2 / ISO 27001 posture',
          description:
            'See which control objectives are already met and where evidence is missing.',
          href: '/app/compliance',
          testId: 'post-onboarding-cta-compliance',
        },
        {
          icon: Users,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Push security tasks to your team',
          description:
            'Assign access reviews, security training, and policy sign-offs to individual team members.',
          href: '/app/staff-compliance',
          testId: 'post-onboarding-cta-staff',
        },
        {
          icon: TriangleAlert,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Log your first security incident',
          description:
            'Practise the breach notification workflow so it is automatic when you need it.',
          href: '/app/incidents',
          testId: 'post-onboarding-cta-incidents',
        },
      ];

    default:
      return [
        {
          icon: TriangleAlert,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Manage your first incident',
          description:
            'Turn an event into a CAPA in minutes — the audit trail everyone will ask about.',
          href: '/app/incidents',
          testId: 'post-onboarding-cta-incidents',
        },
        {
          icon: UserCheck,
          iconColorClass: 'border-border bg-muted text-muted-foreground',
          label: 'Set up staff compliance',
          description:
            'Onboard credentials and training so expiring certs surface as tasks, not surprises.',
          href: '/app/staff-compliance',
          testId: 'post-onboarding-cta-staff',
        },
        {
          icon: ShieldCheck,
          iconColorClass:
            'border-border bg-muted text-muted-foreground',
          label: 'Review your compliance posture',
          description:
            'See which framework obligations are covered and where the gaps are right now.',
          href: '/app/compliance',
          testId: 'post-onboarding-cta-compliance',
        },
      ];
  }
}

// ── Industry invite CTA ────────────────────────────────────

function getInviteCopy(industry: string | null | undefined): string {
  switch (industry) {
    case 'ndis':
      return 'Invite support workers — they will get a guided orientation to NDIS compliance on their first login.';
    case 'healthcare':
      return 'Invite practitioners — they receive a personalised clinical compliance orientation on first login.';
    case 'aged_care':
      return 'Invite care workers — they get an Aged Care Quality Standards orientation on their first login.';
    case 'childcare':
      return 'Invite educators — they receive a guided NQF orientation on their first login.';
    default:
      return 'Invite your team — every new member receives an industry-specific onboarding experience on their first login.';
  }
}

// ── Component ─────────────────────────────────────────────

type PostOnboardingHeroProps = {
  state: FirstSessionState;
  industry?: string | null;
  orgName?: string;
};

/**
 * Rendered on /app once the 5 first-session steps are complete but the org
 * hasn't yet started doing the broader compliance work. Bridges the gap
 * between "setup is done" and "what should I do next?".
 *
 * Now industry-aware: shows relevant next actions based on the org's sector.
 */
export function PostOnboardingHero({
  state,
  industry,
  orgName,
}: PostOnboardingHeroProps) {
  if (state.total === 0) return null;
  if (state.completed < state.total) return null;

  const nextSteps = getIndustryNextSteps(industry);
  const inviteCopy = getInviteCopy(industry);

  return (
    <section data-testid="post-onboarding-hero" className="space-y-5">
      {/* ── Hero banner ── */}
      <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-success/30 bg-success/10">
              <ShieldCheck className="h-5 w-5 text-success" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-success">
                  Setup complete
                </p>
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {orgName
                  ? `${orgName} is ready to run compliance.`
                  : "You're ready to run compliance."}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                The five foundations are in place. These are the highest-impact
                next actions for your industry.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1.5">
            <Zap className="h-3 w-3 text-success" />
            <span className="text-[10px] font-black uppercase tracking-widest text-success">
              {state.completed}/{state.total} done
            </span>
          </div>
        </header>

        {/* ── Industry next-step cards ── */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {nextSteps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.testId}
                href={step.href}
                data-testid={step.testId}
                className="group flex items-start gap-3 rounded-xl border border-edge-2 bg-surface-1 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${step.iconColorClass}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {step.label}
                    </p>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Invite team banner ── */}
      <div className="flex items-start gap-4 rounded-2xl border border-edge-2 bg-surface-1 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted">
          <Mail className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Invite your team
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed max-w-lg">
            {inviteCopy}
          </p>
        </div>
        <Link
          href="/app/team"
          className="shrink-0 flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground border border-transparent px-4 py-2 text-xs font-bold transition-all hover:bg-primary/90 active:scale-[0.97]"
        >
          Invite
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}
