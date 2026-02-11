// =============================================================================
// INTERACTIVE DEMO DATA — Single config for all marketing demo components
// =============================================================================

export interface DemoUser {
  name: string;
  role: string;
  avatar: string;
  email: string;
}

export interface DemoTask {
  id: string;
  title: string;
  assignee: string;
  status: 'completed' | 'in-progress' | 'overdue' | 'pending';
  due: string;
  priority: 'high' | 'medium' | 'low';
  framework: string;
}

export interface DemoPolicy {
  id: string;
  name: string;
  owner: string;
  status: 'active' | 'draft' | 'review' | 'expired';
  lastReview: string;
  nextReview: string;
  framework: string;
}

export interface DemoEvidence {
  id: string;
  name: string;
  category: string;
  uploadedBy: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  size: string;
}

export interface DemoAuditEntry {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  type: 'policy' | 'evidence' | 'task' | 'user' | 'system' | 'compliance';
}

export interface DemoNavItem {
  id: string;
  label: string;
  icon: string;
  category: string;
}

// -----------------------------------------------------------------------------
// Organization
// -----------------------------------------------------------------------------

export const demoOrg = {
  name: 'FormaOS Health Services',
  industry: 'Healthcare',
  plan: 'Enterprise',
  complianceScore: 87,
  frameworksActive: 3,
  totalControls: 142,
  compliantControls: 124,
};

// -----------------------------------------------------------------------------
// Users (6 staff)
// -----------------------------------------------------------------------------

export const demoUsers: DemoUser[] = [
  { name: 'Sarah Chen', role: 'Compliance Officer', avatar: 'SC', email: 'sarah.chen@formaos-health.com.au' },
  { name: 'Marcus Rivera', role: 'IT Security Lead', avatar: 'MR', email: 'marcus.r@formaos-health.com.au' },
  { name: 'Priya Sharma', role: 'Clinical Governance', avatar: 'PS', email: 'priya.s@formaos-health.com.au' },
  { name: 'James Liu', role: 'Operations Manager', avatar: 'JL', email: 'james.liu@formaos-health.com.au' },
  { name: 'Emma Wilson', role: 'Quality Assurance', avatar: 'EW', email: 'emma.w@formaos-health.com.au' },
  { name: 'David Okonkwo', role: 'Risk Analyst', avatar: 'DO', email: 'david.o@formaos-health.com.au' },
];

// -----------------------------------------------------------------------------
// Tasks (12 mixed statuses)
// -----------------------------------------------------------------------------

export const demoTasks: DemoTask[] = [
  { id: 't1', title: 'Review Access Control Policy', assignee: 'Sarah Chen', status: 'in-progress', due: '15 Feb 2026', priority: 'high', framework: 'ISO 27001' },
  { id: 't2', title: 'Upload penetration test results', assignee: 'Marcus Rivera', status: 'completed', due: '10 Feb 2026', priority: 'high', framework: 'SOC 2' },
  { id: 't3', title: 'Update incident response playbook', assignee: 'David Okonkwo', status: 'overdue', due: '08 Feb 2026', priority: 'high', framework: 'ISO 27001' },
  { id: 't4', title: 'Conduct quarterly risk assessment', assignee: 'David Okonkwo', status: 'in-progress', due: '20 Feb 2026', priority: 'medium', framework: 'ISO 27001' },
  { id: 't5', title: 'Review vendor security questionnaires', assignee: 'Marcus Rivera', status: 'pending', due: '25 Feb 2026', priority: 'medium', framework: 'SOC 2' },
  { id: 't6', title: 'Update patient data handling procedures', assignee: 'Priya Sharma', status: 'completed', due: '05 Feb 2026', priority: 'high', framework: 'HIPAA' },
  { id: 't7', title: 'Schedule staff security training', assignee: 'James Liu', status: 'pending', due: '28 Feb 2026', priority: 'low', framework: 'ISO 27001' },
  { id: 't8', title: 'Verify backup recovery procedures', assignee: 'Marcus Rivera', status: 'completed', due: '03 Feb 2026', priority: 'medium', framework: 'SOC 2' },
  { id: 't9', title: 'Audit clinical records access logs', assignee: 'Priya Sharma', status: 'in-progress', due: '18 Feb 2026', priority: 'high', framework: 'HIPAA' },
  { id: 't10', title: 'Update business continuity plan', assignee: 'James Liu', status: 'pending', due: '01 Mar 2026', priority: 'medium', framework: 'ISO 27001' },
  { id: 't11', title: 'Review firewall rule changes', assignee: 'Marcus Rivera', status: 'overdue', due: '07 Feb 2026', priority: 'high', framework: 'SOC 2' },
  { id: 't12', title: 'Complete HIPAA training certification', assignee: 'Emma Wilson', status: 'completed', due: '01 Feb 2026', priority: 'medium', framework: 'HIPAA' },
];

