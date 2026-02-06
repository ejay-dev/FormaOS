'use client';

import React from 'react';
import {
  ClipboardCheck,
  FileText,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';
import { GettingStartedChecklist } from '@/components/onboarding/GettingStartedChecklist';

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
  complianceScore?: number;
  nextAuditDate?: string;
  tasksAssigned?: number;
  tasksPending?: number;
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
        return 'bg-green-500/20 border-green-400/30 text-green-300';
      case 'at_risk':
        return 'bg-amber-500/20 border-amber-400/30 text-amber-300';
      case 'review_needed':
        return 'bg-red-500/20 border-red-400/30 text-red-300';
      default:
        return 'bg-slate-500/20 border-slate-400/30 text-slate-300';
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
            <p className="text-sm text-slate-400 mb-2">Your Score</p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold">{complianceScore}%</p>
              <p className="text-sm text-slate-400 pb-1">
                vs org avg {orgAverage}%
              </p>
            </div>
          </div>
          <div className="relative h-32 rounded-lg bg-slate-700/50 p-4 flex items-end justify-center">
            <div
              className="w-12 bg-gradient-to-t from-green-500 to-green-400 rounded"
              style={{ height: `${complianceScore}%` }}
            />
            <p className="absolute top-2 text-xs text-slate-400">
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
              ? '✓ On Track'
              : status === 'at_risk'
                ? '⚠ At Risk'
                : '⚠ Review Needed'}
          </span>
          {nextAuditDate && (
            <p className="text-sm text-slate-400">
              Next audit:{' '}
              <span className="font-semibold text-white">{nextAuditDate}</span>
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2">
          <button className="w-full sm:flex-1 px-4 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors font-semibold text-sm">
            View Full Report
          </button>
          <button className="w-full sm:flex-1 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors font-semibold text-sm">
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
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'expiring_soon':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      case 'expired':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      default:
        return 'bg-slate-500/20 text-slate-300';
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
          <p className="text-sm text-slate-400">No certifications on file.</p>
        ) : (
          certificates.map((cert) => (
            <div
              key={cert.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
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
              <div className="flex gap-8 text-xs text-slate-400">
                <p>
                  Issued:{' '}
                  <span className="text-slate-300">{cert.issuedDate}</span>
                </p>
                <p>
                  Expires:{' '}
                  <span className="text-slate-300">{cert.expiresAt}</span>
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
        return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'overdue':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      default:
        return 'bg-slate-500/20 text-slate-300';
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
          <p className="text-sm text-slate-400">
            No active tasks assigned to you.
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{task.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">
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
                        ? '✓ Completed'
                        : '⚠ Overdue'}
                </span>
              </div>

              <div className="flex items-end justify-between">
                <div className="flex-1 text-xs text-slate-400">
                  <p>
                    Assigned by:{' '}
                    <span className="text-slate-300">{task.assignedBy}</span>
                  </p>
                  <p>
                    Due: <span className="text-slate-300">{task.dueAt}</span>
                  </p>
                </div>

                {task.status !== 'completed' && (
                  <div className="text-right ml-4">
                    <p className="text-xs font-semibold mb-1">
                      {task.completionPercentage}%
                    </p>
                    <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
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
        <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-white/40 hover:bg-white/5 transition-all cursor-pointer">
          <p className="text-sm text-slate-400 mb-2">
            Click or drag files to upload
          </p>
          <p className="text-xs text-slate-500">
            Supported: PDF, DOC, DOCX, JPG, PNG (max 10MB)
          </p>
        </div>

        {/* Recent Submissions */}
        {recentSubmissions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h4 className="text-sm font-semibold mb-3">Recent Submissions</h4>
            <div className="space-y-2">
              {recentSubmissions.map((sub) => {
                const getStatusColor = (status: string) => {
                  switch (status) {
                    case 'pending':
                      return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
                    case 'approved':
                      return 'bg-green-500/20 text-green-300 border-green-400/30';
                    case 'rejected':
                      return 'bg-red-500/20 text-red-300 border-red-400/30';
                    default:
                      return 'bg-slate-500/20 text-slate-300';
                  }
                };

                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded bg-white/5"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{sub.title}</p>
                      <p className="text-xs text-slate-400">
                        {sub.submittedAt}
                      </p>
                      {sub.feedback && (
                        <p className="text-xs text-slate-500 mt-1">
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
                          ? '✓ Approved'
                          : '✗ Rejected'}
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
          <p className="text-sm text-slate-400">No training assigned.</p>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{course.title}</h4>
                <span className="text-sm font-bold text-blue-300">
                  {course.completionPercentage}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {course.description}
              </p>
              {course.requiredFor && (
                <p className="text-xs text-amber-300 mb-3">
                  Required for: {course.requiredFor}
                </p>
              )}
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
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

/**
 * Complete employee dashboard
 */
export function EmployeeDashboard({
  employeeName,
  organizationName,
  complianceScore = 0,
  nextAuditDate = '',
  tasksAssigned = 0,
  tasksPending = 0,
}: EmployeeDashboardProps) {
  return (
    <div className="space-y-8">
      <GettingStartedChecklist />

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
