/**
 * Industry-Specific Sidebar Navigation
 *
 * Each industry has its own menu structure optimized for their workflows.
 * Falls back to default navigation for non-care industries.
 */

import {
  LayoutDashboard,
  Users,
  Calendar,
  NotebookPen,
  AlertTriangle,
  Shield,
  FileText,
  BarChart3,
  Settings,
  CheckSquare,
  Lock,
  ClipboardList,
  HeartPulse,
  UserCheck,
  Stethoscope,
  Home,
  Laptop,
  History,
  Mail,
  Baby,
  Landmark,
  Building2,
  ShieldCheck,
  Bot,
  FormInput,
  Receipt,
  type LucideIcon,
} from 'lucide-react';

export interface NavSubItem {
  name: string;
  href: string;
  testId?: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  category: string;
  testId?: string;
  /** Key for RAG indicator dot — maps to compliance store status */
  ragKey?: 'obligations' | 'incidents' | 'evidence' | 'staff' | 'policies';
  /** Show count badge (e.g. "My Tasks" count) */
  badgeKey?: 'tasks';
  /** Expandable sub-items shown when this route is active */
  children?: NavSubItem[];
}

export type IndustryType =
  | 'ndis'
  | 'mental_health'
  | 'healthcare'
  | 'aged_care'
  | 'childcare'
  | 'community_services'
  | 'financial_services'
  | 'saas_technology'
  | 'enterprise'
  | 'other'
  | 'default';

// =========================================================
// NDIS PROVIDER SIDEBAR
// =========================================================
export const NDIS_NAV: NavItem[] = [
  // Overview
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
      {
        name: 'Cross-Map',
        href: '/app/compliance/cross-map',
        testId: 'nav-cross-map',
      },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Care Operations
  {
    name: 'Participants',
    href: '/app/participants',
    icon: Users,
    category: 'Care Operations',
    testId: 'nav-participants',
  },
  {
    name: 'Service Delivery',
    href: '/app/visits',
    icon: Calendar,
    category: 'Care Operations',
    testId: 'nav-visits',
  },
  {
    name: 'Care Plans',
    href: '/app/care-plans',
    icon: ClipboardList,
    category: 'Care Operations',
    testId: 'nav-care-plans',
  },
  {
    name: 'NDIS Claiming',
    href: '/app/ndis-claiming',
    icon: Receipt,
    category: 'Care Operations',
    testId: 'nav-ndis-claiming',
  },
  {
    name: 'Progress Notes',
    href: '/app/progress-notes',
    icon: NotebookPen,
    category: 'Care Operations',
    testId: 'nav-progress-notes',
  },
  {
    name: 'Behaviour Support',
    href: '/app/behaviour-support-plans',
    icon: FileText,
    category: 'Care Operations',
    testId: 'nav-behaviour-support-plans',
  },
  {
    name: 'Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Care Operations',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Care Operations',
    testId: 'nav-incidents',
    ragKey: 'incidents',
  },

  // Workforce
  {
    name: 'Staff Compliance',
    href: '/app/staff-compliance',
    icon: UserCheck,
    category: 'Workforce',
    testId: 'nav-staff-compliance',
    ragKey: 'staff',
  },
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Workforce',
    testId: 'nav-team',
  },

  // Registers & Reports
  {
    name: 'Registers',
    href: '/app/registers',
    icon: ClipboardList,
    category: 'Registers',
    testId: 'nav-registers',
  },
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Registers',
    testId: 'nav-forms',
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Reports',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Shield,
    category: 'Reports',
    testId: 'nav-executive',
  },

  // System
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
];