// -----------------------------------------------------------------------------
// Policies (10 with owners + review dates)
// -----------------------------------------------------------------------------

export const demoPolicies: DemoPolicy[] = [
  { id: 'p1', name: 'Information Security Policy', owner: 'Sarah Chen', status: 'active', lastReview: '10 Jan 2026', nextReview: '10 Jul 2026', framework: 'ISO 27001' },
  { id: 'p2', name: 'Access Control Policy', owner: 'Marcus Rivera', status: 'review', lastReview: '15 Nov 2025', nextReview: '15 Feb 2026', framework: 'ISO 27001' },
  { id: 'p3', name: 'Data Retention Policy', owner: 'Sarah Chen', status: 'active', lastReview: '01 Dec 2025', nextReview: '01 Jun 2026', framework: 'SOC 2' },
  { id: 'p4', name: 'Incident Response Policy', owner: 'David Okonkwo', status: 'active', lastReview: '20 Jan 2026', nextReview: '20 Jul 2026', framework: 'ISO 27001' },
  { id: 'p5', name: 'Patient Privacy Policy', owner: 'Priya Sharma', status: 'active', lastReview: '05 Jan 2026', nextReview: '05 Jul 2026', framework: 'HIPAA' },
  { id: 'p6', name: 'Acceptable Use Policy', owner: 'James Liu', status: 'draft', lastReview: '—', nextReview: '01 Mar 2026', framework: 'ISO 27001' },
  { id: 'p7', name: 'Vendor Management Policy', owner: 'Marcus Rivera', status: 'active', lastReview: '12 Dec 2025', nextReview: '12 Jun 2026', framework: 'SOC 2' },
  { id: 'p8', name: 'Change Management Policy', owner: 'James Liu', status: 'active', lastReview: '08 Jan 2026', nextReview: '08 Jul 2026', framework: 'ISO 27001' },
  { id: 'p9', name: 'PHI Handling Procedures', owner: 'Priya Sharma', status: 'review', lastReview: '01 Oct 2025', nextReview: '01 Feb 2026', framework: 'HIPAA' },
  { id: 'p10', name: 'Business Continuity Policy', owner: 'David Okonkwo', status: 'expired', lastReview: '15 Jul 2025', nextReview: '15 Jan 2026', framework: 'ISO 27001' },
];

// -----------------------------------------------------------------------------
// Evidence (8 items with categories)
// -----------------------------------------------------------------------------

export const demoEvidence: DemoEvidence[] = [
  { id: 'e1', name: 'SOC 2 Type II Report', category: 'Audit Reports', uploadedBy: 'Marcus Rivera', date: '08 Feb 2026', status: 'approved', size: '2.4 MB' },
  { id: 'e2', name: 'Penetration Test Results Q1', category: 'Security Assessments', uploadedBy: 'Marcus Rivera', date: '10 Feb 2026', status: 'approved', size: '1.8 MB' },
  { id: 'e3', name: 'Staff Training Completion Records', category: 'Training', uploadedBy: 'James Liu', date: '05 Feb 2026', status: 'approved', size: '890 KB' },
  { id: 'e4', name: 'HIPAA Risk Assessment 2026', category: 'Risk Management', uploadedBy: 'David Okonkwo', date: '01 Feb 2026', status: 'pending', size: '3.1 MB' },
  { id: 'e5', name: 'Access Review Audit Log', category: 'Access Control', uploadedBy: 'Sarah Chen', date: '28 Jan 2026', status: 'approved', size: '456 KB' },
  { id: 'e6', name: 'Incident Response Drill Report', category: 'Security Assessments', uploadedBy: 'David Okonkwo', date: '22 Jan 2026', status: 'approved', size: '1.2 MB' },
  { id: 'e7', name: 'Vendor Security Questionnaire — AWS', category: 'Vendor Management', uploadedBy: 'Marcus Rivera', date: '15 Jan 2026', status: 'pending', size: '780 KB' },
  { id: 'e8', name: 'Clinical Data Backup Verification', category: 'Operations', uploadedBy: 'Priya Sharma', date: '12 Jan 2026', status: 'approved', size: '340 KB' },
];

// -----------------------------------------------------------------------------
// Audit Log (15 entries)
// -----------------------------------------------------------------------------

