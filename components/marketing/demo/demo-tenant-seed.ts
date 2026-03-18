// =============================================================================
// DEMO TENANT SEED — Reusable fake organisation data mirroring real DB schema
// Used by both simulation mode and interactive sandbox mode
// =============================================================================

// -----------------------------------------------------------------------------
// Core Entity Types (mirrors real database models)
// -----------------------------------------------------------------------------

export interface TenantOrg {
  id: string;
  name: string;
  industry: string;
  plan: 'starter' | 'professional' | 'enterprise';
  createdAt: string;
}

export interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  department: string;
  isActive: boolean;
}

export interface TenantFramework {
  id: string;
  name: string;
  shortName: string;
  controlCount: number;
  compliantCount: number;
  score: number;
  color: string;
  status: 'active' | 'implementing' | 'planned';
}

export interface TenantControl {
  id: string;
  code: string;
  title: string;
  frameworkId: string;
  ownerId: string;
  status: 'compliant' | 'non-compliant' | 'partial' | 'not-assessed';
  evidenceCount: number;
  lastVerified: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface TenantTask {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  status: 'completed' | 'in-progress' | 'overdue' | 'pending';
  priority: 'critical' | 'high' | 'medium' | 'low';
  due: string;
  frameworkId: string;
  controlId: string;
  createdAt: string;
  completedAt: string | null;
}

export interface TenantEvidence {
  id: string;
  name: string;
  description: string;
  category: string;
  uploadedById: string;
  date: string;
  status: 'approved' | 'pending-review' | 'rejected' | 'expired';
  size: string;
  controlIds: string[];
  mimeType: string;
  hash: string;
}

export interface TenantPolicy {
  id: string;
  name: string;
  ownerId: string;
  status: 'active' | 'draft' | 'in-review' | 'expired' | 'archived';
  version: string;
  lastReview: string;
  nextReview: string;
  frameworkId: string;
  approvedById: string | null;
}

export interface TenantAuditEntry {
  id: string;
  action: string;
  userId: string;
  targetType: 'policy' | 'evidence' | 'task' | 'user' | 'control' | 'framework' | 'system' | 'report';
  targetId: string;
  targetName: string;
  timestamp: string;
  metadata: Record<string, string>;
}

export interface TenantWorkflowTrigger {
  id: string;
  name: string;
  type: 'evidence-expiry' | 'control-failure' | 'task-overdue' | 'cert-expiring' | 'policy-review-due';
  targetId: string;
  targetName: string;
  action: string;
  isActive: boolean;
  lastFired: string | null;
  config: Record<string, string>;
}

export interface TenantReport {
  id: string;
  name: string;
  type: 'executive-summary' | 'control-effectiveness' | 'evidence-bundle' | 'risk-register' | 'audit-pack';
  status: 'draft' | 'generating' | 'ready' | 'exported';
  pages: number;
  generatedAt: string | null;
  frameworkId: string | null;
}

export interface TenantKpi {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface TenantComplianceSnapshot {
  date: string;
  overallScore: number;
  frameworkScores: Record<string, number>;
}

// -----------------------------------------------------------------------------
// Full Tenant Seed
// -----------------------------------------------------------------------------

export interface DemoTenantSeed {
  org: TenantOrg;
  users: TenantUser[];
  frameworks: TenantFramework[];
  controls: TenantControl[];
  tasks: TenantTask[];
  evidence: TenantEvidence[];
  policies: TenantPolicy[];
  auditLog: TenantAuditEntry[];
  workflowTriggers: TenantWorkflowTrigger[];
  reports: TenantReport[];
  kpis: TenantKpi[];
  complianceHistory: TenantComplianceSnapshot[];
}

// =============================================================================
// SEED DATA — FormaOS Health Services demo tenant
// =============================================================================

const org: TenantOrg = {
  id: 'org-demo-001',
  name: 'FormaOS Health Services',
  industry: 'Healthcare',
  plan: 'enterprise',
  createdAt: '2025-08-15T09:00:00Z',
};

const users: TenantUser[] = [
  { id: 'u1', name: 'Sarah Chen', email: 'sarah.chen@formaos-health.com.au', role: 'Compliance Officer', avatar: 'SC', department: 'Compliance', isActive: true },
  { id: 'u2', name: 'Marcus Rivera', email: 'marcus.r@formaos-health.com.au', role: 'IT Security Lead', avatar: 'MR', department: 'IT Security', isActive: true },
  { id: 'u3', name: 'Priya Sharma', email: 'priya.s@formaos-health.com.au', role: 'Clinical Governance', avatar: 'PS', department: 'Clinical', isActive: true },
  { id: 'u4', name: 'James Liu', email: 'james.liu@formaos-health.com.au', role: 'Operations Manager', avatar: 'JL', department: 'Operations', isActive: true },
  { id: 'u5', name: 'Emma Wilson', email: 'emma.w@formaos-health.com.au', role: 'Quality Assurance', avatar: 'EW', department: 'Quality', isActive: true },
  { id: 'u6', name: 'David Okonkwo', email: 'david.o@formaos-health.com.au', role: 'Risk Analyst', avatar: 'DO', department: 'Risk', isActive: true },
];

const frameworks: TenantFramework[] = [
  { id: 'fw1', name: 'ISO 27001', shortName: 'ISO', controlCount: 52, compliantCount: 47, score: 91, color: '#06b6d4', status: 'active' },
  { id: 'fw2', name: 'SOC 2 Type II', shortName: 'SOC2', controlCount: 48, compliantCount: 40, score: 84, color: '#3b82f6', status: 'active' },
  { id: 'fw3', name: 'HIPAA', shortName: 'HIPAA', controlCount: 42, compliantCount: 37, score: 88, color: '#8b5cf6', status: 'active' },
];

const controls: TenantControl[] = [
  { id: 'c1', code: 'A.5.1', title: 'Information Security Policy', frameworkId: 'fw1', ownerId: 'u1', status: 'compliant', evidenceCount: 4, lastVerified: '11 Feb 2026', riskLevel: 'low' },
  { id: 'c2', code: 'CC6.1', title: 'Logical Access Controls', frameworkId: 'fw2', ownerId: 'u2', status: 'partial', evidenceCount: 2, lastVerified: '08 Feb 2026', riskLevel: 'medium' },
  { id: 'c3', code: '164.312(a)', title: 'Access Control', frameworkId: 'fw3', ownerId: 'u3', status: 'compliant', evidenceCount: 3, lastVerified: '10 Feb 2026', riskLevel: 'low' },
  { id: 'c4', code: 'A.12.4', title: 'Logging & Monitoring', frameworkId: 'fw1', ownerId: 'u6', status: 'non-compliant', evidenceCount: 0, lastVerified: '—', riskLevel: 'critical' },
  { id: 'c5', code: 'CC7.2', title: 'System Monitoring', frameworkId: 'fw2', ownerId: 'u2', status: 'compliant', evidenceCount: 3, lastVerified: '09 Feb 2026', riskLevel: 'low' },
  { id: 'c6', code: '164.308(a)', title: 'Security Management Process', frameworkId: 'fw3', ownerId: 'u1', status: 'compliant', evidenceCount: 5, lastVerified: '07 Feb 2026', riskLevel: 'low' },
  { id: 'c7', code: 'A.8.1', title: 'Asset Management', frameworkId: 'fw1', ownerId: 'u4', status: 'partial', evidenceCount: 1, lastVerified: '05 Feb 2026', riskLevel: 'medium' },
  { id: 'c8', code: 'CC3.1', title: 'Risk Assessment', frameworkId: 'fw2', ownerId: 'u6', status: 'compliant', evidenceCount: 4, lastVerified: '06 Feb 2026', riskLevel: 'low' },
];

const tasks: TenantTask[] = [
  { id: 't1', title: 'Review Access Control Policy', description: 'Annual review of the access control policy to ensure alignment with ISO 27001 A.9 requirements and current infrastructure.', assigneeId: 'u1', status: 'in-progress', priority: 'high', due: '15 Feb 2026', frameworkId: 'fw1', controlId: 'c1', createdAt: '09 Feb 2026', completedAt: null },
  { id: 't2', title: 'Upload penetration test results', description: 'Upload Q1 external penetration test results from CyberSafe Labs to the evidence vault for SOC 2 compliance.', assigneeId: 'u2', status: 'completed', priority: 'high', due: '10 Feb 2026', frameworkId: 'fw2', controlId: 'c2', createdAt: '01 Feb 2026', completedAt: '10 Feb 2026' },
  { id: 't3', title: 'Update incident response playbook', description: 'Revise the incident response playbook to incorporate new threat scenarios identified in Q4 risk assessment.', assigneeId: 'u6', status: 'overdue', priority: 'high', due: '08 Feb 2026', frameworkId: 'fw1', controlId: 'c4', createdAt: '25 Jan 2026', completedAt: null },
  { id: 't4', title: 'Conduct quarterly risk assessment', description: 'Perform Q1 2026 risk assessment covering all information assets, threats, and vulnerabilities.', assigneeId: 'u6', status: 'in-progress', priority: 'medium', due: '20 Feb 2026', frameworkId: 'fw1', controlId: 'c8', createdAt: '01 Feb 2026', completedAt: null },
  { id: 't5', title: 'Review vendor security questionnaires', description: 'Review and assess completed security questionnaires from 3 critical vendors (AWS, Datadog, Okta).', assigneeId: 'u2', status: 'pending', priority: 'medium', due: '25 Feb 2026', frameworkId: 'fw2', controlId: 'c5', createdAt: '10 Feb 2026', completedAt: null },
  { id: 't6', title: 'Update patient data handling procedures', description: 'Update HIPAA-compliant patient data handling SOPs based on new telehealth workflow requirements.', assigneeId: 'u3', status: 'completed', priority: 'high', due: '05 Feb 2026', frameworkId: 'fw3', controlId: 'c3', createdAt: '15 Jan 2026', completedAt: '05 Feb 2026' },
  { id: 't7', title: 'Schedule staff security training', description: 'Schedule Q1 security awareness training sessions for all departments. Include phishing simulation.', assigneeId: 'u4', status: 'pending', priority: 'low', due: '28 Feb 2026', frameworkId: 'fw1', controlId: 'c1', createdAt: '01 Feb 2026', completedAt: null },
  { id: 't8', title: 'Verify backup recovery procedures', description: 'Execute backup recovery drill and document results. Verify RPO/RTO compliance.', assigneeId: 'u2', status: 'completed', priority: 'medium', due: '03 Feb 2026', frameworkId: 'fw2', controlId: 'c5', createdAt: '20 Jan 2026', completedAt: '03 Feb 2026' },
  { id: 't9', title: 'Audit clinical records access logs', description: 'Review access logs for clinical records systems over the past 30 days for unauthorised access attempts.', assigneeId: 'u3', status: 'in-progress', priority: 'high', due: '18 Feb 2026', frameworkId: 'fw3', controlId: 'c3', createdAt: '05 Feb 2026', completedAt: null },
  { id: 't10', title: 'Update business continuity plan', description: 'Annual review and update of the BCP, incorporating lessons from the November outage drill.', assigneeId: 'u4', status: 'pending', priority: 'medium', due: '01 Mar 2026', frameworkId: 'fw1', controlId: 'c7', createdAt: '10 Feb 2026', completedAt: null },
  { id: 't11', title: 'Review firewall rule changes', description: 'Audit all firewall rule changes made in January. Verify change management process compliance.', assigneeId: 'u2', status: 'overdue', priority: 'high', due: '07 Feb 2026', frameworkId: 'fw2', controlId: 'c2', createdAt: '01 Feb 2026', completedAt: null },
  { id: 't12', title: 'Complete HIPAA training certification', description: 'Complete annual HIPAA privacy and security training certification for all staff with PHI access.', assigneeId: 'u5', status: 'completed', priority: 'medium', due: '01 Feb 2026', frameworkId: 'fw3', controlId: 'c6', createdAt: '10 Jan 2026', completedAt: '01 Feb 2026' },
];

const evidence: TenantEvidence[] = [
  { id: 'e1', name: 'SOC 2 Type II Report', description: 'Annual SOC 2 Type II audit report from Deloitte covering the period Jul 2025 – Dec 2025.', category: 'Audit Reports', uploadedById: 'u2', date: '08 Feb 2026', status: 'approved', size: '2.4 MB', controlIds: ['c2', 'c5'], mimeType: 'application/pdf', hash: 'sha256:a1b2c3d4e5' },
  { id: 'e2', name: 'Penetration Test Results Q1', description: 'External penetration test findings from CyberSafe Labs. 2 medium, 0 critical findings.', category: 'Security Assessments', uploadedById: 'u2', date: '10 Feb 2026', status: 'approved', size: '1.8 MB', controlIds: ['c2'], mimeType: 'application/pdf', hash: 'sha256:f6g7h8i9j0' },
  { id: 'e3', name: 'Staff Training Completion Records', description: 'Q4 2025 security awareness training completion records for all departments.', category: 'Training', uploadedById: 'u4', date: '05 Feb 2026', status: 'approved', size: '890 KB', controlIds: ['c1', 'c6'], mimeType: 'application/pdf', hash: 'sha256:k1l2m3n4o5' },
  { id: 'e4', name: 'HIPAA Risk Assessment 2026', description: 'Annual HIPAA risk assessment covering PHI handling, access controls, and breach preparedness.', category: 'Risk Management', uploadedById: 'u6', date: '01 Feb 2026', status: 'pending-review', size: '3.1 MB', controlIds: ['c3', 'c6'], mimeType: 'application/pdf', hash: 'sha256:p6q7r8s9t0' },
  { id: 'e5', name: 'Access Review Audit Log', description: 'Quarterly user access review for all critical systems. 3 access revocations actioned.', category: 'Access Control', uploadedById: 'u1', date: '28 Jan 2026', status: 'approved', size: '456 KB', controlIds: ['c1', 'c2', 'c3'], mimeType: 'text/csv', hash: 'sha256:u1v2w3x4y5' },
  { id: 'e6', name: 'Incident Response Drill Report', description: 'Results from the January tabletop exercise simulating a ransomware incident.', category: 'Security Assessments', uploadedById: 'u6', date: '22 Jan 2026', status: 'approved', size: '1.2 MB', controlIds: ['c4'], mimeType: 'application/pdf', hash: 'sha256:z6a7b8c9d0' },
  { id: 'e7', name: 'Vendor Security Questionnaire — AWS', description: 'Completed vendor security questionnaire for AWS infrastructure services.', category: 'Vendor Management', uploadedById: 'u2', date: '15 Jan 2026', status: 'pending-review', size: '780 KB', controlIds: ['c5'], mimeType: 'application/pdf', hash: 'sha256:e1f2g3h4i5' },
  { id: 'e8', name: 'Clinical Data Backup Verification', description: 'Monthly backup verification report for clinical data stores. All RPO/RTO targets met.', category: 'Operations', uploadedById: 'u3', date: '12 Jan 2026', status: 'approved', size: '340 KB', controlIds: ['c5', 'c7'], mimeType: 'application/pdf', hash: 'sha256:j6k7l8m9n0' },
];

const policies: TenantPolicy[] = [
  { id: 'p1', name: 'Information Security Policy', ownerId: 'u1', status: 'active', version: '3.2', lastReview: '10 Jan 2026', nextReview: '10 Jul 2026', frameworkId: 'fw1', approvedById: 'u1' },
  { id: 'p2', name: 'Access Control Policy', ownerId: 'u2', status: 'in-review', version: '2.8', lastReview: '15 Nov 2025', nextReview: '15 Feb 2026', frameworkId: 'fw1', approvedById: null },
  { id: 'p3', name: 'Data Retention Policy', ownerId: 'u1', status: 'active', version: '1.5', lastReview: '01 Dec 2025', nextReview: '01 Jun 2026', frameworkId: 'fw2', approvedById: 'u1' },
  { id: 'p4', name: 'Incident Response Policy', ownerId: 'u6', status: 'active', version: '4.0', lastReview: '20 Jan 2026', nextReview: '20 Jul 2026', frameworkId: 'fw1', approvedById: 'u1' },
  { id: 'p5', name: 'Patient Privacy Policy', ownerId: 'u3', status: 'active', version: '2.3', lastReview: '05 Jan 2026', nextReview: '05 Jul 2026', frameworkId: 'fw3', approvedById: 'u1' },
  { id: 'p6', name: 'Acceptable Use Policy', ownerId: 'u4', status: 'draft', version: '1.0-draft', lastReview: '—', nextReview: '01 Mar 2026', frameworkId: 'fw1', approvedById: null },
  { id: 'p7', name: 'Vendor Management Policy', ownerId: 'u2', status: 'active', version: '2.1', lastReview: '12 Dec 2025', nextReview: '12 Jun 2026', frameworkId: 'fw2', approvedById: 'u1' },
  { id: 'p8', name: 'Change Management Policy', ownerId: 'u4', status: 'active', version: '3.0', lastReview: '08 Jan 2026', nextReview: '08 Jul 2026', frameworkId: 'fw1', approvedById: 'u1' },
  { id: 'p9', name: 'PHI Handling Procedures', ownerId: 'u3', status: 'in-review', version: '1.9', lastReview: '01 Oct 2025', nextReview: '01 Feb 2026', frameworkId: 'fw3', approvedById: null },
  { id: 'p10', name: 'Business Continuity Policy', ownerId: 'u6', status: 'expired', version: '2.5', lastReview: '15 Jul 2025', nextReview: '15 Jan 2026', frameworkId: 'fw1', approvedById: 'u1' },
];

const auditLog: TenantAuditEntry[] = [
  { id: 'a1', action: 'Policy approved', userId: 'u1', targetType: 'policy', targetId: 'p1', targetName: 'Information Security Policy', timestamp: '11 Feb 09:14', metadata: { version: '3.2' } },
  { id: 'a2', action: 'Evidence uploaded', userId: 'u2', targetType: 'evidence', targetId: 'e2', targetName: 'Penetration Test Results Q1', timestamp: '10 Feb 16:42', metadata: { size: '1.8 MB' } },
  { id: 'a3', action: 'Task completed', userId: 'u2', targetType: 'task', targetId: 't2', targetName: 'Upload penetration test results', timestamp: '10 Feb 16:38', metadata: {} },
  { id: 'a4', action: 'User invited', userId: 'u1', targetType: 'user', targetId: 'u5', targetName: 'emma.w@formaos-health.com.au', timestamp: '10 Feb 11:20', metadata: { role: 'Quality Assurance' } },
  { id: 'a5', action: 'Evidence approved', userId: 'u1', targetType: 'evidence', targetId: 'e1', targetName: 'SOC 2 Type II Report', timestamp: '09 Feb 14:55', metadata: {} },
  { id: 'a6', action: 'Task assigned', userId: 'u1', targetType: 'task', targetId: 't1', targetName: 'Review Access Control Policy', timestamp: '09 Feb 10:30', metadata: { assignee: 'Sarah Chen' } },
  { id: 'a7', action: 'Compliance score updated', userId: 'system', targetType: 'framework', targetId: 'fw1', targetName: 'ISO 27001 — 91%', timestamp: '08 Feb 23:00', metadata: { previous: '89%', current: '91%' } },
  { id: 'a8', action: 'Policy submitted for review', userId: 'u2', targetType: 'policy', targetId: 'p2', targetName: 'Access Control Policy', timestamp: '08 Feb 15:12', metadata: { version: '2.8' } },
  { id: 'a9', action: 'Task overdue', userId: 'system', targetType: 'task', targetId: 't3', targetName: 'Update incident response playbook', timestamp: '08 Feb 09:00', metadata: { daysOverdue: '1' } },
  { id: 'a10', action: 'Evidence uploaded', userId: 'u4', targetType: 'evidence', targetId: 'e3', targetName: 'Staff Training Completion Records', timestamp: '05 Feb 13:28', metadata: { size: '890 KB' } },
  { id: 'a11', action: 'Task completed', userId: 'u3', targetType: 'task', targetId: 't6', targetName: 'Update patient data handling procedures', timestamp: '05 Feb 11:45', metadata: {} },
  { id: 'a12', action: 'Policy approved', userId: 'u1', targetType: 'policy', targetId: 'p4', targetName: 'Incident Response Policy', timestamp: '04 Feb 16:30', metadata: { version: '4.0' } },
  { id: 'a13', action: 'Risk assessment started', userId: 'u6', targetType: 'evidence', targetId: 'e4', targetName: 'HIPAA Risk Assessment 2026', timestamp: '03 Feb 09:15', metadata: {} },
  { id: 'a14', action: 'Backup verification passed', userId: 'system', targetType: 'system', targetId: 'sys-backup', targetName: 'Clinical Data Backup', timestamp: '02 Feb 03:00', metadata: { rpo: '1h', rto: '4h' } },
  { id: 'a15', action: 'Task completed', userId: 'u5', targetType: 'task', targetId: 't12', targetName: 'Complete HIPAA training certification', timestamp: '01 Feb 14:20', metadata: {} },
];

const workflowTriggers: TenantWorkflowTrigger[] = [
  { id: 'wt1', name: 'Evidence Expiry Alert', type: 'evidence-expiry', targetId: 'e1', targetName: 'SOC 2 Type II Report', action: 'Create review task and notify owner', isActive: true, lastFired: null, config: { daysBeforeExpiry: '30' } },
  { id: 'wt2', name: 'Control Failure Escalation', type: 'control-failure', targetId: 'c4', targetName: 'A.12.4 Logging & Monitoring', action: 'Escalate to IT Security Lead and create remediation task', isActive: true, lastFired: '10 Feb 2026', config: { escalateTo: 'u2' } },
  { id: 'wt3', name: 'Task Overdue Notification', type: 'task-overdue', targetId: 't3', targetName: 'Incident response playbook', action: 'Auto-escalate to manager and send reminder', isActive: true, lastFired: '08 Feb 2026', config: { escalateAfterDays: '1' } },
  { id: 'wt4', name: 'Policy Review Reminder', type: 'policy-review-due', targetId: 'p2', targetName: 'Access Control Policy', action: 'Create review task 14 days before due date', isActive: true, lastFired: '01 Feb 2026', config: { daysBefore: '14' } },
  { id: 'wt5', name: 'Certificate Expiry Check', type: 'cert-expiring', targetId: 'c5', targetName: 'CC7.2 System Monitoring', action: 'Alert IT team and create renewal task', isActive: true, lastFired: null, config: { daysBeforeExpiry: '60' } },
];

const reports: TenantReport[] = [
  { id: 'r1', name: 'Executive Summary', type: 'executive-summary', status: 'ready', pages: 4, generatedAt: '13 Feb 2026', frameworkId: null },
  { id: 'r2', name: 'Control Effectiveness Report', type: 'control-effectiveness', status: 'ready', pages: 12, generatedAt: '13 Feb 2026', frameworkId: null },
  { id: 'r3', name: 'Evidence Bundle Index', type: 'evidence-bundle', status: 'ready', pages: 8, generatedAt: '13 Feb 2026', frameworkId: null },
  { id: 'r4', name: 'Risk Register Export', type: 'risk-register', status: 'ready', pages: 3, generatedAt: '13 Feb 2026', frameworkId: null },
  { id: 'r5', name: 'ISO 27001 Audit Pack', type: 'audit-pack', status: 'draft', pages: 0, generatedAt: null, frameworkId: 'fw1' },
];

const kpis: TenantKpi[] = [
  { id: 'kpi1', label: 'Active Tasks', value: 8, previousValue: 6, unit: 'tasks', trend: 'up' },
  { id: 'kpi2', label: 'Policies', value: 10, previousValue: 10, unit: 'policies', trend: 'neutral' },
  { id: 'kpi3', label: 'Evidence Items', value: 8, previousValue: 5, unit: 'items', trend: 'up' },
  { id: 'kpi4', label: 'Team Members', value: 6, previousValue: 5, unit: 'people', trend: 'up' },
];

const complianceHistory: TenantComplianceSnapshot[] = [
  { date: '2025-09-01', overallScore: 72, frameworkScores: { fw1: 70, fw2: 68, fw3: 78 } },
  { date: '2025-10-01', overallScore: 76, frameworkScores: { fw1: 75, fw2: 72, fw3: 81 } },
  { date: '2025-11-01', overallScore: 81, frameworkScores: { fw1: 82, fw2: 76, fw3: 84 } },
  { date: '2025-12-01', overallScore: 84, frameworkScores: { fw1: 86, fw2: 79, fw3: 86 } },
  { date: '2026-01-01', overallScore: 87, frameworkScores: { fw1: 89, fw2: 82, fw3: 88 } },
  { date: '2026-02-01', overallScore: 92, frameworkScores: { fw1: 91, fw2: 84, fw3: 88 } },
];

// =============================================================================
// Exported Seed
// =============================================================================

export const demoTenant: DemoTenantSeed = {
  org,
  users,
  frameworks,
  controls,
  tasks,
  evidence,
  policies,
  auditLog,
  workflowTriggers,
  reports,
  kpis,
  complianceHistory,
};

// =============================================================================
// Helper: resolve user name by ID
// =============================================================================

export function resolveUser(userId: string): TenantUser | undefined {
  return users.find((u) => u.id === userId);
}

export function resolveUserName(userId: string): string {
  if (userId === 'system') return 'System';
  return resolveUser(userId)?.name ?? 'Unknown';
}

export function resolveFramework(frameworkId: string): TenantFramework | undefined {
  return frameworks.find((f) => f.id === frameworkId);
}