// =========================================================
// MENTAL HEALTH SERVICES SIDEBAR
// =========================================================
export const MENTAL_HEALTH_NAV: NavItem[] = [
  // Overview
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
      {
        name: 'Cross-Map',
        href: '/app/compliance/cross-map',
        testId: 'nav-cross-map',
      },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Care Operations
  {
    name: 'Consumers',
    href: '/app/participants',
    icon: Users,
    category: 'Care Operations',
    testId: 'nav-consumers',
  },
  {
    name: 'Service Delivery',
    href: '/app/visits',
    icon: Calendar,
    category: 'Care Operations',
    testId: 'nav-visits',
  },
  {
    name: 'Progress Notes',
    href: '/app/progress-notes',
    icon: NotebookPen,
    category: 'Care Operations',
    testId: 'nav-progress-notes',
  },
  {
    name: 'Care Plans',
    href: '/app/care-plans',
    icon: HeartPulse,
    category: 'Care Operations',
    testId: 'nav-care-plans',
  },
  {
    name: 'Behaviour Support',
    href: '/app/behaviour-support-plans',
    icon: FileText,
    category: 'Care Operations',
    testId: 'nav-behaviour-support-plans',
  },
  {
    name: 'Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Care Operations',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Care Operations',
    testId: 'nav-incidents',
    ragKey: 'incidents',
  },

  // Workforce
  {
    name: 'Staff Compliance',
    href: '/app/staff-compliance',
    icon: UserCheck,
    category: 'Workforce',
    testId: 'nav-staff-compliance',
    ragKey: 'staff',
  },
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Workforce',
    testId: 'nav-team',
  },

  // Registers & Reports
  {
    name: 'Registers',
    href: '/app/registers',
    icon: ClipboardList,
    category: 'Registers',
    testId: 'nav-registers',
  },
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Registers',
    testId: 'nav-forms',
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Reports',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Shield,
    category: 'Reports',
    testId: 'nav-executive',
  },

  // System
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
];

// =========================================================
// HEALTHCARE SIDEBAR
// =========================================================
export const HEALTHCARE_NAV: NavItem[] = [
  // Overview
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Clinical
  {
    name: 'Patients',
    href: '/app/participants',
    icon: HeartPulse,
    category: 'Clinical',
    testId: 'nav-patients',
  },
  {
    name: 'Appointments',
    href: '/app/visits',
    icon: Calendar,
    category: 'Clinical',
    testId: 'nav-appointments',
  },
  {
    name: 'Clinical Notes',
    href: '/app/progress-notes',
    icon: Stethoscope,
    category: 'Clinical',
    testId: 'nav-clinical-notes',
  },
  {
    name: 'Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Clinical',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Clinical',
    testId: 'nav-incidents',
    ragKey: 'incidents',
  },

  // Workforce
  {
    name: 'Staff Credentials',
    href: '/app/staff-compliance',
    icon: UserCheck,
    category: 'Workforce',
    testId: 'nav-staff-credentials',
    ragKey: 'staff',
  },
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Workforce',
    testId: 'nav-team',
  },

  // Registers & Reports
  {
    name: 'Registers',
    href: '/app/registers',
    icon: ClipboardList,
    category: 'Registers',
    testId: 'nav-registers',
  },
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Registers',
    testId: 'nav-forms',
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Reports',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Shield,
    category: 'Reports',
    testId: 'nav-executive',
  },

  // System
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
];

// =========================================================
// AGED CARE SIDEBAR
// =========================================================
export const AGED_CARE_NAV: NavItem[] = [
  // Overview
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Resident Care
  {
    name: 'Residents',
    href: '/app/participants',
    icon: Home,
    category: 'Resident Care',
    testId: 'nav-residents',
  },
  {
    name: 'Care Plans',
    href: '/app/care-plans',
    icon: FileText,
    category: 'Resident Care',
    testId: 'nav-care-plans',
  },
  {
    name: 'Service Logs',
    href: '/app/visits',
    icon: Calendar,
    category: 'Resident Care',
    testId: 'nav-service-logs',
  },
  {
    name: 'Progress Notes',
    href: '/app/progress-notes',
    icon: NotebookPen,
    category: 'Resident Care',
    testId: 'nav-progress-notes',
  },
  {
    name: 'Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Resident Care',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Resident Care',
    testId: 'nav-incidents',
    ragKey: 'incidents',
  },

  // Workforce
  {
    name: 'Staff Compliance',
    href: '/app/staff-compliance',
    icon: UserCheck,
    category: 'Workforce',
    testId: 'nav-staff-compliance',
    ragKey: 'staff',
  },
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Workforce',
    testId: 'nav-team',
  },

  // Registers & Reports
  {
    name: 'Registers',
    href: '/app/registers',
    icon: ClipboardList,
    category: 'Registers',
    testId: 'nav-registers',
  },
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Registers',
    testId: 'nav-forms',
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Reports',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Shield,
    category: 'Reports',
    testId: 'nav-executive',
  },

  // System
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
];

