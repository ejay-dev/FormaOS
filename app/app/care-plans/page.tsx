/**
 * Care Plans Page
 * Manage individualised care/support plans, goals, and review dates
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  AlertTriangle,
  User,
  Calendar,
  Target,
  Workflow,
} from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { CarePlansEmptyState } from '@/components/empty-states';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';
import {
  CARE_PLAN_STATUS_CLASSES,
  CARE_PLAN_STATUS_LABELS,
  normaliseCarePlanStatus,
} from '@/components/care/care-plan-status';
import {
  RecordCard,
  RecordList,
} from '@/components/mobile/record-card';

export const metadata = {
  title: 'Care Plans | FormaOS',
};

function formatDate(date: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getReviewStatus(reviewDate: string | null): {
  label: string;
  color: string;
  urgent: boolean;
} {
  if (!reviewDate)
    return {
      label: 'No Review',
      color: 'text-muted-foreground',
      urgent: false,
    };

  const review = new Date(reviewDate);
  const now = new Date();
  const daysUntil = Math.ceil(
    (review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntil < 0) {
    return {
      label: 'Overdue',
      color: 'text-destructive bg-destructive/10',
      urgent: true,
    };
  } else if (daysUntil <= 14) {
    return {
      label: `${daysUntil}d`,
      color: 'text-warning bg-warning/10',
      urgent: true,
    };
  } else if (daysUntil <= 30) {
    return {
      label: `${daysUntil}d`,
      color: 'text-warning bg-warning/10',
      urgent: false,
    };
  }
  return {
    label: 'On Track',
    color: 'text-success bg-success/10',
    urgent: false,
  };
}

function getCarePlanLabel(industry: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'Support Plans';
    case 'healthcare':
      return 'Clinical Plans';
    case 'childcare':
      return 'Learning Plans';
    default:
      return 'Care Plans';
  }
}

function getClientLabel(industry: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'Participant';
    case 'healthcare':
      return 'Patient';
    case 'childcare':
      return 'Child';
    default:
      return 'Resident';
  }
}

function planStatusStyle(status: string): { label: string; color: string } {
  const key = normaliseCarePlanStatus(status);
  return {
    label: CARE_PLAN_STATUS_LABELS[key],
    color: CARE_PLAN_STATUS_CLASSES[key],
  };
}

const PLAN_TYPE_LABELS: Record<string, string> = {
  support: 'Support Plan',
  ndis: 'NDIS Plan',
  chsp: 'CHSP Plan',
  clinical: 'Clinical Plan',
  behavioral: 'Behavioural Plan',
};

export default async function CarePlansPage() {
  const systemState = await fetchSystemState();
  if (!systemState) redirect('/auth/signin');

  const { organization } = systemState;
  const label = getCarePlanLabel(organization.industry);
  const clientLabel = getClientLabel(organization.industry);
  const supabase = await createSupabaseServerClient();

  // Fetch care plans with client info
  const { data: carePlans, error } = await supabase
    .from('org_care_plans')
    .select(
      `
      id,
      plan_type,
      title,
      description,
      start_date,
      end_date,
      review_date,
      status,
      goals,
      supports,
      client_consented,
      created_at,
      client:client_id (
        id,
        full_name
      )
    `,
    )
    .eq('organization_id', organization.id)
    .order('review_date', { ascending: true, nullsFirst: false })
    .limit(200);

  if (error) {
    console.error('[CarePlansPage] Error fetching care plans:', error);
  }

  // Calculate stats
  type CarePlan = NonNullable<typeof carePlans>[number];
  const now = new Date();
  const stats = {
    total: carePlans?.length ?? 0,
    active:
      carePlans?.filter((p: CarePlan) => p.status === 'active').length ?? 0,
    drafts:
      carePlans?.filter((p: CarePlan) => p.status === 'draft').length ?? 0,
    reviewDue:
      carePlans?.filter((p: CarePlan) => {
        if (!p.review_date) return false;
        const review = new Date(p.review_date);
        const daysUntil = Math.ceil(
          (review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return daysUntil <= 14;
      }).length ?? 0,
  };

  const heroMetrics: PageHeroMetric[] = [
    { label: 'Total', value: stats.total, sub: 'plans' },
    {
      label: 'Active',
      value: stats.active,
      sub: stats.active > 0 ? 'in effect' : 'none active',
      tone: 'success',
    },
    { label: 'Drafts', value: stats.drafts, sub: 'not yet active' },
    {
      label: 'Review due',
      value: stats.reviewDue,
      sub: stats.reviewDue > 0 ? 'within 14 days' : 'none due',
      tone: stats.reviewDue > 0 ? 'warning' : 'neutral',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHero
        eyebrow={`Care Operations · ${label}`}
        title={label}
        titleTestId="care-plans-title"
        subtitle="Manage individualised plans, goals, and review schedules."
        metrics={heroMetrics}
        actions={
          <>
            <Link
              href="/app/care-plans/journey"
              className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
              data-testid="care-plans-journey-link"
            >
              <Workflow className="h-3.5 w-3.5" />
              Journey view
            </Link>
            <Link
              href="/app/care-plans/new"
              className="min-h-[44px] md:min-h-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
              data-testid="create-care-plan-btn"
            >
              <Plus className="h-3.5 w-3.5" />
              New plan
            </Link>
          </>
        }
      />

      <div className="page-content space-y-4">
      {/* Review alert */}
      {stats.reviewDue > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {stats.reviewDue === 1
              ? '1 plan needs review within the next 14 days.'
              : `${stats.reviewDue} plans need review within the next 14 days.`}
          </span>
        </div>
      )}

      {/* Mobile cards */}
      <div className="md:hidden">
        {(!carePlans || carePlans.length === 0) ? (
          <CarePlansEmptyState
            industry={organization.industry as 'ndis' | 'healthcare' | 'aged_care' | 'childcare' | null}
          />
        ) : (
          <RecordList>
            {carePlans.map((plan: CarePlan) => {
              const reviewStatus = getReviewStatus(plan.review_date);
              const statusStyle = planStatusStyle(plan.status);
              const goalsCount = Array.isArray(plan.goals)
                ? plan.goals.length
                : 0;
              const clientName =
                (plan.client as { full_name?: string } | null)?.full_name ||
                'Unassigned';
              return (
                <RecordCard
                  key={plan.id}
                  href={`/app/care-plans/${plan.id}`}
                  title={plan.title}
                  subtitle={clientName}
                  status={
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${statusStyle.color}`}
                    >
                      {statusStyle.label}
                    </span>
                  }
                  meta={[
                    {
                      label: 'Review',
                      value: (
                        <span
                          className={
                            reviewStatus.urgent
                              ? 'text-warning font-semibold'
                              : ''
                          }
                        >
                          {formatDate(plan.review_date)}
                        </span>
                      ),
                    },
                    { label: 'Goals', value: String(goalsCount) },
                    {
                      label: 'Type',
                      value:
                        PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type,
                    },
                  ]}
                />
              );
            })}
          </RecordList>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden overflow-x-auto overscroll-x-contain">
        <table className="min-w-[640px] w-full" data-testid="care-plans-table">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">
                {clientLabel}
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium">Plan</th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">
                Type
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">
                Goals
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium">
                Review Date
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium">
                Status
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {carePlans?.map((plan: CarePlan) => {
              const reviewStatus = getReviewStatus(plan.review_date);
              const statusStyle = planStatusStyle(plan.status);
              const goalsCount = Array.isArray(plan.goals)
                ? plan.goals.length
                : 0;
              return (
                <tr
                  key={plan.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    reviewStatus.urgent ? 'bg-warning/5' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {(plan.client as { full_name?: string } | null)
                          ?.full_name || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">{plan.title}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {PLAN_TYPE_LABELS[plan.plan_type] || plan.plan_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{goalsCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDate(plan.review_date)}
                      </span>
                      {reviewStatus.urgent && (
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded-full text-xs font-medium ${reviewStatus.color}`}
                        >
                          {reviewStatus.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}
                    >
                      {statusStyle.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/care-plans/${plan.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!carePlans || carePlans.length === 0) && (
              <tr>
                <td colSpan={7} className="p-0">
                  <CarePlansEmptyState
                    industry={organization.industry as 'ndis' | 'healthcare' | 'aged_care' | 'childcare' | null}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
