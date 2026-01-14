'use client';

import React from 'react';
import {
  Building2,
  Users,
  FileText,
  CheckSquare,
  Shield,
  BarChart3,
  Settings,
  CreditCard,
  ClipboardCheck,
  Briefcase,
  Lock,
} from 'lucide-react';
import { DatabaseRole, MODULE_ACCESS, ModuleId } from '@/lib/roles';

/**
 * =========================================================
 * UNIFIED DASHBOARD LAYOUT
 * =========================================================
 * Single dashboard shell that renders different sections
 * based on user role (employer vs employee)
 *
 * All data is pre-filtered at DB layer via RLS
 * UI components are shown/hidden based on role permissions
 */

interface DashboardLayoutProps {
  userRole: DatabaseRole;
  organizationName: string;
  children: React.ReactNode;
  empSections?: React.ReactNode; // Employer-specific sections
  empAlloc?: React.ReactNode; // Employer allocations
  empStats?: React.ReactNode; // Employer stats
}

interface NavigationItem {
  id: ModuleId;
  label: string;
  icon: React.ElementType;
  description: string;
  href: string;
}

/**
 * Navigation items available by role
 */
const NAVIGATION_ITEMS: Record<DatabaseRole, NavigationItem[]> = {
  owner: [
    {
      id: 'org_overview',
      label: 'Organization',
      icon: Building2,
      description: 'Org overview & KPIs',
      href: '/app/org-overview',
    },
    {
      id: 'team_management',
      label: 'Team',
      icon: Users,
      description: 'Manage employees',
      href: '/app/team',
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: FileText,
      description: 'All certifications',
      href: '/app/certificates',
    },
    {
      id: 'evidence',
      label: 'Evidence',
      icon: CheckSquare,
      description: 'Evidence submissions',
      href: '/app/evidence',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: Briefcase,
      description: 'Create & assign tasks',
      href: '/app/tasks',
    },
    {
      id: 'audit_logs',
      label: 'Audit Logs',
      icon: Shield,
      description: 'Activity history',
      href: '/app/audit-logs',
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      description: 'Plan & subscription',
      href: '/app/billing',
    },
    {
      id: 'admin_settings',
      label: 'Settings',
      icon: Settings,
      description: 'Organization settings',
      href: '/app/settings',
    },
  ],
  admin: [
    {
      id: 'org_overview',
      label: 'Organization',
      icon: Building2,
      description: 'Org overview & KPIs',
      href: '/app/org-overview',
    },
    {
      id: 'team_management',
      label: 'Team',
      icon: Users,
      description: 'Manage employees',
      href: '/app/team',
    },
    {
      id: 'certificates',
      label: 'Certificates',
      icon: FileText,
      description: 'All certifications',
      href: '/app/certificates',
    },
    {
      id: 'evidence',
      label: 'Evidence',
      icon: CheckSquare,
      description: 'Evidence submissions',
      href: '/app/evidence',
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: Briefcase,
      description: 'Create & assign tasks',
      href: '/app/tasks',
    },
    {
      id: 'audit_logs',
      label: 'Audit Logs',
      icon: Shield,
      description: 'Activity history',
      href: '/app/audit-logs',
    },
    {
      id: 'admin_settings',
      label: 'Settings',
      icon: Settings,
      description: 'Organization settings',
      href: '/app/settings',
    },
  ],
  member: [
    {
      id: 'my_compliance',
      label: 'My Compliance',
      icon: ClipboardCheck,
      description: 'Your compliance status',
      href: '/app/my-compliance',
    },
    {
      id: 'my_certificates',
      label: 'My Certificates',
      icon: FileText,
      description: 'Your certifications',
      href: '/app/my-certificates',
    },
    {
      id: 'my_tasks',
      label: 'My Tasks',
      icon: CheckSquare,
      description: 'Assigned tasks',
      href: '/app/my-tasks',
    },
    {
      id: 'my_evidence',
      label: 'My Evidence',
      icon: CheckSquare,
      description: 'Your submissions',
      href: '/app/my-evidence',
    },
    {
      id: 'training',
      label: 'Training',
      icon: Briefcase,
      description: 'Learning modules',
      href: '/app/training',
    },
  ],
  viewer: [
    {
      id: 'my_compliance',
      label: 'My Compliance',
      icon: ClipboardCheck,
      description: 'Your compliance status',
      href: '/app/my-compliance',
    },
    {
      id: 'my_certificates',
      label: 'My Certificates',
      icon: FileText,
      description: 'Your certifications',
      href: '/app/my-certificates',
    },
    {
      id: 'my_evidence',
      label: 'My Evidence',
      icon: CheckSquare,
      description: 'Your submissions',
      href: '/app/my-evidence',
    },
    {
      id: 'training',
      label: 'Training',
      icon: Briefcase,
      description: 'Learning modules',
      href: '/app/training',
    },
  ],
};