export const demoAuditLog: DemoAuditEntry[] = [
  { id: 'a1', action: 'Policy approved', user: 'Sarah Chen', target: 'Information Security Policy', timestamp: '11 Feb 09:14', type: 'policy' },
  { id: 'a2', action: 'Evidence uploaded', user: 'Marcus Rivera', target: 'Penetration Test Results Q1', timestamp: '10 Feb 16:42', type: 'evidence' },
  { id: 'a3', action: 'Task completed', user: 'Marcus Rivera', target: 'Upload penetration test results', timestamp: '10 Feb 16:38', type: 'task' },
  { id: 'a4', action: 'User invited', user: 'Sarah Chen', target: 'emma.w@formaos-health.com.au', timestamp: '10 Feb 11:20', type: 'user' },
  { id: 'a5', action: 'Evidence approved', user: 'Sarah Chen', target: 'SOC 2 Type II Report', timestamp: '09 Feb 14:55', type: 'evidence' },
  { id: 'a6', action: 'Task assigned', user: 'Sarah Chen', target: 'Review Access Control Policy', timestamp: '09 Feb 10:30', type: 'task' },
  { id: 'a7', action: 'Compliance score updated', user: 'System', target: 'ISO 27001 — 91%', timestamp: '08 Feb 23:00', type: 'compliance' },
  { id: 'a8', action: 'Policy submitted for review', user: 'Marcus Rivera', target: 'Access Control Policy', timestamp: '08 Feb 15:12', type: 'policy' },
  { id: 'a9', action: 'Task overdue', user: 'System', target: 'Update incident response playbook', timestamp: '08 Feb 09:00', type: 'task' },
  { id: 'a10', action: 'Evidence uploaded', user: 'James Liu', target: 'Staff Training Completion Records', timestamp: '05 Feb 13:28', type: 'evidence' },
  { id: 'a11', action: 'Task completed', user: 'Priya Sharma', target: 'Update patient data handling procedures', timestamp: '05 Feb 11:45', type: 'task' },
  { id: 'a12', action: 'Policy approved', user: 'Sarah Chen', target: 'Incident Response Policy', timestamp: '04 Feb 16:30', type: 'policy' },
  { id: 'a13', action: 'Risk assessment started', user: 'David Okonkwo', target: 'HIPAA Risk Assessment 2026', timestamp: '03 Feb 09:15', type: 'compliance' },
  { id: 'a14', action: 'Backup verification passed', user: 'System', target: 'Clinical Data Backup', timestamp: '02 Feb 03:00', type: 'system' },
  { id: 'a15', action: 'Task completed', user: 'Emma Wilson', target: 'Complete HIPAA training certification', timestamp: '01 Feb 14:20', type: 'task' },
];

// -----------------------------------------------------------------------------
// Sidebar Navigation Items
// -----------------------------------------------------------------------------

export const demoNavItems: DemoNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', category: 'Overview' },
  { id: 'policies', label: 'Policies', icon: 'FileText', category: 'Governance' },
  { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', category: 'Governance' },
  { id: 'vault', label: 'Evidence Vault', icon: 'Lock', category: 'Operations' },
  { id: 'people', label: 'People', icon: 'Users', category: 'Operations' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3', category: 'Intelligence' },
  { id: 'audit', label: 'Audit Trail', icon: 'History', category: 'Intelligence' },
  { id: 'settings', label: 'Settings', icon: 'Settings', category: 'System' },
];

export const demoNavCategories = ['Overview', 'Governance', 'Operations', 'Intelligence', 'System'];

export const demoScreenSequence = ['dashboard', 'policies', 'vault', 'audit', 'tasks'] as const;
export type DemoScreenId = (typeof demoScreenSequence)[number];

// -----------------------------------------------------------------------------
// Framework health data
// -----------------------------------------------------------------------------

export const demoFrameworks = [
  { name: 'ISO 27001', score: 91, controls: 52, compliant: 47, color: '#06b6d4' },
  { name: 'SOC 2', score: 84, controls: 48, compliant: 40, color: '#3b82f6' },
  { name: 'HIPAA', score: 88, controls: 42, compliant: 37, color: '#8b5cf6' },
];

// -----------------------------------------------------------------------------
// Dashboard KPIs
// -----------------------------------------------------------------------------

export const demoKpis = [
  { label: 'Active Tasks', value: 8, change: '+2', trend: 'up' as const },
  { label: 'Policies', value: 10, change: '0', trend: 'neutral' as const },
  { label: 'Evidence Items', value: 8, change: '+3', trend: 'up' as const },
  { label: 'Team Members', value: 6, change: '+1', trend: 'up' as const },
];