// =========================================================
// CHILDCARE SIDEBAR
// =========================================================
export const CHILDCARE_NAV: NavItem[] = [
  // Overview
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Child Safety
  {
    name: 'Children',
    href: '/app/participants',
    icon: Baby,
    category: 'Child Safety',
    testId: 'nav-children',
  },
  {
    name: 'Safety Checks',
    href: '/app/registers',
    icon: Shield,
    category: 'Child Safety',
    testId: 'nav-safety-checks',
  },
  {
    name: 'Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Child Safety',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Child Safety',
    testId: 'nav-incidents',
    ragKey: 'incidents',
  },
  {
    name: 'Progress Notes',
    href: '/app/progress-notes',
    icon: NotebookPen,
    category: 'Child Safety',
    testId: 'nav-progress-notes',
  },

  // Workforce
  {
    name: 'Educator Compliance',
    href: '/app/staff-compliance',
    icon: UserCheck,
    category: 'Workforce',
    testId: 'nav-educator-compliance',
    ragKey: 'staff',
  },
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Workforce',
    testId: 'nav-team',
  },

  // Reports
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Reports',
    testId: 'nav-forms',
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Reports',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Shield,
    category: 'Reports',
    testId: 'nav-executive',
  },

  // System
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
];

// =========================================================
// COMMUNITY SERVICES SIDEBAR
// =========================================================
export const COMMUNITY_SERVICES_NAV: NavItem[] = [
  // Overview
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Service Delivery
  {
    name: 'Clients',
    href: '/app/participants',
    icon: Users,
    category: 'Service Delivery',
    testId: 'nav-clients',
  },
  {
    name: 'Service Sessions',
    href: '/app/visits',
    icon: Calendar,
    category: 'Service Delivery',
    testId: 'nav-service-sessions',
  },
  {
    name: 'Progress Notes',
    href: '/app/progress-notes',
    icon: NotebookPen,
    category: 'Service Delivery',
    testId: 'nav-progress-notes',
  },
  {
    name: 'Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Service Delivery',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Service Delivery',
    testId: 'nav-incidents',
    ragKey: 'incidents',
  },

  // Workforce
  {
    name: 'Staff Compliance',
    href: '/app/staff-compliance',
    icon: UserCheck,
    category: 'Workforce',
    testId: 'nav-staff-compliance',
    ragKey: 'staff',
  },
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Workforce',
    testId: 'nav-team',
  },

  // Registers & Reports
  {
    name: 'Registers',
    href: '/app/registers',
    icon: ClipboardList,
    category: 'Registers',
    testId: 'nav-registers',
  },
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Registers',
    testId: 'nav-forms',
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Reports',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Shield,
    category: 'Reports',
    testId: 'nav-executive',
  },

  // System
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
];

// =========================================================
// FINANCIAL SERVICES SIDEBAR
// =========================================================
export const FINANCIAL_SERVICES_NAV: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
      {
        name: 'Cross-Map',
        href: '/app/compliance/cross-map',
        testId: 'nav-cross-map',
      },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Governance
  {
    name: 'Risk Registers',
    href: '/app/registers',
    icon: ClipboardList,
    category: 'Governance',
    testId: 'nav-registers',
  },
  {
    name: 'Compliance Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Governance',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Governance',
    testId: 'nav-incidents',
    ragKey: 'incidents',
  },

  // Operations
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Operations',
    testId: 'nav-team',
  },
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Operations',
    testId: 'nav-forms',
  },

  // Intelligence
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Intelligence',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Landmark,
    category: 'Intelligence',
    testId: 'nav-executive',
  },
  {
    name: 'Audit Trail',
    href: '/app/audit-trail',
    icon: History,
    category: 'Intelligence',
    testId: 'nav-audit',
  },

  // System
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
];

