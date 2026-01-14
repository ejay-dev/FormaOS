'use client';

import React from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock3,
  User2,
  Calendar,
  Briefcase,
  FileText,
} from 'lucide-react';
import { DashboardSectionCard } from '@/components/dashboard/unified-dashboard-layout';

/**
 * =========================================================
 * EMPLOYER DASHBOARD SECTIONS
 * =========================================================
 * Sections only visible to owner/admin roles
 * Shows organization-wide compliance data and team management
 */

interface EmployerDashboardProps {
  organizationId: string;
  organizationName: string;
  teamMemberCount?: number;
  complianceScore?: number;
  expiringCertsCount?: number;
  openTasksCount?: number;
}

/**
 * Organization health overview
 */
export function OrgHealthOverview({
  teamMemberCount = 0,
  complianceScore = 0,
  expiringCertsCount = 0,
  openTasksCount = 0,
}: {
  teamMemberCount: number;
  complianceScore: number;
  expiringCertsCount: number;
  openTasksCount: number;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Team Members</p>
            <p className="text-3xl font-bold">{teamMemberCount}</p>
          </div>
          <Users className="h-8 w-8 text-blue-400" />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Compliance Score</p>
            <p className="text-3xl font-bold">{complianceScore}%</p>
          </div>
          <TrendingUp className="h-8 w-8 text-green-400" />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Expiring Soon</p>
            <p className="text-3xl font-bold">{expiringCertsCount}</p>
          </div>
          <AlertCircle className="h-8 w-8 text-amber-400" />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Open Tasks</p>
            <p className="text-3xl font-bold">{openTasksCount}</p>
          </div>
          <CheckCircle2 className="h-8 w-8 text-purple-400" />
        </div>
      </div>
    </div>
  );
}

/**
 * Team compliance overview table
 */
export function TeamComplianceTable({
  members = [],
}: {
  members?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    complianceScore: number;
    lastAction?: string;
  }>;
}) {
  return (
    <DashboardSectionCard
      title="Team Compliance"
      description="View employee compliance status and assignments"
      icon={Users}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Employee</th>
              <th className="px-4 py-2 text-left font-semibold">Role</th>
              <th className="px-4 py-2 text-center font-semibold">
                Compliance
              </th>
              <th className="px-4 py-2 text-left font-semibold">Last Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-4 text-center text-slate-400"
                >
                  No team members yet. Invite your first employee.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-2">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2 capitalize">
                    <span className="inline-block px-2 py-1 rounded bg-slate-700/50 text-xs">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2 w-16 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${member.complianceScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold">
                        {member.complianceScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-slate-400">
                    {member.lastAction || 'Never'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Certificates & Licenses expiry table
 */
export function CertificatesExpiry({
  certificates = [],
}: {
  certificates?: Array<{
    id: string;
    title: string;
    employee: string;
    expiresAt: string;
    status: 'active' | 'expiring_soon' | 'expired';
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
      title="Certificates & Licenses"
      description="Track organization-wide certifications"
      icon={FileText}
    >
      <div className="space-y-3">
        {certificates.length === 0 ? (
          <p className="text-sm text-slate-400">No certificates tracked yet.</p>
        ) : (
          certificates.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex-1">
                <p className="font-medium">{cert.title}</p>
                <p className="text-xs text-slate-400">{cert.employee}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm">{cert.expiresAt}</p>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(
                    cert.status,
                  )}`}
                >
                  {cert.status === 'active'
                    ? 'Active'
                    : cert.status === 'expiring_soon'
                      ? 'Expiring Soon'
                      : 'Expired'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Evidence submissions review
 */
export function EvidenceReview({
  submissions = [],
}: {
  submissions?: Array<{
    id: string;
    title: string;
    submittedBy: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  }>;
}) {
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
    <DashboardSectionCard
      title="Evidence Submissions"
      description="Review and approve employee evidence"
      icon={CheckCircle2}
    >
      <div className="space-y-3">
        {submissions.length === 0 ? (
          <p className="text-sm text-slate-400">No pending submissions.</p>
        ) : (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex-1">
                <p className="font-medium">{sub.title}</p>
                <p className="text-xs text-slate-400">
                  {sub.submittedBy} • {sub.submittedAt}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sub.status === 'pending' && (
                  <>
                    <button className="px-3 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors">
                      Approve
                    </button>
                    <button className="px-3 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                      Reject
                    </button>
                  </>
                )}
                {sub.status !== 'pending' && (
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold border ${getStatusColor(
                      sub.status,
                    )}`}
                  >
                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>
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
 * Task management
 */
export function TaskManagement({
  tasks = [],
}: {
  tasks?: Array<{
    id: string;
    title: string;
    assignedTo: string;
    dueAt: string;
    completionRate: number;
  }>;
}) {
  return (
    <DashboardSectionCard
      title="Tasks & Assignments"
      description="Create and track team tasks"
      icon={Briefcase}
    >
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-400">No active tasks.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex-1">
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-slate-400">
                  Assigned to: {task.assignedTo} • Due: {task.dueAt}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold mb-1">
                  {task.completionRate}% Complete
                </div>
                <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${task.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Audit activity log
 */
export function AuditActivityLog({
  activities = [],
}: {
  activities?: Array<{
    id: string;
    action: string;
    actor: string;
    target: string;
    timestamp: string;
  }>;
}) {
  return (
    <DashboardSectionCard
      title="Audit Activity"
      description="Organization activity log"
      icon={Calendar}
    >
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-400">No recent activity.</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 pb-3 border-b border-white/10 last:border-0"
            >
              <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.actor}</span>{' '}
                  {activity.action}{' '}
                  <span className="text-slate-400">{activity.target}</span>
                </p>
                <p className="text-xs text-slate-500">{activity.timestamp}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardSectionCard>
  );
}

/**
 * Complete employer dashboard
 */
export function EmployerDashboard({
  organizationId,
  organizationName,
  teamMemberCount = 0,
  complianceScore = 0,
  expiringCertsCount = 0,
  openTasksCount = 0,
}: EmployerDashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Organization Health</h2>
        <OrgHealthOverview
          teamMemberCount={teamMemberCount}
          complianceScore={complianceScore}
          expiringCertsCount={expiringCertsCount}
          openTasksCount={openTasksCount}
        />
      </div>

      <TeamComplianceTable members={[]} />
      <CertificatesExpiry certificates={[]} />
      <EvidenceReview submissions={[]} />
      <TaskManagement tasks={[]} />
      <AuditActivityLog activities={[]} />
    </div>
  );
}
