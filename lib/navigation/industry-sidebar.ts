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
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  category: string;
  testId?: string;
}

export type IndustryType =
  | 'ndis'
  | 'healthcare'
  | 'aged_care'
  | 'childcare'
  | 'community_services'
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
    name: 'Progress Notes',
    href: '/app/progress-notes',
    icon: NotebookPen,
    category: 'Care Operations',
    testId: 'nav-progress-notes',
  },
  {
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Care Operations',
    testId: 'nav-incidents',
  },

  // Workforce
  {
    name: 'Staff Compliance',
    href: '/app/staff-compliance',
    icon: UserCheck,
    category: 'Workforce',
    testId: 'nav-staff-compliance',
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
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Registers',
    testId: 'nav-vault',
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
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Clinical',
    testId: 'nav-incidents',
  },

  // Workforce
  {
    name: 'Staff Credentials',
    href: '/app/staff-compliance',
    icon: UserCheck,
    category: 'Workforce',
    testId: 'nav-staff-credentials',
  },
  {
    name: 'Team',
    href: '/app/team',
    icon: Users,
    category: 'Workforce',
    testId: 'nav-team',
  },

  // Compliance
  {
    name: 'Registers',
    href: '/app/registers',
    icon: ClipboardList,
    category: 'Compliance',
    testId: 'nav-registers',
  },
  {
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Compliance',
    testId: 'nav-vault',
  },
  {
    name: 'Reports',
    href: '/app/reports',
    icon: BarChart3,
    category: 'Compliance',
    testId: 'nav-reports',
  },
  {
    name: 'Executive View',
    href: '/app/executive',
    icon: Shield,
    category: 'Compliance',
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
    name: 'Incidents',
    href: '/app/incidents',
    icon: AlertTriangle,
    category: 'Resident Care',
    testId: 'nav-incidents',
  },

  // Workforce
  {
    name: 'Staff Compliance',
    href: '/app/staff-compliance',
    icon: UserCheck,
    category: 'Workforce',
    testId: 'nav-staff-compliance',
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
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Registers',
    testId: 'nav-vault',
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
  {
    name: 'Policies',
    href: '/app/policies',
    icon: FileText,
    category: 'Governance',
    testId: 'nav-policies',
  },
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
  },
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
    name: 'Evidence Vault',
    href: '/app/vault',
    icon: Lock,
    category: 'Operations',
    testId: 'nav-vault',
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
    href: '/app/audit',
    icon: History,
    category: 'Intelligence',
    testId: 'nav-audit',
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
    name: 'Tasks',
    href: '/app/tasks',
    icon: CheckSquare,
    category: 'Operations',
    testId: 'nav-tasks',
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
    case 'healthcare':
      navigation = HEALTHCARE_NAV;
      break;
    case 'aged_care':
      navigation = AGED_CARE_NAV;
      break;
    default:
      navigation = DEFAULT_ADMIN_NAV;
  }

  // Extract unique categories in order
  const categories = [...new Set(navigation.map((item) => item.category))];

  return { navigation, categories };
}

/**
 * Check if industry is a care industry (NDIS, Healthcare, Aged Care)
 */
export function isCareIndustry(industry: string | null | undefined): boolean {
  return (
    industry === 'ndis' || industry === 'healthcare' || industry === 'aged_care'
  );
}

/**
 * Get display label for industry
 */
export function getIndustryLabel(industry: string | null | undefined): string {
  switch (industry) {
    case 'ndis':
      return 'NDIS Provider';
    case 'healthcare':
      return 'Healthcare';
    case 'aged_care':
      return 'Aged Care';
    case 'childcare':
      return 'Childcare';
    case 'community_services':
      return 'Community Services';
    default:
      return 'Organization';
  }
}
