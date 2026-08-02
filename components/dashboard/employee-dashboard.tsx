'use client';

import React from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  FileText,
  CheckSquare,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';
import { GettingStartedChecklist } from '@/components/onboarding/GettingStartedChecklist';
import { ComplianceSummaryCards } from '@/components/compliance/ComplianceSummaryCards';
import { MyActionsWidget } from '@/components/compliance/MyActionsWidget';
import { UpcomingDeadlinesWidget } from '@/components/compliance/UpcomingDeadlinesWidget';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import type { DatabaseRole } from '@/lib/roles';

/**
 * =========================================================
 * EMPLOYEE DASHBOARD SECTIONS
 * =========================================================
 * Sections only visible to member/viewer roles
 * Shows personal compliance data and task assignments
 */

interface EmployeeDashboardProps {
  employeeName: string;
  organizationName: string;
  userRole: DatabaseRole;
  industry?: string | null;
  complianceScore?: number;
  nextAuditDate?: string;
  tasksAssigned?: number;
  tasksPending?: number;
  /**
   * True while DashboardWrapper renders StartHereCard above this dashboard.
   * The activation checklist is suppressed for that window so a new user
   * never sees two onboarding lists on one screen — first-5 actions belong
   * to StartHereCard, the checklist takes over once it retires.
   */
  firstSessionActive?: boolean;
}

/**
 * Personal compliance status
 */
