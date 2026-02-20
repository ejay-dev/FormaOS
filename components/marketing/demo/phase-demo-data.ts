// =============================================================================
// PHASE DEMO DATA — Simulation data for the Four Phases interactive demo
// =============================================================================

import type { DemoAuditEntry } from './demo-data';

export type PhaseId = 'structure' | 'operationalize' | 'validate' | 'defend';

export interface PhaseConfig {
  id: PhaseId;
  number: number;
  title: string;
  verb: string;
  subtitle: string;
  accent: string;
  glowColor: string;
  color: string;
}

export const PHASE_SEQUENCE: PhaseId[] = ['structure', 'operationalize', 'validate', 'defend'];

export const PHASE_CONFIGS: Record<PhaseId, PhaseConfig> = {
  structure: {
    id: 'structure',
    number: 1,
    title: 'Structure',
    verb: 'Model',
    subtitle: 'Model your organisation with governance built in',
    accent: 'from-teal-400 to-emerald-500',
    glowColor: 'rgba(20,184,166,0.15)',
    color: 'teal',
  },
  operationalize: {
    id: 'operationalize',
    number: 2,
    title: 'Operationalize',
    verb: 'Execute',
    subtitle: 'Turn requirements into real execution',
    accent: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(52,211,153,0.15)',
    color: 'emerald',
  },
  validate: {
    id: 'validate',
    number: 3,
    title: 'Validate',
    verb: 'Verify',
    subtitle: 'Continuously verify controls are working',
    accent: 'from-teal-600 to-emerald-600',
    glowColor: 'rgba(20,184,166,0.15)',
    color: 'tealAlt',
  },
  defend: {
    id: 'defend',
    number: 4,
    title: 'Defend',
    verb: 'Prove',
    subtitle: 'Produce audit-ready evidence instantly',
    accent: 'from-amber-500 to-teal-500',
    glowColor: 'rgba(245,158,11,0.15)',
    color: 'amber',
  },
};

// -----------------------------------------------------------------------------
// Phase 1 — Structure
// -----------------------------------------------------------------------------

export const structureFrameworks = [
  { id: 'iso27001', name: 'ISO 27001', controls: 52, color: '#14b8a6' },
  { id: 'soc2', name: 'SOC 2 Type II', controls: 48, color: '#10b981' },
  { id: 'hipaa', name: 'HIPAA', controls: 42, color: '#f59e0b' },
];

export const structureControlMappings = [
  { control: 'A.5.1 Information Security Policy', framework: 'ISO 27001', owner: 'Sarah Chen', status: 'mapped' as const },
  { control: 'CC6.1 Logical Access Controls', framework: 'SOC 2', owner: 'Marcus Rivera', status: 'mapped' as const },
  { control: '164.312(a) Access Control', framework: 'HIPAA', owner: 'Priya Sharma', status: 'mapping' as const },
  { control: 'A.12.4 Logging & Monitoring', framework: 'ISO 27001', owner: 'David Okonkwo', status: 'pending' as const },
];

export const structureRoadmapItems = [
  { phase: 'Week 1–2', task: 'Map org structure & roles', status: 'complete' as const },
  { phase: 'Week 3–4', task: 'Link controls to obligations', status: 'in-progress' as const },
  { phase: 'Week 5–6', task: 'Assign evidence requirements', status: 'pending' as const },
];

// -----------------------------------------------------------------------------
// Phase 2 — Operationalize
// -----------------------------------------------------------------------------

export const operationalizeWorkflowTriggers = [
  { trigger: 'Evidence Expiry', target: 'SOC 2 Type II Report', action: 'Review task created', iconName: 'Clock' as const },
  { trigger: 'Control Failure', target: 'Access Control CC6.1', action: 'Alert escalated', iconName: 'AlertTriangle' as const },
  { trigger: 'Task Overdue', target: 'Incident response playbook', action: 'Auto-escalated to manager', iconName: 'Bell' as const },
];

export const operationalizeTaskAssignments = [
  { id: 'ot1', title: 'Review Access Control Policy', assignee: 'Sarah Chen', framework: 'ISO 27001', priority: 'high' as const },
  { id: 'ot2', title: 'Upload penetration test results', assignee: 'Marcus Rivera', framework: 'SOC 2', priority: 'high' as const },
  { id: 'ot3', title: 'Update patient data handling', assignee: 'Priya Sharma', framework: 'HIPAA', priority: 'medium' as const },
];

export const operationalizeEvidenceUpload = {
  name: 'Penetration Test Results Q1',
  category: 'Security Assessments',
  uploadedBy: 'Marcus Rivera',
  size: '1.8 MB',
};

// -----------------------------------------------------------------------------
// Phase 3 — Validate
// -----------------------------------------------------------------------------

export const validateControlChecks = [
  { control: 'A.5.1 Info Security Policy', framework: 'ISO 27001', status: 'verified' as const, evidenceCount: 4 },
  { control: 'CC6.1 Logical Access', framework: 'SOC 2', status: 'warning' as const, evidenceCount: 2 },
  { control: '164.312(a) Access Control', framework: 'HIPAA', status: 'verified' as const, evidenceCount: 3 },
  { control: 'A.12.4 Logging & Monitoring', framework: 'ISO 27001', status: 'failed' as const, evidenceCount: 0 },
];

export const validateRiskIndicators = [
  { label: 'Critical Gaps', value: 1, trend: 'down' as const, color: 'red' },
  { label: 'Warnings', value: 3, trend: 'down' as const, color: 'amber' },
  { label: 'Verified', value: 138, trend: 'up' as const, color: 'emerald' },
];

export const validateAuditEntries: DemoAuditEntry[] = [
  { id: 'va1', action: 'Control verified', user: 'System', target: 'A.5.1 Info Security Policy', timestamp: '11 Feb 09:14', type: 'compliance' },
  { id: 'va2', action: 'Evidence validated', user: 'Sarah Chen', target: 'Penetration Test Results Q1', timestamp: '10 Feb 16:42', type: 'evidence' },
  { id: 'va3', action: 'Deviation detected', user: 'System', target: 'A.12.4 Logging & Monitoring', timestamp: '10 Feb 14:20', type: 'compliance' },
  { id: 'va4', action: 'Risk assessment updated', user: 'David Okonkwo', target: 'HIPAA Risk Register', timestamp: '10 Feb 11:30', type: 'compliance' },
  { id: 'va5', action: 'Score updated', user: 'System', target: 'ISO 27001 — 89%', timestamp: '10 Feb 09:00', type: 'compliance' },
];

// -----------------------------------------------------------------------------
// Phase 4 — Defend
// -----------------------------------------------------------------------------

export const defendReportSections = [
  { name: 'Executive Summary', pages: 4 },
  { name: 'Control Effectiveness Report', pages: 12 },
  { name: 'Evidence Bundle Index', pages: 8 },
  { name: 'Risk Register Export', pages: 3 },
];

export const defendComplianceHistory = [
  { month: 'Sep', score: 72 },
  { month: 'Oct', score: 76 },
  { month: 'Nov', score: 81 },
  { month: 'Dec', score: 84 },
  { month: 'Jan', score: 87 },
  { month: 'Feb', score: 92 },
];