/**
 * Node visualization component
 */
function NodeBadge({ module, role }: { module: ModuleId; role: DatabaseRole }) {
  const state = MODULE_ACCESS[role][module];

  const stateStyles = {
    active: 'bg-green-500/20 border-green-400/30 text-green-300',
    restricted: 'bg-amber-500/20 border-amber-400/30 text-amber-300',
    locked: 'bg-slate-500/10 border-slate-400/20 text-slate-400',
    loading: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
  };

  const stateLabels = {
    active: '✓ Active',
    restricted: '⚠ Limited',
    locked: '🔒 Locked',
    loading: '⟳ Loading',
  };

  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-semibold border ${stateStyles[state]}`}
    >
      {stateLabels[state]}
    </span>
  );
}

/**
 * Main unified dashboard layout
 */
export function UnifiedDashboardLayout({
  userRole,
  organizationName,
  children,
  empSections,
  empAlloc,
  empStats,
}: DashboardLayoutProps) {
  const navItems = NAVIGATION_ITEMS[userRole];
  const isEmployer = userRole === 'owner' || userRole === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">{organizationName}</h1>
            <p className="text-sm text-slate-400">
              {isEmployer ? 'Employer Dashboard' : 'Employee Dashboard'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Role</p>
            <p className="text-lg font-semibold capitalize">{userRole}</p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-white/10 bg-slate-900/50">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const state = MODULE_ACCESS[userRole][item.id];
              const isLocked = state === 'locked';

              return (
                <a
                  key={item.id}
                  href={isLocked ? '#' : item.href}
                  onClick={(e) => {
                    if (isLocked) e.preventDefault();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isLocked
                      ? 'cursor-not-allowed opacity-50 hover:bg-transparent'
                      : 'hover:bg-white/10 active:bg-white/20'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                  {isLocked && <Lock className="h-4 w-4" />}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Role-specific content */}
            {isEmployer && empSections ? (
              <div className="space-y-8">{empSections}</div>
            ) : (
              <div className="space-y-8">{children}</div>
            )}
          </div>
        </main>
      </div>

      {/* Module Access Debug Panel (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 max-w-xs rounded-lg bg-slate-900 p-4 border border-slate-700 text-xs text-slate-300">
          <p className="font-bold mb-2">📊 Role: {userRole}</p>
          <div className="space-y-1">
            {navItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span>{item.label}</span>
                <NodeBadge module={item.id} role={userRole} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Quick access card for dashboard sections
 */
export function DashboardSectionCard({
  title,
  description,
  icon: Icon,
  children,
  locked = false,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children?: React.ReactNode;
  locked?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 transition-all ${
        locked
          ? 'border-slate-700/50 bg-slate-900/30 opacity-50'
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <Icon
          className={`h-6 w-6 ${locked ? 'text-slate-500' : 'text-white'}`}
        />
      </div>
      {!locked && children}
      {locked && (
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <Lock className="h-3 w-3" /> This feature is not available for your
          role.
        </p>
      )}
    </div>
  );
}