// =========================================================
// SAAS / TECHNOLOGY SIDEBAR
// =========================================================
export const SAAS_TECHNOLOGY_NAV: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
      {
        name: 'Cross-Map',
        href: '/app/compliance/cross-map',
        testId: 'nav-cross-map',
      },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Governance
  {
    name: 'Asset Inventory',
    href: '/app/registers',
    icon: Laptop,
    category: 'Governance',
    testId: 'nav-assets',
  },
  {
    name: 'Control Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Governance',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },

  // Operations
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Operations',
    testId: 'nav-team',
  },
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Operations',
    testId: 'nav-forms',
  },

  // Intelligence
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Intelligence',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Shield,
    category: 'Intelligence',
    testId: 'nav-executive',
  },
  {
    name: 'Audit Trail',
    href: '/app/audit-trail',
    icon: History,
    category: 'Intelligence',
    testId: 'nav-audit',
  },

  // Certification
  {
    name: 'SOC 2 Readiness',
    href: '/app/compliance/soc2',
    icon: ShieldCheck,
    category: 'Certification',
    testId: 'nav-soc2',
  },
  {
    name: 'AI Assistant',
    href: '/app/settings/ai',
    icon: Bot,
    category: 'Certification',
    testId: 'nav-ai-assistant',
  },

  // System
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
];

// =========================================================
// ENTERPRISE / MULTI-SITE SIDEBAR
// =========================================================
export const ENTERPRISE_NAV: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
      {
        name: 'Cross-Map',
        href: '/app/compliance/cross-map',
        testId: 'nav-cross-map',
      },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Governance
  {
    name: 'Registers',
    href: '/app/registers',
    icon: ClipboardList,
    category: 'Governance',
    testId: 'nav-registers',
  },
  {
    name: 'Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Governance',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Governance',
    testId: 'nav-incidents',
    ragKey: 'incidents',
  },

  // Operations
  {
    name: 'People',
    href: '/app/people',
    icon: Users,
    category: 'Operations',
    testId: 'nav-people',
  },
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Operations',
    testId: 'nav-team',
  },
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Operations',
    testId: 'nav-forms',
  },

  // Intelligence
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Intelligence',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Building2,
    category: 'Intelligence',
    testId: 'nav-executive',
  },
  {
    name: 'Audit Trail',
    href: '/app/audit-trail',
    icon: History,
    category: 'Intelligence',
    testId: 'nav-audit',
  },

  // Certification
  {
    name: 'SOC 2 Readiness',
    href: '/app/compliance/soc2',
    icon: ShieldCheck,
    category: 'Certification',
    testId: 'nav-soc2',
  },
  {
    name: 'AI Assistant',
    href: '/app/settings/ai',
    icon: Bot,
    category: 'Certification',
    testId: 'nav-ai-assistant',
  },

  // System
  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
];

