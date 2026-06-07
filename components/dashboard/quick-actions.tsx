'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  AlertTriangle,
  Calendar,
  FileText,
  Building2,
  Shield,
  CreditCard,
  Settings,
  CheckSquare,
  HeartPulse,
  Home,
  Baby,
  UserCheck,
  NotebookPen,
  Lock,
  ClipboardList,
  Landmark,
  Laptop,
  Briefcase,
  type LucideIcon,
} from 'lucide-react';

export interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
}

export const INDUSTRY_QUICK_ACTIONS: Record<string, QuickAction[]> = {
  ndis: [
    {
      label: 'Participants',
      description: 'Manage participant records',
      href: '/app/participants',
      icon: Users,
      color: 'text-muted-foreground',
    },
    {
      label: 'Service Delivery',
      description: 'Visits & service logs',
      href: '/app/visits',
      icon: Calendar,
      color: 'text-muted-foreground',
    },
    {
      label: 'Incidents',
      description: 'Report & investigate',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-muted-foreground',
    },
    {
      label: 'Staff Compliance',
      description: 'Worker screening & checks',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-muted-foreground',
    },
    {
      label: 'Progress Notes',
      description: 'Participant progress',
      href: '/app/progress-notes',
      icon: NotebookPen,
      color: 'text-muted-foreground',
    },
    {
      label: 'Evidence Vault',
      description: 'Evidence submissions',
      href: '/app/vault',
      icon: Lock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Reports',
      description: 'Compliance reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Settings',
      description: 'Organization settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  healthcare: [
    {
      label: 'Patients',
      description: 'Patient records & status',
      href: '/app/participants',
      icon: HeartPulse,
      color: 'text-muted-foreground',
    },
    {
      label: 'Appointments',
      description: 'Schedule & track',
      href: '/app/visits',
      icon: Calendar,
      color: 'text-muted-foreground',
    },
    {
      label: 'Clinical Notes',
      description: 'Clinical documentation',
      href: '/app/progress-notes',
      icon: NotebookPen,
      color: 'text-muted-foreground',
    },
    {
      label: 'Staff Credentials',
      description: 'AHPRA & registrations',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-muted-foreground',
    },
    {
      label: 'Incidents',
      description: 'Clinical incidents',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-muted-foreground',
    },
    {
      label: 'Evidence Vault',
      description: 'Evidence & artifacts',
      href: '/app/vault',
      icon: Lock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Reports',
      description: 'Accreditation reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Settings',
      description: 'Practice settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  aged_care: [
    {
      label: 'Residents',
      description: 'Resident records',
      href: '/app/participants',
      icon: Home,
      color: 'text-muted-foreground',
    },
    {
      label: 'Care Plans',
      description: 'Care plan management',
      href: '/app/care-plans',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Service Logs',
      description: 'Daily service logs',
      href: '/app/visits',
      icon: Calendar,
      color: 'text-muted-foreground',
    },
    {
      label: 'Incidents',
      description: 'SIRS reporting',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-muted-foreground',
    },
    {
      label: 'Staff Compliance',
      description: 'Staff credentials',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-muted-foreground',
    },
    {
      label: 'Progress Notes',
      description: 'Resident notes',
      href: '/app/progress-notes',
      icon: NotebookPen,
      color: 'text-muted-foreground',
    },
    {
      label: 'Evidence Vault',
      description: 'Audit evidence',
      href: '/app/vault',
      icon: Lock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Settings',
      description: 'Facility settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  childcare: [
    {
      label: 'Children',
      description: 'Enrollment & records',
      href: '/app/participants',
      icon: Baby,
      color: 'text-muted-foreground',
    },
    {
      label: 'Safety Checks',
      description: 'Daily safety inspections',
      href: '/app/registers',
      icon: Shield,
      color: 'text-muted-foreground',
    },
    {
      label: 'Educator Compliance',
      description: 'WWCC & qualifications',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-muted-foreground',
    },
    {
      label: 'Incidents',
      description: 'Incident reports',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-muted-foreground',
    },
    {
      label: 'Progress Notes',
      description: 'Developmental notes',
      href: '/app/progress-notes',
      icon: NotebookPen,
      color: 'text-muted-foreground',
    },
    {
      label: 'Evidence Vault',
      description: 'NQF evidence',
      href: '/app/vault',
      icon: Lock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Reports',
      description: 'Quality reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Settings',
      description: 'Center settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  community_services: [
    {
      label: 'Clients',
      description: 'Client records',
      href: '/app/participants',
      icon: Users,
      color: 'text-muted-foreground',
    },
    {
      label: 'Service Delivery',
      description: 'Service sessions',
      href: '/app/visits',
      icon: Calendar,
      color: 'text-muted-foreground',
    },
    {
      label: 'Incidents',
      description: 'Report incidents',
      href: '/app/incidents',
      icon: AlertTriangle,
      color: 'text-muted-foreground',
    },
    {
      label: 'Staff Compliance',
      description: 'Staff checks',
      href: '/app/staff-compliance',
      icon: UserCheck,
      color: 'text-muted-foreground',
    },
    {
      label: 'Evidence Vault',
      description: 'Compliance evidence',
      href: '/app/vault',
      icon: Lock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Tasks',
      description: 'Compliance tasks',
      href: '/app/tasks',
      icon: CheckSquare,
      color: 'text-muted-foreground',
    },
    {
      label: 'Reports',
      description: 'Funding reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Settings',
      description: 'Organization settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  financial_services: [
    {
      label: 'Organization',
      description: 'Overview & KPIs',
      href: '/app/executive',
      icon: Landmark,
      color: 'text-muted-foreground',
    },
    {
      label: 'Policies',
      description: 'Regulatory policies',
      href: '/app/policies',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Risk Registers',
      description: 'Risk & asset registers',
      href: '/app/registers',
      icon: ClipboardList,
      color: 'text-muted-foreground',
    },
    {
      label: 'Tasks',
      description: 'Compliance tasks',
      href: '/app/tasks',
      icon: CheckSquare,
      color: 'text-muted-foreground',
    },
    {
      label: 'Evidence Vault',
      description: 'Audit evidence',
      href: '/app/vault',
      icon: Lock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Team',
      description: 'Manage team',
      href: '/app/team',
      icon: Users,
      color: 'text-muted-foreground',
    },
    {
      label: 'Reports',
      description: 'Compliance reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Settings',
      description: 'Organization settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  saas_technology: [
    {
      label: 'Organization',
      description: 'Overview & KPIs',
      href: '/app/executive',
      icon: Building2,
      color: 'text-muted-foreground',
    },
    {
      label: 'Policies',
      description: 'SOC 2 / ISO policies',
      href: '/app/policies',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Asset Inventory',
      description: 'Asset & risk registers',
      href: '/app/registers',
      icon: Laptop,
      color: 'text-muted-foreground',
    },
    {
      label: 'Control Tasks',
      description: 'Security controls',
      href: '/app/tasks',
      icon: CheckSquare,
      color: 'text-muted-foreground',
    },
    {
      label: 'Evidence Vault',
      description: 'Audit artifacts',
      href: '/app/vault',
      icon: Lock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Team',
      description: 'Manage team',
      href: '/app/team',
      icon: Users,
      color: 'text-muted-foreground',
    },
    {
      label: 'Reports',
      description: 'Framework reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Settings',
      description: 'Organization settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
  enterprise: [
    {
      label: 'Organization',
      description: 'Multi-site overview',
      href: '/app/executive',
      icon: Building2,
      color: 'text-muted-foreground',
    },
    {
      label: 'Policies',
      description: 'Enterprise policies',
      href: '/app/policies',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Registers',
      description: 'All registers',
      href: '/app/registers',
      icon: ClipboardList,
      color: 'text-muted-foreground',
    },
    {
      label: 'Tasks',
      description: 'Task management',
      href: '/app/tasks',
      icon: CheckSquare,
      color: 'text-muted-foreground',
    },
    {
      label: 'Evidence Vault',
      description: 'Evidence chain',
      href: '/app/vault',
      icon: Lock,
      color: 'text-muted-foreground',
    },
    {
      label: 'Team',
      description: 'Workforce management',
      href: '/app/team',
      icon: Users,
      color: 'text-muted-foreground',
    },
    {
      label: 'Reports',
      description: 'Executive reports',
      href: '/app/reports',
      icon: FileText,
      color: 'text-muted-foreground',
    },
    {
      label: 'Settings',
      description: 'Enterprise settings',
      href: '/app/settings',
      icon: Settings,
      color: 'text-muted-foreground',
    },
  ],
};

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Organization',
    description: 'Overview & KPIs',
    href: '/app/executive',
    icon: Building2,
    color: 'text-muted-foreground',
  },
  {
    label: 'Team',
    description: 'Manage employees',
    href: '/app/team',
    icon: Users,
    color: 'text-muted-foreground',
  },
  {
    label: 'Certificates',
    description: 'All certifications',
    href: '/app/certificates',
    icon: FileText,
    color: 'text-muted-foreground',
  },
  {
    label: 'Evidence',
    description: 'Evidence submissions',
    href: '/app/vault',
    icon: CheckSquare,
    color: 'text-muted-foreground',
  },
  {
    label: 'Tasks',
    description: 'Create & assign',
    href: '/app/tasks',
    icon: Briefcase,
    color: 'text-muted-foreground',
  },
  {
    label: 'Audit Logs',
    description: 'Activity history',
    href: '/app/audit-trail',
    icon: Shield,
    color: 'text-muted-foreground',
  },
  {
    label: 'Billing',
    description: 'Plan & subscription',
    href: '/app/billing',
    icon: CreditCard,
    color: 'text-muted-foreground',
  },
  {
    label: 'Settings',
    description: 'Organization settings',
    href: '/app/settings',
    icon: Settings,
    color: 'text-muted-foreground',
  },
];

export function QuickActions({ industry }: { industry?: string | null }) {
  const actions =
    (industry && INDUSTRY_QUICK_ACTIONS[industry]) || DEFAULT_QUICK_ACTIONS;
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-4 gap-2"
      data-testid="quick-actions"
    >
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex items-center gap-2.5 rounded-lg border border-border bg-card p-3 transition-all hover:bg-accent/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className={`h-4 w-4 shrink-0 ${a.color}`} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {a.label}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {a.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