export function MyComplianceStatus({
  complianceScore = 0,
  orgAverage = 0,
  nextAuditDate = '',
  status = 'on_track',
}: {
  complianceScore: number;
  orgAverage: number;
  nextAuditDate: string;
  status: 'on_track' | 'at_risk' | 'review_needed';
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track':
        return 'bg-success/10 border-success/30 text-success';
      case 'at_risk':
        return 'bg-warning/10 border-warning/30 text-warning';
      case 'review_needed':
        return 'bg-destructive/10 border-destructive/30 text-destructive';
      default:
        return 'bg-muted/40 border-border text-muted-foreground';
    }
  };

  return (
    <DashboardSectionCard
      title="My Compliance Status"
      description="Your current compliance position"
      icon={ClipboardCheck}
    >
      <div className="space-y-6">
        {/* Score */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your Score</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold">{complianceScore}%</p>
              <p className="text-sm text-muted-foreground pb-1">
                vs org avg {orgAverage}%
              </p>
            </div>
          </div>
          <div className="relative h-32 rounded-lg bg-muted/40 p-4 flex items-end justify-center">
            <div
              className="w-12 bg-primary rounded"
              style={{ height: `${complianceScore}%` }}
            />
            <p className="absolute top-2 text-xs text-muted-foreground">
              Your Progress
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <span
            className={`px-4 py-2 rounded-lg border font-semibold ${getStatusColor(status)}`}
          >
            {status === 'on_track'
              ? 'On Track'
              : status === 'at_risk'
                ? 'At Risk'
                : 'Review Needed'}
          </span>
          {nextAuditDate && (
            <p className="text-sm text-muted-foreground">
              Next audit:{' '}
              <span className="font-semibold text-foreground">
                {nextAuditDate}
              </span>
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2">
          <button className="w-full sm:flex-1 px-4 py-2 rounded-md border border-border bg-primary/10 text-primary hover:bg-primary/15 transition-colors font-semibold text-sm">
            View Full Report
          </button>
          <button className="w-full sm:flex-1 px-4 py-2 rounded-md border border-border bg-muted/40 text-foreground hover:bg-muted/60 transition-colors font-semibold text-sm">
            Request Help
          </button>
        </div>
      </div>
    </DashboardSectionCard>
  );
}

/**
 * My certificates and licenses
 */
export function MyCertificates({
  certificates = [],
}: {
  certificates?: Array<{
    id: string;
    title: string;
    issuedDate: string;
    expiresAt: string;
    status: 'active' | 'expiring_soon' | 'expired';
    daysUntilExpiry?: number;
  }>;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success border-success/30';
      case 'expiring_soon':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'expired':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted/40 text-muted-foreground border-border';
    }
  };

  return (
    <DashboardSectionCard
      title="My Certificates & Licenses"
      description="Your active certifications"
      icon={FileText}
    >
      <div className="space-y-3">
        {certificates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No certifications on file.
          </p>
        ) : (
          certificates.map((cert) => (
            <div
              key={cert.id}
              className="p-4 rounded-lg bg-card border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{cert.title}</h4>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(
                    cert.status,
                  )}`}
                >
                  {cert.status === 'active'
                    ? 'Active'
                    : cert.status === 'expiring_soon'
                      ? `Expires in ${cert.daysUntilExpiry} days`
                      : 'Expired'}
                </span>
              </div>
              <div className="flex gap-8 text-xs text-muted-foreground">
                <p>
                  Issued:{' '}
                  <span className="text-foreground/70">{cert.issuedDate}</span>
                </p>
                <p>
                  Expires:{' '}
                  <span className="text-foreground/70">{cert.expiresAt}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * My assigned tasks
 */
export function MyTasks({
  tasks = [],
}: {
  tasks?: Array<{
    id: string;
    title: string;
    description: string;
    assignedBy: string;
    dueAt: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
    completionPercentage: number;
  }>;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-muted/40 text-muted-foreground border-border';
      case 'in_progress':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'completed':
        return 'bg-success/10 text-success border-success/30';
      case 'overdue':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      default:
        return 'bg-muted/40 text-muted-foreground border-border';
    }
  };

  return (
    <DashboardSectionCard
      title="My Tasks"
      description="Assigned tasks and deadlines"
      icon={CheckSquare}
    >
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active tasks assigned to you.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-lg bg-card border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{task.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.description}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold border whitespace-nowrap ml-2 ${getStatusColor(
                    task.status,
                  )}`}
                >
                  {task.status === 'pending'
                    ? 'Pending'
                    : task.status === 'in_progress'
                      ? 'In Progress'
                      : task.status === 'completed'
                        ? 'Completed'
                        : 'Overdue'}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div className="flex-1 text-xs text-muted-foreground">
                  <p>
                    Assigned by:{' '}
                    <span className="text-foreground/70">
                      {task.assignedBy}
                    </span>
                  </p>
                  <p>
                    Due:{' '}
                    <span className="text-foreground/70">{task.dueAt}</span>
                  </p>
                </div>

                {task.status !== 'completed' && (
                  <div className="text-right ml-4">
                    <p className="text-xs font-semibold mb-1">
                      {task.completionPercentage}%
                    </p>
                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${task.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Upload evidence
 */
export function UploadEvidence({
  recentSubmissions = [],
}: {
  recentSubmissions?: Array<{
    id: string;
    title: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    feedback?: string;
  }>;
}) {
  return (
    <DashboardSectionCard
      title="My Evidence"
      description="Submit and track compliance evidence"
      icon={CheckCircle2}
    >
      <div className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/40 hover:bg-muted/30 transition-all cursor-pointer">
          <p className="text-sm text-muted-foreground mb-2">
            Click or drag files to upload
          </p>
          <p className="text-xs text-muted-foreground/60">
            Supported: PDF, DOC, DOCX, JPG, PNG (max 10MB)
          </p>
        </div>

        {/* Recent Submissions */}
        {recentSubmissions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold mb-3">Recent Submissions</h4>
            <div className="space-y-2">
              {recentSubmissions.map((sub) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'pending':
                      return 'bg-primary/10 text-primary border-primary/30';
                    case 'approved':
                      return 'bg-success/10 text-success border-success/30';
                    case 'rejected':
                      return 'bg-destructive/10 text-destructive border-destructive/30';
                    default:
                      return 'bg-muted/40 text-muted-foreground border-border';
                  }
                };

                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded bg-muted/30"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{sub.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {sub.submittedAt}
                      </p>
                      {sub.feedback && (
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Feedback: {sub.feedback}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold border whitespace-nowrap ml-2 ${getStatusColor(
                        sub.status,
                      )}`}
                    >
                      {sub.status === 'pending'
                        ? 'Pending'
                        : sub.status === 'approved'
                          ? 'Approved'
                          : 'Rejected'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Training & Learning
 */
export function Training({
  courses = [],
}: {
  courses?: Array<{
    id: string;
    title: string;
    description: string;
    completionPercentage: number;
    requiredFor?: string;
  }>;
}) {
  return (
    <DashboardSectionCard
      title="Training & Learning"
      description="Complete assigned training modules"
      icon={Briefcase}
    >
      <div className="space-y-3">
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No training assigned.</p>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="p-4 rounded-lg bg-card border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{course.title}</h4>
                <span className="text-sm font-bold text-primary">
                  {course.completionPercentage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {course.description}
              </p>
              {course.requiredFor && (
                <p className="text-xs text-warning mb-3">
                  Required for: {course.requiredFor}
                </p>
              )}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${course.completionPercentage}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

function getEmployeeEntityLabel(industry?: string | null): string {
  switch (industry) {
    case 'ndis':
      return 'participant compliance';
    case 'healthcare':
      return 'clinical';
    case 'aged_care':
      return 'resident care';
    case 'childcare':
      return 'child safety';
    case 'community_services':
      return 'client service';
    case 'financial_services':
      return 'regulatory';
    case 'saas_technology':
      return 'security control';
    case 'enterprise':
      return 'enterprise';
    default:
      return 'compliance';
  }
}

function RoleWorkflowBoard({
  role,
  industry,
  tasksAssigned,
  tasksPending,
  complianceScore,
}: {
  role: DatabaseRole;
  industry?: string | null;
  tasksAssigned: number;
  tasksPending: number;
  complianceScore: number;
}) {
  const isViewer = role === 'viewer';
  const entityLabel = getEmployeeEntityLabel(industry);
  const actions = isViewer
    ? [
        {
          label: 'Review readiness dashboard',
          detail: `Start with ${entityLabel} posture and risk visibility before deep review.`,
          href: '/app',
          icon: TrendingUp,
        },
        {
          label: 'Inspect evidence vault',
          detail: `Check ${entityLabel} evidence completeness and verification state.`,
          href: '/app/vault',
          icon: FileText,
        },
        {
          label: 'Read audit stream',
          detail: `Trace approvals and key ${entityLabel} events.`,
          href: '/app/audit-trail',
          icon: Calendar,
        },
      ]
    : [
        {
          label: `Complete priority ${entityLabel} tasks`,
          detail: `Focus on assigned ${entityLabel} items with pending status first.`,
          href: '/app/tasks',
          icon: CheckSquare,
        },
        {
          label: 'Upload required evidence',
          detail: `Attach proof for current ${entityLabel} controls and close readiness gaps.`,
          href: '/app/vault',
          icon: CheckCircle2,
        },
        {
          label: 'Validate policy obligations',
          detail: 'Review role-specific policy requirements before submission.',
          href: '/app/policies',
          icon: ClipboardCheck,
        },
      ];

  return (
    <DashboardSectionCard
      title={isViewer ? 'Viewer Command Center' : 'Execution Command Center'}
      description={
        isViewer
          ? 'Read-only workflow to validate posture and evidence'
          : 'Role-specific actions to reach compliance proof faster'
      }
      icon={Briefcase}
    >
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{tasksAssigned}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Assigned
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{tasksPending}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Pending
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">
            {complianceScore}%
          </p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Score
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/40">
                <action.icon className="h-4 w-4 text-foreground/70" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground">{action.detail}</p>
              </div>
            </div>
            <CheckCircle2 className="mt-1 h-4 w-4 self-end text-muted-foreground/60 transition-transform group-hover:scale-110 sm:self-auto" />
          </Link>
        ))}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Complete employee dashboard
 */
export function EmployeeDashboard({
  employeeName,
  organizationName,
  userRole,
  industry,
  complianceScore = 0,
  nextAuditDate = '',
  tasksAssigned = 0,
  tasksPending = 0,
  firstSessionActive = false,
}: EmployeeDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Compliance Summary — same view as employer for context */}
      <ErrorBoundary name="EmployeeSummaryCards" level="component">
        <ComplianceSummaryCards />
      </ErrorBoundary>

      <div className="rounded-xl border border-border bg-card px-4 sm:px-5 py-4">
        <p className="text-sm text-muted-foreground">Signed in as</p>
        <p className="mt-1 text-sm text-foreground/90">
          {employeeName} at {organizationName}
        </p>
      </div>

      {/* Primary work area: My Actions + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MyActionsWidget />
        <UpcomingDeadlinesWidget />
      </div>

      {!firstSessionActive && <GettingStartedChecklist industry={industry} />}
      <RoleWorkflowBoard
        role={userRole}
        industry={industry}
        tasksAssigned={tasksAssigned}
        tasksPending={tasksPending}
        complianceScore={complianceScore}
      />

      <div data-tour="dashboard-overview">
        <MyComplianceStatus
          complianceScore={complianceScore}
          orgAverage={75}
          nextAuditDate={nextAuditDate}
          status={complianceScore >= 80 ? 'on_track' : 'at_risk'}
        />
      </div>

      <MyTasks tasks={[]} />

      <MyCertificates certificates={[]} />

      <UploadEvidence recentSubmissions={[]} />

      <Training courses={[]} />
    </div>
  );
}