// =========================================================
// DEFAULT/GENERIC SIDEBAR (for non-care industries)
// =========================================================
export const DEFAULT_ADMIN_NAV: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },

  // Compliance
  {
    name: 'Obligations',
    href: '/app/compliance',
    icon: ShieldCheck,
    category: 'Compliance',
    testId: 'nav-obligations',
    ragKey: 'obligations',
    children: [
      {
        name: 'Frameworks',
        href: '/app/compliance/frameworks',
        testId: 'nav-frameworks',
      },
      { name: 'Controls', href: '/app/controls', testId: 'nav-controls' },
      {
        name: 'Cross-Map',
        href: '/app/compliance/cross-map',
        testId: 'nav-cross-map',
      },
    ],
  },
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Compliance',
    testId: 'nav-policies',
    ragKey: 'policies',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
    ragKey: 'evidence',
  },

  // Governance
  {
    name: 'Registers',
    href: '/app/registers',
    icon: Laptop,
    category: 'Governance',
    testId: 'nav-registers',
  },
  {
    name: 'Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Governance',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Governance',
    testId: 'nav-incidents',
    ragKey: 'incidents',
  },

  // Operations
  {
    name: 'People',
    href: '/app/people',
    icon: Users,
    category: 'Operations',
    testId: 'nav-people',
  },
  {
    name: 'Patients',
    href: '/app/patients',
    icon: HeartPulse,
    category: 'Operations',
    testId: 'nav-patients',
  },
  {
    name: 'Progress Notes',
    href: '/app/progress-notes',
    icon: NotebookPen,
    category: 'Operations',
    testId: 'nav-progress-notes',
  },
  {
    name: 'Forms',
    href: '/app/forms',
    icon: FormInput,
    category: 'Operations',
    testId: 'nav-forms',
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Intelligence',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Shield,
    category: 'Intelligence',
    testId: 'nav-executive',
  },
  {
    name: 'Audit Trail',
    href: '/app/audit-trail',
    icon: History,
    category: 'Intelligence',
    testId: 'nav-audit',
  },

  // Certification
  {
    name: 'SOC 2 Readiness',
    href: '/app/compliance/soc2',
    icon: ShieldCheck,
    category: 'Certification',
    testId: 'nav-soc2',
  },
  {
    name: 'AI Assistant',
    href: '/app/settings/ai',
    icon: Bot,
    category: 'Certification',
    testId: 'nav-ai-assistant',
  },

  {
    name: 'Settings',
    href: '/app/settings',
    icon: Settings,
    category: 'System',
    testId: 'nav-settings',
  },
  {
    name: 'Email Preferences',
    href: '/app/settings/email-preferences',
    icon: Mail,
    category: 'System',
    testId: 'nav-email',
  },
];

// =========================================================
// STAFF NAV (restricted view for staff role)
// =========================================================
export const STAFF_NAV: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/app/staff',
    icon: LayoutDashboard,
    category: 'Overview',
    testId: 'nav-dashboard',
  },
  {
    name: 'My Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Operations',
    testId: 'nav-tasks',
    badgeKey: 'tasks',
  },
  {
    name: 'My Clients',
    href: '/app/participants',
    icon: Users,
    category: 'Operations',
    testId: 'nav-clients',
  },
  {
    name: 'My Visits',
    href: '/app/visits',
    icon: Calendar,
    category: 'Operations',
    testId: 'nav-visits',
  },
  {
    name: 'Progress Notes',
    href: '/app/progress-notes',
    icon: NotebookPen,
    category: 'Operations',
    testId: 'nav-progress-notes',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Operations',
    testId: 'nav-vault',
  },
];

// =========================================================
// NAVIGATION RESOLVER
// =========================================================

/**
 * Get the appropriate navigation based on industry and role
 */
/**
 * v4-031: orphan-route discovery map.
 *
 * Audit found 15 pages under /app/* that exist as real routes (most
 * 100-300 LOC with proper data fetches) but appeared in zero industry
 * sidebars — only reachable by typing the URL. Rather than top-level
 * promoting them (sidebar noise) or deleting them (destructive),
 * surface them as `children` on their natural parent nav item. Sub-
 * nav already renders when the parent route is active.
 *
 * Keyed by parent `href` so this applies cleanly across all 8 industry
 * navs without 8x duplication. New orphan routes added later should
 * extend this map, not the per-industry nav exports.
 */
