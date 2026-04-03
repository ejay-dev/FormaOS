'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Users,
  AlertTriangle,
  Shield,
  HeartPulse,
  Stethoscope,
  Home,
  Baby,
  Landmark,
  Clock,
  FileText,
  Star,
  BookOpen,
  Scale,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';

// ==========================================================
// RAG Helper
// ==========================================================
function ragClass(days: number): string {
  if (days < 0)
    return 'bg-[var(--wire-alert)]/15 text-[var(--wire-alert)] border-[var(--wire-alert)]/30';
  if (days <= 30) return 'bg-amber-500/15 text-amber-400 border-amber-400/30';
  return 'bg-[var(--wire-success)]/15 text-[var(--wire-success)] border-[var(--wire-success)]/30';
}

function ragDot(days: number): string {
  if (days < 0) return 'bg-[var(--wire-alert)]';
  if (days <= 30) return 'bg-amber-400';
  return 'bg-[var(--wire-success)]';
}

// ==========================================================
// NDIS — Worker Screening Widget
// ==========================================================
interface WorkerScreening {
  id: string;
  name: string;
  checkStatus: 'current' | 'expiring_soon' | 'expired';
  expiryDate: string;
  daysRemaining: number;
}

export function NDISWorkerScreeningWidget() {
  const [workers, setWorkers] = useState<WorkerScreening[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/staff-compliance/screening')
      .then((r) => (r.ok ? r.json() : { workers: [] }))
      .then((data) => {
        if (mounted) setWorkers(data.workers ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ErrorBoundary name="NDISWorkerScreeningWidget" level="component">
      <DashboardSectionCard
        title="Worker Screening"
        description="NDIS Worker Screening Check status"
        icon={UserCheck}
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No staff screening records.
            </p>
            <Link
              href="/app/staff-compliance"
              className="mt-2 inline-block text-xs text-[var(--wire-action)] hover:underline"
            >
              Add Staff Records
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-glass-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-1.5 px-2 text-left font-semibold">
                    Staff Member
                  </th>
                  <th className="py-1.5 px-2 text-left font-semibold">
                    Expiry
                  </th>
                  <th className="py-1.5 px-2 text-right font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {workers.slice(0, 8).map((w) => (
                  <tr
                    key={w.id}
                    className="border-b border-glass-border/50 h-8"
                  >
                    <td className="px-2 py-1 font-medium">{w.name}</td>
                    <td className="px-2 py-1 font-mono text-muted-foreground">
                      {new Date(w.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-1 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${ragClass(w.daysRemaining)}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${ragDot(w.daysRemaining)}`}
                        />
                        {w.daysRemaining < 0
                          ? 'Expired'
                          : w.daysRemaining <= 30
                            ? `${w.daysRemaining}d`
                            : 'Current'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

// ==========================================================
// NDIS — Participant Snapshot
// ==========================================================
export function NDISParticipantSnapshot() {
  const [data, setData] = useState<{
    total: number;
    plansOverdue: number;
    restrictivePractices: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/v1/participants/snapshot')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <ErrorBoundary name="NDISParticipantSnapshot" level="component">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-glass-border bg-glass-subtle p-3 text-center">
          <p className="text-xl font-bold font-mono">{data?.total ?? '—'}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Participants
          </p>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass-subtle p-3 text-center">
          <p className="text-xl font-bold font-mono text-amber-400">
            {data?.plansOverdue ?? '—'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Plans Due
          </p>
        </div>
        <div className="rounded-xl border border-glass-border bg-glass-subtle p-3 text-center">
          <p className="text-xl font-bold font-mono text-[var(--wire-alert)]">
            {data?.restrictivePractices ?? '—'}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Active RP
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// ==========================================================
// NDIS — SIRS Notification Tracker
// ==========================================================
export function NDISSIRSTrackerWidget() {
  const [counts, setCounts] = useState<{
    open: number;
    notified: number;
    investigating: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/v1/incidents/sirs-summary')
      .then((r) => (r.ok ? r.json() : null))
      .then(setCounts)
      .catch(() => {});
  }, []);

  return (
    <ErrorBoundary name="NDISSIRSTrackerWidget" level="component">
      <DashboardSectionCard
        title="SIRS Notifications"
        description="Serious incident reporting status"
        icon={AlertTriangle}
      >
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-lg font-bold font-mono text-[var(--wire-alert)]">
              {counts?.open ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono text-amber-400">
              {counts?.notified ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Notified</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-mono text-[var(--wire-action)]">
              {counts?.investigating ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Investigating</p>
          </div>
        </div>
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

// ==========================================================
// HEALTHCARE — Practitioner Register
// ==========================================================
interface Practitioner {
  id: string;
  name: string;
  ahpraStatus: 'registered' | 'suspended' | 'lapsed';
  cpdLogged: number;
  cpdRequired: number;
  indemnityExpiry: string;
  indemnityDaysRemaining: number;
}

export function HealthcarePractitionerWidget() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/staff-compliance/practitioners')
      .then((r) => (r.ok ? r.json() : { practitioners: [] }))
      .then((data) => {
        if (mounted) setPractitioners(data.practitioners ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ErrorBoundary name="HealthcarePractitionerWidget" level="component">
      <DashboardSectionCard
        title="Practitioner Register"
        description="AHPRA status, CPD hours, indemnity"
        icon={Stethoscope}
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : practitioners.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No practitioner records.
            </p>
            <Link
              href="/app/staff-compliance"
              className="text-xs text-[var(--wire-action)] hover:underline"
            >
              Add Practitioners
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {practitioners.slice(0, 6).map((p) => {
              const cpdPercent =
                p.cpdRequired > 0
                  ? Math.round((p.cpdLogged / p.cpdRequired) * 100)
                  : 0;
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-glass-border bg-glass-subtle p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">{p.name}</span>
                    <Badge
                      variant={
                        p.ahpraStatus === 'registered'
                          ? 'success'
                          : 'destructive'
                      }
                      className="text-[10px]"
                    >
                      {p.ahpraStatus.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        CPD: {p.cpdLogged}/{p.cpdRequired}h
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-glass-strong">
                        <div
                          className="h-1.5 rounded-full bg-[var(--wire-action)] transition-all"
                          style={{ width: `${Math.min(100, cpdPercent)}%` }}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono ${ragClass(p.indemnityDaysRemaining).split(' ')[1]}`}
                    >
                      Indemnity: {p.indemnityDaysRemaining}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

// ==========================================================
// HEALTHCARE — NSQHS Standards Tree
// ==========================================================
interface NSQHSStandard {
  id: string;
  number: number;
  title: string;
  progress: number;
}

export function HealthcareNSQHSWidget() {
  const [standards, setStandards] = useState<NSQHSStandard[]>([]);

  useEffect(() => {
    fetch('/api/v1/compliance/nsqhs-progress')
      .then((r) => (r.ok ? r.json() : { standards: [] }))
      .then((data) => setStandards(data.standards ?? []))
      .catch(() => {});
  }, []);

  const defaultStandards: NSQHSStandard[] = [
    { id: '1', number: 1, title: 'Clinical Governance', progress: 0 },
    { id: '2', number: 2, title: 'Partnering with Consumers', progress: 0 },
    {
      id: '3',
      number: 3,
      title: 'Preventing & Controlling Infections',
      progress: 0,
    },
    { id: '4', number: 4, title: 'Medication Safety', progress: 0 },
    { id: '5', number: 5, title: 'Comprehensive Care', progress: 0 },
    { id: '6', number: 6, title: 'Communicating for Safety', progress: 0 },
    { id: '7', number: 7, title: 'Blood Management', progress: 0 },
    {
      id: '8',
      number: 8,
      title: 'Recognising & Responding to Acute Deterioration',
      progress: 0,
    },
  ];

  const displayStandards = standards.length > 0 ? standards : defaultStandards;

  return (
    <ErrorBoundary name="HealthcareNSQHSWidget" level="component">
      <DashboardSectionCard
        title="NSQHS Standards"
        description="8 National Safety & Quality Standards"
        icon={Shield}
      >
        <div className="space-y-2">
          {displayStandards.map((s) => {
            const barColor =
              s.progress >= 80
                ? 'bg-[var(--wire-success)]'
                : s.progress >= 50
                  ? 'bg-amber-400'
                  : 'bg-[var(--wire-alert)]';
            return (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">
                  {s.number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{s.title}</p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-glass-strong">
                    <div
                      className={`h-1.5 rounded-full transition-all ${barColor}`}
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground w-8 text-right">
                  {s.progress}%
                </span>
              </div>
            );
          })}
        </div>
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

// ==========================================================
// AGED CARE — Resident Care Plan Review
// ==========================================================
export function AgedCareCarePlanWidget() {
  const [data, setData] = useState<{
    dueThisMonth: number;
    overdue: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/v1/care-plans/review-status')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <ErrorBoundary name="AgedCareCarePlanWidget" level="component">
      <DashboardSectionCard
        title="Care Plan Reviews"
        description="Resident care plan review tracking"
        icon={Home}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-glass-border bg-glass-subtle p-3 text-center">
            <p className="text-xl font-bold font-mono text-amber-400">
              {data?.dueThisMonth ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">
              Due This Month
            </p>
          </div>
          <div className="rounded-lg border border-glass-border bg-glass-subtle p-3 text-center">
            <p className="text-xl font-bold font-mono text-[var(--wire-alert)]">
              {data?.overdue ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">
              Overdue
            </p>
          </div>
        </div>
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

// ==========================================================
// AGED CARE — Star Rating Readiness
// ==========================================================
export function AgedCareStarRatingWidget() {
  const [completion, setCompletion] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/v1/compliance/star-rating-readiness')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCompletion(data?.completionPercentage ?? null))
      .catch(() => {});
  }, []);

  const pct = completion ?? 0;
  const color =
    pct >= 80
      ? 'text-[var(--wire-success)]'
      : pct >= 50
        ? 'text-amber-400'
        : 'text-[var(--wire-alert)]';

  return (
    <ErrorBoundary name="AgedCareStarRatingWidget" level="component">
      <DashboardSectionCard
        title="Star Rating Readiness"
        description="Aged Care Quality Standards completion"
        icon={Star}
      >
        <div className="flex items-center gap-4">
          <div className={`text-3xl font-bold font-mono ${color}`}>{pct}%</div>
          <div className="flex-1">
            <div className="h-3 w-full rounded-full bg-glass-strong">
              <div
                className={`h-3 rounded-full transition-all ${pct >= 80 ? 'bg-[var(--wire-success)]' : pct >= 50 ? 'bg-amber-400' : 'bg-[var(--wire-alert)]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              ACQS compliance readiness
            </p>
          </div>
        </div>
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

// ==========================================================
// CHILDCARE — Educator Credentials
// ==========================================================
interface EducatorCredential {
  id: string;
  name: string;
  wwcExpiry: string;
  wwcDays: number;
  firstAidExpiry: string;
  firstAidDays: number;
  qualificationStatus: 'qualified' | 'in_progress' | 'not_started';
}

export function ChildcareEducatorCredentialsWidget() {
  const [educators, setEducators] = useState<EducatorCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/staff-compliance/educators')
      .then((r) => (r.ok ? r.json() : { educators: [] }))
      .then((data) => {
        if (mounted) setEducators(data.educators ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ErrorBoundary name="ChildcareEducatorCredentialsWidget" level="component">
      <DashboardSectionCard
        title="Educator Credentials"
        description="WWC, First Aid, qualifications"
        icon={Baby}
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : educators.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No educator records.
            </p>
            <Link
              href="/app/staff-compliance"
              className="text-xs text-[var(--wire-action)] hover:underline"
            >
              Add Educators
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-glass-border text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-1.5 px-2 text-left font-semibold">
                    Educator
                  </th>
                  <th className="py-1.5 px-2 text-center font-semibold">WWC</th>
                  <th className="py-1.5 px-2 text-center font-semibold">
                    First Aid
                  </th>
                  <th className="py-1.5 px-2 text-right font-semibold">
                    Quals
                  </th>
                </tr>
              </thead>
              <tbody>
                {educators.slice(0, 8).map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-glass-border/50 h-8"
                  >
                    <td className="px-2 py-1 font-medium">{e.name}</td>
                    <td className="px-2 py-1 text-center">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${ragDot(e.wwcDays)}`}
                        title={`${e.wwcDays}d`}
                      />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${ragDot(e.firstAidDays)}`}
                        title={`${e.firstAidDays}d`}
                      />
                    </td>
                    <td className="px-2 py-1 text-right">
                      <Badge
                        variant={
                          e.qualificationStatus === 'qualified'
                            ? 'success'
                            : e.qualificationStatus === 'in_progress'
                              ? 'warning'
                              : 'outline'
                        }
                        className="text-[9px]"
                      >
                        {e.qualificationStatus === 'qualified'
                          ? '✓'
                          : e.qualificationStatus === 'in_progress'
                            ? 'IP'
                            : '—'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

// ==========================================================
// CHILDCARE — NQF Quality Areas
// ==========================================================
interface QualityArea {
  id: string;
  number: number;
  title: string;
  progress: number;
}

export function ChildcareNQFWidget() {
  const [areas, setAreas] = useState<QualityArea[]>([]);

  useEffect(() => {
    fetch('/api/v1/compliance/nqf-progress')
      .then((r) => (r.ok ? r.json() : { areas: [] }))
      .then((data) => setAreas(data.areas ?? []))
      .catch(() => {});
  }, []);

  const defaultAreas: QualityArea[] = [
    {
      id: '1',
      number: 1,
      title: 'Educational Program & Practice',
      progress: 0,
    },
    { id: '2', number: 2, title: "Children's Health & Safety", progress: 0 },
    { id: '3', number: 3, title: 'Physical Environment', progress: 0 },
    { id: '4', number: 4, title: 'Staffing Arrangements', progress: 0 },
    { id: '5', number: 5, title: 'Relationships with Children', progress: 0 },
    { id: '6', number: 6, title: 'Collaborative Partnerships', progress: 0 },
    { id: '7', number: 7, title: 'Governance & Leadership', progress: 0 },
  ];

  const display = areas.length > 0 ? areas : defaultAreas;

  return (
    <ErrorBoundary name="ChildcareNQFWidget" level="component">
      <DashboardSectionCard
        title="NQF Quality Areas"
        description="7 Quality Areas completion"
        icon={BookOpen}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {display.map((a) => {
            const radius = 16;
            const circ = 2 * Math.PI * radius;
            const offset = circ - (a.progress / 100) * circ;
            const color =
              a.progress >= 80
                ? 'var(--wire-success)'
                : a.progress >= 50
                  ? '#f59e0b'
                  : 'var(--wire-alert)';
            return (
              <div key={a.id} className="flex flex-col items-center gap-1 p-2">
                <div className="relative h-10 w-10">
                  <svg
                    className="transform -rotate-90 h-full w-full"
                    viewBox="0 0 40 40"
                  >
                    <circle
                      cx="20"
                      cy="20"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      className="text-glass-border"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r={radius}
                      stroke={color}
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={circ}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold"
                    style={{ color }}
                  >
                    {a.progress}%
                  </span>
                </div>
                <p className="text-[9px] text-center text-muted-foreground leading-tight">
                  QA{a.number}
                </p>
              </div>
            );
          })}
        </div>
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

// ==========================================================
// FINANCIAL SERVICES — Breach Register
// ==========================================================
export function FinancialBreachRegisterWidget() {
  const [data, setData] = useState<{
    openBreaches: number;
    selfReported: number;
    daysSinceDetection: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/v1/registers/breach-summary')
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <ErrorBoundary name="FinancialBreachRegisterWidget" level="component">
      <DashboardSectionCard
        title="Breach Register"
        description="Open breaches & ASIC reporting status"
        icon={Scale}
      >
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center rounded-lg border border-glass-border bg-glass-subtle p-3">
            <p className="text-xl font-bold font-mono text-[var(--wire-alert)]">
              {data?.openBreaches ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className="text-center rounded-lg border border-glass-border bg-glass-subtle p-3">
            <p className="text-xl font-bold font-mono text-[var(--wire-action)]">
              {data?.selfReported ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Self-Reported</p>
          </div>
          <div className="text-center rounded-lg border border-glass-border bg-glass-subtle p-3">
            <p className="text-xl font-bold font-mono text-foreground">
              {data?.daysSinceDetection ?? '—'}
            </p>
            <p className="text-[10px] text-muted-foreground">Days Since</p>
          </div>
        </div>
      </DashboardSectionCard>
    </ErrorBoundary>
  );
}

// ==========================================================
// FINANCIAL SERVICES — Board Report Generator Button
// ==========================================================
export function FinancialBoardReportButton() {
  return (
    <ErrorBoundary name="FinancialBoardReportButton" level="component">
      <div className="rounded-xl border border-glass-border bg-gradient-to-r from-glass-subtle to-glass-strong p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Board Reporting Pack</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate a comprehensive compliance report for board review
            </p>
          </div>
          <Link
            href="/app/reports?template=board-compliance"
            className="rounded-lg bg-[var(--wire-action)] px-4 py-2 text-xs font-semibold text-black hover:opacity-90 transition-opacity"
          >
            Generate Report
          </Link>
        </div>
      </div>
    </ErrorBoundary>
  );
}