const ORPHAN_ROUTE_CHILDREN: Record<string, NavSubItem[]> = {
  '/app': [{ name: 'Builder', href: '/app/dashboard/builder' }],
  '/app/care-plans': [
    { name: 'Plan Journey', href: '/app/care-plans/journey' },
  ],
  '/app/controls': [{ name: 'Journey View', href: '/app/controls/journey' }],
  '/app/incidents': [
    { name: 'Analytics', href: '/app/incidents/analytics' },
    // CAPA is a full module (list, detail, entitlement gate) whose only
    // desktop entry point was a link from an individual incident.
    { name: 'CAPA', href: '/app/capa' },
  ],
  // The board and calendar views linked only to each other, so neither was
  // reachable from anywhere a user starts.
  '/app/tasks': [
    { name: 'Board', href: '/app/tasks/board' },
    { name: 'Calendar', href: '/app/tasks/calendar' },
  ],
  '/app/reports': [
    { name: 'Trends', href: '/app/reports/trends' },
    { name: 'Custom Reports', href: '/app/reports/custom' },
  ],
  '/app/executive': [
    { name: 'Group View', href: '/app/executive/group' },
  ],
  '/app/policies': [
    { name: 'Version History', href: '/app/policies/versions' },
  ],
  '/app/registers': [
    { name: 'Training Register', href: '/app/registers/training' },
  ],
  '/app/participants': [
    { name: 'Import', href: '/app/participants/import' },
  ],
  '/app/settings': [
    { name: 'Notifications', href: '/app/settings/notifications' },
    { name: 'Integrations', href: '/app/settings/integrations' },
    { name: 'Auditor Access', href: '/app/settings/auditor-access' },
    { name: 'Email History', href: '/app/settings/email-history' },
    { name: 'Executive Digest', href: '/app/settings/executive-digest' },
  ],
};

function withOrphanChildren(navigation: NavItem[]): NavItem[] {
  return navigation.map((item) => {
    const extra = ORPHAN_ROUTE_CHILDREN[item.href];
    if (!extra) return item;
    const existingHrefs = new Set((item.children ?? []).map((c) => c.href));
    const merged = [
      ...(item.children ?? []),
      ...extra.filter((c) => !existingHrefs.has(c.href)),
    ];
    return { ...item, children: merged };
  });
}

export function getIndustryNavigation(
  industry: string | null | undefined,
  role: string,
): { navigation: NavItem[]; categories: string[] } {
  // Staff role gets limited navigation regardless of industry
  if (role === 'staff' || role === 'member' || role === 'viewer') {
    const categories = [...new Set(STAFF_NAV.map((item) => item.category))];
    return { navigation: STAFF_NAV, categories };
  }

  // Select navigation based on industry
  let navigation: NavItem[];

  switch (industry) {
    case 'ndis':
      navigation = NDIS_NAV;
      break;
    case 'mental_health':
      navigation = MENTAL_HEALTH_NAV;
      break;
    case 'healthcare':
      navigation = HEALTHCARE_NAV;
      break;
    case 'aged_care':
      navigation = AGED_CARE_NAV;
      break;
    case 'childcare':
      navigation = CHILDCARE_NAV;
      break;
    case 'community_services':
      navigation = COMMUNITY_SERVICES_NAV;
      break;
    case 'financial_services':
      navigation = FINANCIAL_SERVICES_NAV;
      break;
    case 'saas_technology':
      navigation = SAAS_TECHNOLOGY_NAV;
      break;
    case 'enterprise':
      navigation = ENTERPRISE_NAV;
      break;
    default:
      navigation = DEFAULT_ADMIN_NAV;
  }

  // v4-031: surface previously-orphan routes via parent sub-nav.
  navigation = withOrphanChildren(navigation);

  // Extract unique categories in order
  const categories = [...new Set(navigation.map((item) => item.category))];

  return { navigation, categories };
}

/**
 * Check if industry is a care industry (NDIS, Healthcare, Aged Care)
 */
export function isCareIndustry(industry: string | null | undefined): boolean {
  return (
    industry === 'ndis' ||
    industry === 'mental_health' ||
    industry === 'healthcare' ||
    industry === 'aged_care' ||
    industry === 'childcare' ||
    industry === 'community_services'
  );
}

/**
 * Get display label for industry
 */
export function getIndustryLabel(industry: string | null | undefined): string {
  switch (industry) {
    case 'ndis':
      return 'NDIS Provider';
    case 'mental_health':
      return 'Mental Health Services';
    case 'healthcare':
      return 'Healthcare';
    case 'aged_care':
      return 'Aged Care';
    case 'childcare':
      return 'Childcare';
    case 'community_services':
      return 'Community Services';
    case 'financial_services':
      return 'Financial Services';
    case 'saas_technology':
      return 'SaaS / Technology';
    case 'enterprise':
      return 'Enterprise';
    case 'other':
      return 'General Compliance';
    default:
      return 'Organization';
  }
}
