'use client';

/**
 * ProductLiveDemo — Interactive in-page FormaOS app demo for /product
 *
 * Renders a mocked app shell (sidebar + topbar + content) with fake seeded data.
 * Fully interactive: tab switching, search, sort, row detail drawer, toast feedback.
 * No screenshots, no API calls, no WebGL.
 */

import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard, ListChecks, FileText, Shield, BarChart3,
  AlertTriangle, BookOpen, Search, X, ChevronDown, ArrowUpDown,
  Download, Plus, Check,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   TYPES & VIEW CONFIG
   ═══════════════════════════════════════════════════════════════════════ */

type ViewId = 'dashboard' | 'tasks' | 'evidence' | 'controls' | 'reports' | 'risk' | 'policies';

interface ViewMeta {
  id: ViewId;
  label: string;
  icon: typeof LayoutDashboard;
  accent: string;
  dotCls: string;
}

const VIEWS: ViewMeta[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, accent: 'teal', dotCls: 'bg-teal-400' },
  { id: 'tasks', label: 'Tasks', icon: ListChecks, accent: 'blue', dotCls: 'bg-blue-400' },
  { id: 'evidence', label: 'Evidence', icon: FileText, accent: 'amber', dotCls: 'bg-amber-400' },
  { id: 'controls', label: 'Controls', icon: Shield, accent: 'emerald', dotCls: 'bg-emerald-400' },
  { id: 'reports', label: 'Reports', icon: BarChart3, accent: 'indigo', dotCls: 'bg-indigo-400' },
  { id: 'risk', label: 'Risk', icon: AlertTriangle, accent: 'red', dotCls: 'bg-red-400' },
  { id: 'policies', label: 'Policies', icon: BookOpen, accent: 'rose', dotCls: 'bg-rose-400' },
];

const VIEW_MAP = Object.fromEntries(VIEWS.map((v) => [v.id, v])) as Record<ViewId, ViewMeta>;

/* ═══════════════════════════════════════════════════════════════════════
   MOCK DATA — realistic GRC/compliance data
   ═══════════════════════════════════════════════════════════════════════ */

// Status badge styling helper
const B = {
  prog: 'bg-teal-400/15 text-teal-300',
  pend: 'bg-amber-400/15 text-amber-300',
  done: 'bg-emerald-400/15 text-emerald-300',
  rev: 'bg-blue-400/15 text-blue-300',
  over: 'bg-red-400/15 text-red-300',
  draft: 'bg-slate-400/15 text-slate-300',
  crit: 'bg-red-400/15 text-red-300',
  high: 'bg-orange-400/15 text-orange-300',
  med: 'bg-amber-400/15 text-amber-300',
  low: 'bg-emerald-400/15 text-emerald-300',
} as const;

interface TaskItem { id: string; title: string; status: string; cls: string; assignee: string; due: string; }
const TASKS: TaskItem[] = [
  { id: 'T01', title: 'Review SOC 2 Type II controls', status: 'In Progress', cls: B.prog, assignee: 'AK', due: 'Feb 28' },
  { id: 'T02', title: 'Upload penetration test report', status: 'Pending', cls: B.pend, assignee: 'SM', due: 'Mar 1' },
  { id: 'T03', title: 'Map ISO 27001 Annex A controls', status: 'Complete', cls: B.done, assignee: 'JR', due: 'Feb 15' },
  { id: 'T04', title: 'Vendor risk assessment — Stripe', status: 'In Review', cls: B.rev, assignee: 'LW', due: 'Feb 22' },
  { id: 'T05', title: 'Incident response plan update', status: 'In Progress', cls: B.prog, assignee: 'TP', due: 'Mar 5' },
  { id: 'T06', title: 'Update data retention policy', status: 'Pending', cls: B.pend, assignee: 'AK', due: 'Mar 10' },
  { id: 'T07', title: 'Conduct access review — Q1', status: 'Overdue', cls: B.over, assignee: 'NM', due: 'Feb 10' },
  { id: 'T08', title: 'Update BCP documentation', status: 'In Progress', cls: B.prog, assignee: 'SM', due: 'Mar 15' },
  { id: 'T09', title: 'Review firewall change requests', status: 'Complete', cls: B.done, assignee: 'TP', due: 'Feb 12' },
  { id: 'T10', title: 'Complete security awareness training', status: 'In Progress', cls: B.prog, assignee: 'JR', due: 'Feb 28' },
  { id: 'T11', title: 'Validate backup restore procedures', status: 'Pending', cls: B.pend, assignee: 'LW', due: 'Mar 8' },
  { id: 'T12', title: 'Remediate vulnerability scan findings', status: 'In Progress', cls: B.prog, assignee: 'AK', due: 'Feb 25' },
  { id: 'T13', title: 'Draft board compliance report — Q1', status: 'Draft', cls: B.draft, assignee: 'SM', due: 'Mar 20' },
  { id: 'T14', title: 'Update endpoint protection config', status: 'Complete', cls: B.done, assignee: 'TP', due: 'Feb 8' },
  { id: 'T15', title: 'Review third-party SLA agreements', status: 'Pending', cls: B.pend, assignee: 'NM', due: 'Mar 12' },
  { id: 'T16', title: 'Conduct tabletop IR exercise', status: 'In Progress', cls: B.prog, assignee: 'JR', due: 'Mar 1' },
  { id: 'T17', title: 'Evaluate SIEM alert thresholds', status: 'In Review', cls: B.rev, assignee: 'LW', due: 'Feb 20' },
  { id: 'T18', title: 'Complete NDIS audit preparation', status: 'In Progress', cls: B.prog, assignee: 'AK', due: 'Mar 5' },
  { id: 'T19', title: 'Update asset classification matrix', status: 'Pending', cls: B.pend, assignee: 'SM', due: 'Mar 15' },
  { id: 'T20', title: 'Review password policy compliance', status: 'Complete', cls: B.done, assignee: 'TP', due: 'Feb 18' },
  { id: 'T21', title: 'Map Essential Eight maturity level', status: 'In Progress', cls: B.prog, assignee: 'NM', due: 'Feb 28' },
  { id: 'T22', title: 'Audit privileged access accounts', status: 'Overdue', cls: B.over, assignee: 'JR', due: 'Feb 5' },
  { id: 'T23', title: 'Update network segmentation docs', status: 'Draft', cls: B.draft, assignee: 'LW', due: 'Mar 10' },
  { id: 'T24', title: 'Review DLP rule effectiveness', status: 'Pending', cls: B.pend, assignee: 'AK', due: 'Mar 8' },
  { id: 'T25', title: 'Prepare for external ISO audit', status: 'In Progress', cls: B.prog, assignee: 'SM', due: 'Mar 20' },
  { id: 'T26', title: 'Test disaster recovery runbook', status: 'In Review', cls: B.rev, assignee: 'TP', due: 'Feb 22' },
  { id: 'T27', title: 'Implement MFA for remaining admins', status: 'In Progress', cls: B.prog, assignee: 'NM', due: 'Feb 25' },
  { id: 'T28', title: 'Document data flow diagrams', status: 'Pending', cls: B.pend, assignee: 'JR', due: 'Mar 12' },
  { id: 'T29', title: 'Review cloud security configurations', status: 'Complete', cls: B.done, assignee: 'LW', due: 'Feb 14' },
  { id: 'T30', title: 'Conduct vendor security questionnaire', status: 'In Progress', cls: B.prog, assignee: 'AK', due: 'Mar 1' },
];

interface EvidenceItem { id: string; name: string; type: string; size: string; date: string; tag: string; }
const EVIDENCE: EvidenceItem[] = [
  { id: 'E01', name: 'SOC2-AuditLog-2026Q1.pdf', type: 'PDF', size: '2.4 MB', date: 'Feb 14', tag: 'SOC 2' },
  { id: 'E02', name: 'PenTest-Report-External.pdf', type: 'PDF', size: '5.1 MB', date: 'Feb 10', tag: 'SOC 2' },
  { id: 'E03', name: 'AccessReview-Jan2026.xlsx', type: 'XLSX', size: '890 KB', date: 'Feb 8', tag: 'Access' },
  { id: 'E04', name: 'IncidentResponse-Runbook-v3.md', type: 'MD', size: '124 KB', date: 'Feb 5', tag: 'IR' },
  { id: 'E05', name: 'VendorDueDiligence-Stripe.pdf', type: 'PDF', size: '1.8 MB', date: 'Feb 1', tag: 'Vendor' },
  { id: 'E06', name: 'DataClassification-Matrix.xlsx', type: 'XLSX', size: '340 KB', date: 'Jan 28', tag: 'Data' },
  { id: 'E07', name: 'SecurityAwareness-Completion.csv', type: 'CSV', size: '56 KB', date: 'Jan 25', tag: 'Training' },
  { id: 'E08', name: 'FirewallConfig-Prod-v12.json', type: 'JSON', size: '18 KB', date: 'Jan 22', tag: 'Network' },
  { id: 'E09', name: 'BackupRestoreTest-Jan2026.pdf', type: 'PDF', size: '1.2 MB', date: 'Jan 20', tag: 'BCP' },
  { id: 'E10', name: 'EndpointProtection-Dashboard.png', type: 'PNG', size: '445 KB', date: 'Jan 18', tag: 'Endpoint' },
  { id: 'E11', name: 'ISO27001-CertificateOfCompliance.pdf', type: 'PDF', size: '820 KB', date: 'Jan 15', tag: 'ISO 27001' },
  { id: 'E12', name: 'ChangeManagement-Log-Q4.xlsx', type: 'XLSX', size: '1.5 MB', date: 'Jan 12', tag: 'Change' },
  { id: 'E13', name: 'VulnScan-Results-Feb2026.pdf', type: 'PDF', size: '3.2 MB', date: 'Feb 12', tag: 'Vuln' },
  { id: 'E14', name: 'SIEM-AlertSummary-Weekly.pdf', type: 'PDF', size: '780 KB', date: 'Feb 9', tag: 'SIEM' },
  { id: 'E15', name: 'MFA-EnrollmentStatus.xlsx', type: 'XLSX', size: '210 KB', date: 'Feb 7', tag: 'Access' },
  { id: 'E16', name: 'PhishingSimulation-Results.pdf', type: 'PDF', size: '1.1 MB', date: 'Feb 4', tag: 'Training' },
  { id: 'E17', name: 'NetworkDiagram-Prod-v8.vsdx', type: 'VSDX', size: '2.8 MB', date: 'Feb 1', tag: 'Network' },
  { id: 'E18', name: 'DLP-PolicyViolations-Jan.csv', type: 'CSV', size: '92 KB', date: 'Jan 30', tag: 'DLP' },
  { id: 'E19', name: 'CloudSecurityPosture-AWS.pdf', type: 'PDF', size: '4.5 MB', date: 'Jan 27', tag: 'Cloud' },
  { id: 'E20', name: 'PrivilegedAccess-Audit-Q4.xlsx', type: 'XLSX', size: '670 KB', date: 'Jan 24', tag: 'Access' },
  { id: 'E21', name: 'DisasterRecovery-TestResults.pdf', type: 'PDF', size: '2.1 MB', date: 'Jan 21', tag: 'BCP' },
  { id: 'E22', name: 'ThirdPartyRisk-Assessment-Acme.pdf', type: 'PDF', size: '1.4 MB', date: 'Jan 18', tag: 'Vendor' },
  { id: 'E23', name: 'DataFlowDiagram-CustomerData.pdf', type: 'PDF', size: '960 KB', date: 'Jan 15', tag: 'Data' },
  { id: 'E24', name: 'PatchManagement-Status-Feb.xlsx', type: 'XLSX', size: '380 KB', date: 'Feb 11', tag: 'Patch' },
  { id: 'E25', name: 'BoardReport-Compliance-Q4.pdf', type: 'PDF', size: '3.8 MB', date: 'Jan 10', tag: 'Board' },
  { id: 'E26', name: 'EncryptionStandards-Review.md', type: 'MD', size: '86 KB', date: 'Jan 8', tag: 'Crypto' },
  { id: 'E27', name: 'AssetInventory-Complete-2026.xlsx', type: 'XLSX', size: '1.9 MB', date: 'Jan 5', tag: 'Assets' },
  { id: 'E28', name: 'NDIS-PracticeStandards-Map.pdf', type: 'PDF', size: '2.6 MB', date: 'Jan 2', tag: 'NDIS' },
  { id: 'E29', name: 'EssentialEight-MaturityAssessment.pdf', type: 'PDF', size: '1.7 MB', date: 'Dec 28', tag: 'E8' },
  { id: 'E30', name: 'PasswordPolicy-Compliance-Scan.csv', type: 'CSV', size: '145 KB', date: 'Dec 25', tag: 'Access' },
  { id: 'E31', name: 'LogRetention-Configuration.json', type: 'JSON', size: '12 KB', date: 'Dec 22', tag: 'Logging' },
  { id: 'E32', name: 'WAF-RulesetReview-Q4.pdf', type: 'PDF', size: '1.3 MB', date: 'Dec 20', tag: 'Network' },
  { id: 'E33', name: 'UserAccessMatrix-Production.xlsx', type: 'XLSX', size: '520 KB', date: 'Dec 18', tag: 'Access' },
  { id: 'E34', name: 'SecurityIncident-IR2026-001.pdf', type: 'PDF', size: '890 KB', date: 'Dec 15', tag: 'IR' },
  { id: 'E35', name: 'ComplianceTraining-Transcripts.zip', type: 'ZIP', size: '8.4 MB', date: 'Dec 12', tag: 'Training' },
  { id: 'E36', name: 'APISecurityReview-v2.pdf', type: 'PDF', size: '2.2 MB', date: 'Dec 10', tag: 'AppSec' },
  { id: 'E37', name: 'VendorSecurityQuestionnaire-AWS.pdf', type: 'PDF', size: '1.6 MB', date: 'Dec 8', tag: 'Vendor' },
  { id: 'E38', name: 'DatabaseEncryption-AuditLog.csv', type: 'CSV', size: '230 KB', date: 'Dec 5', tag: 'Crypto' },
  { id: 'E39', name: 'MobileDevice-ManagementPolicy.pdf', type: 'PDF', size: '740 KB', date: 'Dec 3', tag: 'MDM' },
  { id: 'E40', name: 'ContainerSecurity-ScanResults.pdf', type: 'PDF', size: '3.1 MB', date: 'Dec 1', tag: 'Cloud' },
];

interface ControlItem { id: string; code: string; name: string; status: string; cls: string; framework: string; }
const CONTROLS: ControlItem[] = [
  { id: 'C01', code: 'CC6.1', name: 'Logical Access Controls', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C02', code: 'CC7.2', name: 'System Monitoring', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C03', code: 'A.8.1', name: 'Asset Inventory', status: 'Partial', cls: B.pend, framework: 'ISO 27001' },
  { id: 'C04', code: 'A.12.4', name: 'Logging & Monitoring', status: 'Mapped', cls: B.done, framework: 'ISO 27001' },
  { id: 'C05', code: 'CC3.1', name: 'Risk Assessment Process', status: 'Unmapped', cls: B.over, framework: 'SOC 2' },
  { id: 'C06', code: 'A.9.2', name: 'User Access Management', status: 'Mapped', cls: B.done, framework: 'ISO 27001' },
  { id: 'C07', code: 'CC6.2', name: 'Authentication Mechanisms', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C08', code: 'CC6.3', name: 'Role-Based Access', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C09', code: 'A.14.1', name: 'Secure Development', status: 'Partial', cls: B.pend, framework: 'ISO 27001' },
  { id: 'C10', code: 'CC7.1', name: 'Vulnerability Management', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C11', code: 'A.11.2', name: 'Equipment Security', status: 'Mapped', cls: B.done, framework: 'ISO 27001' },
  { id: 'C12', code: 'CC8.1', name: 'Change Management', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C13', code: 'A.7.2', name: 'During Employment', status: 'Mapped', cls: B.done, framework: 'ISO 27001' },
  { id: 'C14', code: 'CC9.1', name: 'Risk Mitigation', status: 'Partial', cls: B.pend, framework: 'SOC 2' },
  { id: 'C15', code: 'A.18.1', name: 'Legal Compliance', status: 'Mapped', cls: B.done, framework: 'ISO 27001' },
  { id: 'C16', code: 'CC6.6', name: 'Boundary Protection', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C17', code: 'A.10.1', name: 'Cryptographic Controls', status: 'Mapped', cls: B.done, framework: 'ISO 27001' },
  { id: 'C18', code: 'CC6.7', name: 'Data Transmission Security', status: 'Unmapped', cls: B.over, framework: 'SOC 2' },
  { id: 'C19', code: 'A.16.1', name: 'Incident Management', status: 'Mapped', cls: B.done, framework: 'ISO 27001' },
  { id: 'C20', code: 'CC7.3', name: 'Security Event Evaluation', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C21', code: 'A.12.3', name: 'Backup Management', status: 'Partial', cls: B.pend, framework: 'ISO 27001' },
  { id: 'C22', code: 'CC3.2', name: 'Risk Treatment', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C23', code: 'A.6.1', name: 'Internal Organisation', status: 'Mapped', cls: B.done, framework: 'ISO 27001' },
  { id: 'C24', code: 'CC5.2', name: 'Control Activities', status: 'Mapped', cls: B.done, framework: 'SOC 2' },
  { id: 'C25', code: 'A.15.1', name: 'Supplier Relationships', status: 'Partial', cls: B.pend, framework: 'ISO 27001' },
];

interface ReportItem { id: string; name: string; status: string; cls: string; date: string; pages: number; }
const REPORTS: ReportItem[] = [
  { id: 'R01', name: 'Board Readiness Report — Q1 2026', status: 'Final', cls: B.done, date: 'Feb 15', pages: 24 },
  { id: 'R02', name: 'SOC 2 Type II Gap Analysis', status: 'Draft', cls: B.draft, date: 'Feb 12', pages: 18 },
  { id: 'R03', name: 'Vendor Risk Summary — Q1', status: 'Final', cls: B.done, date: 'Feb 8', pages: 12 },
  { id: 'R04', name: 'Incident Response Metrics', status: 'In Review', cls: B.rev, date: 'Feb 5', pages: 9 },
  { id: 'R05', name: 'Quarterly Compliance Digest', status: 'Final', cls: B.done, date: 'Jan 31', pages: 16 },
  { id: 'R06', name: 'ISO 27001 Readiness Assessment', status: 'Final', cls: B.done, date: 'Jan 25', pages: 22 },
  { id: 'R07', name: 'Essential Eight Maturity Report', status: 'Draft', cls: B.draft, date: 'Jan 20', pages: 14 },
  { id: 'R08', name: 'Third-Party Risk Dashboard — Q4', status: 'Final', cls: B.done, date: 'Jan 15', pages: 8 },
  { id: 'R09', name: 'Security Posture Executive Summary', status: 'In Review', cls: B.rev, date: 'Jan 10', pages: 6 },
  { id: 'R10', name: 'Data Privacy Impact Assessment', status: 'Final', cls: B.done, date: 'Jan 5', pages: 20 },
  { id: 'R11', name: 'NDIS Compliance Status Report', status: 'Draft', cls: B.draft, date: 'Dec 28', pages: 11 },
  { id: 'R12', name: 'Annual Risk Assessment Summary', status: 'Final', cls: B.done, date: 'Dec 22', pages: 28 },
  { id: 'R13', name: 'Penetration Test Executive Brief', status: 'Final', cls: B.done, date: 'Dec 18', pages: 7 },
  { id: 'R14', name: 'Access Review Findings — Q4', status: 'In Review', cls: B.rev, date: 'Dec 12', pages: 10 },
  { id: 'R15', name: 'Compliance Trend Analysis — 2025', status: 'Final', cls: B.done, date: 'Dec 5', pages: 32 },
];

interface RiskItem { id: string; name: string; sev: string; cls: string; dotCls: string; age: string; owner: string; }
const RISKS: RiskItem[] = [
  { id: 'RK01', name: 'Unpatched CVE in auth service', sev: 'Critical', cls: B.crit, dotCls: 'bg-red-400/70', age: '3d', owner: 'SM' },
  { id: 'RK02', name: 'Expired vendor NDA — Acme Corp', sev: 'Medium', cls: B.med, dotCls: 'bg-amber-400/70', age: '7d', owner: 'LW' },
  { id: 'RK03', name: 'Missing MFA for 2 admin accounts', sev: 'High', cls: B.high, dotCls: 'bg-orange-400/70', age: '1d', owner: 'AK' },
  { id: 'RK04', name: 'Overdue access review — Q4', sev: 'Low', cls: B.low, dotCls: 'bg-emerald-400/70', age: '14d', owner: 'JR' },
  { id: 'RK05', name: 'Stale firewall rules — production', sev: 'Medium', cls: B.med, dotCls: 'bg-amber-400/70', age: '5d', owner: 'TP' },
  { id: 'RK06', name: 'Unencrypted S3 bucket — staging', sev: 'High', cls: B.high, dotCls: 'bg-orange-400/70', age: '2d', owner: 'NM' },
  { id: 'RK07', name: 'Third-party API without rate limiting', sev: 'Medium', cls: B.med, dotCls: 'bg-amber-400/70', age: '10d', owner: 'SM' },
  { id: 'RK08', name: 'Shadow IT — unapproved SaaS usage', sev: 'Medium', cls: B.med, dotCls: 'bg-amber-400/70', age: '12d', owner: 'LW' },
  { id: 'RK09', name: 'Expired SSL certificate — internal', sev: 'High', cls: B.high, dotCls: 'bg-orange-400/70', age: '1d', owner: 'AK' },
  { id: 'RK10', name: 'Incomplete data classification', sev: 'Low', cls: B.low, dotCls: 'bg-emerald-400/70', age: '21d', owner: 'JR' },
  { id: 'RK11', name: 'Vendor SOC 2 report gap — CloudCo', sev: 'Medium', cls: B.med, dotCls: 'bg-amber-400/70', age: '8d', owner: 'TP' },
  { id: 'RK12', name: 'Privileged account without audit trail', sev: 'Critical', cls: B.crit, dotCls: 'bg-red-400/70', age: '4d', owner: 'NM' },
  { id: 'RK13', name: 'Missing endpoint agent — 3 devices', sev: 'High', cls: B.high, dotCls: 'bg-orange-400/70', age: '6d', owner: 'SM' },
  { id: 'RK14', name: 'Outdated incident response contacts', sev: 'Low', cls: B.low, dotCls: 'bg-emerald-400/70', age: '30d', owner: 'LW' },
  { id: 'RK15', name: 'Weak password policy for contractors', sev: 'Medium', cls: B.med, dotCls: 'bg-amber-400/70', age: '15d', owner: 'AK' },
  { id: 'RK16', name: 'Unsegmented guest WiFi network', sev: 'High', cls: B.high, dotCls: 'bg-orange-400/70', age: '9d', owner: 'JR' },
  { id: 'RK17', name: 'Overdue penetration test — mobile app', sev: 'Medium', cls: B.med, dotCls: 'bg-amber-400/70', age: '18d', owner: 'TP' },
  { id: 'RK18', name: 'Legacy system — no security patches', sev: 'Critical', cls: B.crit, dotCls: 'bg-red-400/70', age: '25d', owner: 'NM' },
  { id: 'RK19', name: 'Incomplete DR test documentation', sev: 'Low', cls: B.low, dotCls: 'bg-emerald-400/70', age: '20d', owner: 'SM' },
  { id: 'RK20', name: 'Missing DPIA for new CRM system', sev: 'Medium', cls: B.med, dotCls: 'bg-amber-400/70', age: '11d', owner: 'LW' },
];

interface PolicyItem { id: string; name: string; ver: string; status: string; cls: string; review: string; owner: string; }
const POLICIES: PolicyItem[] = [
  { id: 'P01', name: 'Information Security Policy', ver: 'v4.2', status: 'Active', cls: B.done, review: 'Jan 15', owner: 'CISO' },
  { id: 'P02', name: 'Acceptable Use Policy', ver: 'v3.1', status: 'Active', cls: B.done, review: 'Dec 20', owner: 'HR' },
  { id: 'P03', name: 'Data Retention Policy', ver: 'v2.0', status: 'In Review', cls: B.rev, review: 'Feb 10', owner: 'Legal' },
  { id: 'P04', name: 'Incident Response Plan', ver: 'v5.0', status: 'Active', cls: B.done, review: 'Jan 28', owner: 'Security' },
  { id: 'P05', name: 'Vendor Management Policy', ver: 'v1.3', status: 'Draft', cls: B.draft, review: 'Feb 14', owner: 'Procurement' },
  { id: 'P06', name: 'Access Control Policy', ver: 'v3.0', status: 'Active', cls: B.done, review: 'Jan 5', owner: 'IT' },
  { id: 'P07', name: 'Business Continuity Policy', ver: 'v2.4', status: 'Active', cls: B.done, review: 'Dec 15', owner: 'Operations' },
  { id: 'P08', name: 'Data Classification Policy', ver: 'v1.8', status: 'In Review', cls: B.rev, review: 'Feb 8', owner: 'Data Gov' },
  { id: 'P09', name: 'Encryption Standards', ver: 'v2.1', status: 'Active', cls: B.done, review: 'Nov 30', owner: 'Security' },
  { id: 'P10', name: 'Remote Work Security Policy', ver: 'v1.5', status: 'Active', cls: B.done, review: 'Dec 10', owner: 'HR' },
];

/* ═══════════════════════════════════════════════════════════════════════
   DASHBOARD STATS
   ═══════════════════════════════════════════════════════════════════════ */

const DASH_STATS = [
  { label: 'Controls', value: '142', sub: '/ 156 mapped' },
  { label: 'Evidence', value: '94%', sub: 'coverage' },
  { label: 'Audit Risk', value: 'Low', sub: '3 open items' },
];

/* ═══════════════════════════════════════════════════════════════════════
   SORT & FILTER HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

type SortOption = 'default' | 'name-asc' | 'name-desc' | 'status';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyItem = any;

function getTextField(item: AnyItem): string {
  return ((item.title ?? item.name ?? '') as string).toLowerCase();
}

function filterItems<T>(items: T[], query: string): T[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter((item) => getTextField(item).includes(q));
}

function sortItems<T>(items: T[], sort: SortOption): T[] {
  if (sort === 'default') return items;
  const sorted = [...items];
  if (sort === 'name-asc') sorted.sort((a, b) => getTextField(a).localeCompare(getTextField(b)));
  if (sort === 'name-desc') sorted.sort((a, b) => getTextField(b).localeCompare(getTextField(a)));
  if (sort === 'status') sorted.sort((a, b) => ((a as AnyItem)?.status ?? '').localeCompare(((b as AnyItem)?.status ?? '')));
  return sorted;
}

/* ═══════════════════════════════════════════════════════════════════════
   TOAST SYSTEM
   ═══════════════════════════════════════════════════════════════════════ */

interface Toast { id: number; message: string; }
let toastId = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  }, []);
  return { toasts, add };
}

const ToastContainer = memo(function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="absolute bottom-3 right-3 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium pointer-events-auto"
          >
            <Check className="w-3.5 h-3.5 shrink-0" />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════
   DETAIL DRAWER
   ═══════════════════════════════════════════════════════════════════════ */

interface DrawerData {
  title: string;
  subtitle: string;
  status?: string;
  statusCls?: string;
  details: { label: string; value: string }[];
}

const DetailDrawer = memo(function DetailDrawer({
  data,
  onClose,
  onAction,
  reduced,
}: {
  data: DrawerData | null;
  onClose: () => void;
  onAction: (msg: string) => void;
  reduced: boolean;
}) {
  // Close on Escape
  useEffect(() => {
    if (!data) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [data, onClose]);

  return (
    <AnimatePresence>
      {data && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 z-30 bg-black/40"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: 80 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 right-0 bottom-0 z-40 w-full sm:w-[360px] bg-[#0e1525] border-l border-white/[0.08] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white/90 truncate">{data.title}</h4>
                <p className="text-xs text-white/35 mt-0.5">{data.subtitle}</p>
              </div>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Status */}
            {data.status && (
              <div className="px-5 py-3 border-b border-white/[0.06] shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full ${data.statusCls}`}>{data.status}</span>
              </div>
            )}
            {/* Details */}
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
              <div className="space-y-3">
                {data.details.map((d) => (
                  <div key={d.label}>
                    <div className="text-[10px] uppercase tracking-wider text-white/25 mb-0.5">{d.label}</div>
                    <div className="text-xs text-white/60">{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Actions */}
            <div className="flex gap-2 px-5 py-3 border-t border-white/[0.06] shrink-0">
              <button
                onClick={() => { onAction('Changes saved'); onClose(); }}
                className="flex-1 px-3 py-2 rounded-lg bg-teal-400/10 border border-teal-400/20 text-teal-300 text-xs font-medium hover:bg-teal-400/15 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => { onAction('Exported successfully'); onClose(); }}
                className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs hover:bg-white/[0.06] transition-colors"
              >
                Export
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

/* ═══════════════════════════════════════════════════════════════════════
   LIST HEADER — search + sort + action buttons
   ═══════════════════════════════════════════════════════════════════════ */

const ListHeader = memo(function ListHeader({
  title,
  count,
  search,
  onSearchChange,
  sort,
  onSortChange,
  onExport,
  onNew,
}: {
  title: string;
  count: number;
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  onExport: () => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 shrink-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-white/85">{title}</h3>
        <span className="text-[10px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">{count}</span>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Search */}
        <div className="relative flex-1 sm:flex-initial sm:w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs text-white/70 placeholder-white/20 focus:outline-none focus:border-teal-400/30 focus:ring-1 focus:ring-teal-400/20 transition-colors"
          />
        </div>
        {/* Sort */}
        <div className="relative">
          <ArrowUpDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none pl-7 pr-6 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-xs text-white/50 focus:outline-none focus:border-teal-400/30 cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="default">Default</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="status">Status</option>
          </select>
          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/25 pointer-events-none" />
        </div>
        {/* Actions */}
        <button onClick={onExport} className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07] text-white/35 hover:text-white/55 hover:bg-white/[0.05] transition-colors" title="Export">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={onNew} className="p-1.5 rounded-lg bg-teal-400/10 border border-teal-400/20 text-teal-300 hover:bg-teal-400/15 transition-colors" title="New">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════
   ROW COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

const ROW_BASE = 'flex items-center gap-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] px-4 py-2.5 hover:bg-white/[0.05] hover:border-white/[0.10] transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400/40';

/* ═══════════════════════════════════════════════════════════════════════
   VIEW RENDERERS
   ═══════════════════════════════════════════════════════════════════════ */

function makeDrawerData(viewId: ViewId, item: AnyItem): DrawerData {
  const title = (item.title ?? item.name ?? '') as string;
  const id = item.id as string;
  const status = item.status ?? item.sev;
  const statusCls = item.cls ?? item.sevCls;

  const baseDetails = [{ label: 'ID', value: id }];

  switch (viewId) {
    case 'tasks':
      return { title, subtitle: `Task ${id}`, status: status as string, statusCls: statusCls as string, details: [...baseDetails, { label: 'Assigned To', value: item.assignee as string }, { label: 'Due Date', value: item.due as string }, { label: 'Description', value: 'Review and validate all related control mappings. Ensure evidence artifacts are linked and up to date. Coordinate with control owners for sign-off.' }] };
    case 'evidence':
      return { title, subtitle: `${item.type} · ${item.size}`, details: [...baseDetails, { label: 'File Type', value: item.type as string }, { label: 'File Size', value: item.size as string }, { label: 'Uploaded', value: item.date as string }, { label: 'Framework', value: item.tag as string }, { label: 'Linked Controls', value: '3 controls linked' }] };
    case 'controls':
      return { title: `${item.code} — ${title}`, subtitle: item.framework as string, status: status as string, statusCls: statusCls as string, details: [...baseDetails, { label: 'Control Code', value: item.code as string }, { label: 'Framework', value: item.framework as string }, { label: 'Evidence Items', value: '5 artifacts linked' }, { label: 'Last Reviewed', value: 'Feb 10, 2026' }] };
    case 'reports':
      return { title, subtitle: `${item.pages} pages`, status: status as string, statusCls: statusCls as string, details: [...baseDetails, { label: 'Generated', value: item.date as string }, { label: 'Pages', value: String(item.pages) }, { label: 'Format', value: 'PDF' }, { label: 'Recipients', value: 'Board of Directors, CISO' }] };
    case 'risk':
      return { title, subtitle: `Owned by ${item.owner}`, status: item.sev as string, statusCls: item.cls as string, details: [...baseDetails, { label: 'Severity', value: item.sev as string }, { label: 'Age', value: item.age as string }, { label: 'Owner', value: item.owner as string }, { label: 'Mitigation', value: 'Remediation plan in progress. Target resolution within SLA window. Escalation path defined.' }] };
    case 'policies':
      return { title, subtitle: `${item.ver} · ${item.owner}`, status: status as string, statusCls: statusCls as string, details: [...baseDetails, { label: 'Version', value: item.ver as string }, { label: 'Owner', value: item.owner as string }, { label: 'Last Review', value: item.review as string }, { label: 'Scope', value: 'Organisation-wide' }] };
    default:
      return { title, subtitle: id, details: baseDetails };
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductLiveDemo() {
  const reduced = !!useReducedMotion();
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('default');
  const [drawerData, setDrawerData] = useState<DrawerData | null>(null);
  const { toasts, add: addToast } = useToasts();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Reset search/sort when changing views
  const switchView = useCallback((v: ViewId) => {
    setActiveView(v);
    setSearch('');
    setSort('default');
    setDrawerData(null);
    setMobileMenuOpen(false);
  }, []);

  // Keyboard nav for sidebar
  const handleSidebarKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); const next = VIEWS[idx + 1]; if (next) switchView(next.id); }
    if (e.key === 'ArrowUp') { e.preventDefault(); const prev = VIEWS[idx - 1]; if (prev) switchView(prev.id); }
  }, [switchView]);

  const openDetail = useCallback((viewId: ViewId, item: AnyItem) => {
    setDrawerData(makeDrawerData(viewId, item));
  }, []);

  const handleExport = useCallback(() => addToast('Exported successfully'), [addToast]);
  const handleNew = useCallback(() => addToast('Item created'), [addToast]);

  // Filtered + sorted data
  const filteredTasks = useMemo(() => sortItems(filterItems(TASKS, search), sort), [search, sort]);
  const filteredEvidence = useMemo(() => sortItems(filterItems(EVIDENCE, search), sort), [search, sort]);
  const filteredControls = useMemo(() => sortItems(filterItems(CONTROLS, search), sort), [search, sort]);
  const filteredReports = useMemo(() => sortItems(filterItems(REPORTS, search), sort), [search, sort]);
  const filteredRisks = useMemo(() => sortItems(filterItems(RISKS, search), sort), [search, sort]);
  const filteredPolicies = useMemo(() => sortItems(filterItems(POLICIES, search), sort), [search, sort]);

  const viewMeta = VIEW_MAP[activeView];
  const Icon = viewMeta.icon;

  const renderContent = () => {
    if (activeView === 'dashboard') {
      return (
        <div className="flex flex-col h-full">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
            {DASH_STATS.map((s) => (
              <div key={s.label} className="rounded-lg bg-white/[0.025] border border-white/[0.06] p-3">
                <div className="text-[10px] text-white/25 uppercase tracking-wider">{s.label}</div>
                <div className="text-base font-bold text-white/85 mt-0.5">{s.value}</div>
                <div className="text-[10px] text-white/20">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-white/25 font-medium uppercase tracking-wider mb-2 shrink-0">Active Tasks</div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
            {TASKS.slice(0, 8).map((t) => (
              <button key={t.id} type="button" className={ROW_BASE + ' w-full text-left'} onClick={() => openDetail('tasks', t)}>
                <div className="w-2 h-2 rounded-full bg-teal-400/60 shrink-0" />
                <div className="flex-1 min-w-0 text-xs text-white/65 truncate">{t.title}</div>
                <div className="w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0"><span className="text-[9px] font-semibold text-white/40">{t.assignee}</span></div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${t.cls}`}>{t.status}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // List views
    let items: AnyItem[] = [];
    let title = '';
    switch (activeView) {
      case 'tasks': items = filteredTasks; title = 'Tasks'; break;
      case 'evidence': items = filteredEvidence; title = 'Evidence Vault'; break;
      case 'controls': items = filteredControls; title = 'Controls'; break;
      case 'reports': items = filteredReports; title = 'Reports'; break;
      case 'risk': items = filteredRisks; title = 'Risk Register'; break;
      case 'policies': items = filteredPolicies; title = 'Policies'; break;
    }

    return (
      <div className="flex flex-col h-full">
        <ListHeader
          title={title}
          count={items.length}
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          onExport={handleExport}
          onNew={handleNew}
        />
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}>
          {items.length === 0 && (
            <div className="text-xs text-white/25 text-center py-8">No items match your search.</div>
          )}
          {activeView === 'tasks' && filteredTasks.map((t) => (
            <button key={t.id} type="button" className={ROW_BASE + ' w-full text-left'} onClick={() => openDetail('tasks', t)}>
              <div className="w-2 h-2 rounded-full bg-blue-400/60 shrink-0" />
              <div className="flex-1 min-w-0 text-xs text-white/65 truncate">{t.title}</div>
              <span className="text-[10px] text-white/25 shrink-0 hidden sm:inline">{t.due}</span>
              <div className="w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0"><span className="text-[9px] font-semibold text-white/40">{t.assignee}</span></div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${t.cls}`}>{t.status}</span>
            </button>
          ))}
          {activeView === 'evidence' && filteredEvidence.map((e) => (
            <button key={e.id} type="button" className={ROW_BASE + ' w-full text-left'} onClick={() => openDetail('evidence', e)}>
              <div className="w-6 h-6 rounded bg-amber-400/10 flex items-center justify-center shrink-0"><span className="text-[9px] text-amber-300 font-mono">{e.type}</span></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/60 truncate">{e.name}</div>
                <div className="text-[10px] text-white/20">{e.size} · {e.date}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/12 text-amber-300 shrink-0">{e.tag}</span>
            </button>
          ))}
          {activeView === 'controls' && filteredControls.map((c) => (
            <button key={c.id} type="button" className={ROW_BASE + ' w-full text-left'} onClick={() => openDetail('controls', c)}>
              <span className="text-[10px] font-mono text-emerald-300/80 w-10 shrink-0">{c.code}</span>
              <div className="flex-1 min-w-0 text-xs text-white/60 truncate">{c.name}</div>
              <span className="text-[10px] text-white/20 shrink-0 hidden sm:inline">{c.framework}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${c.cls}`}>{c.status}</span>
            </button>
          ))}
          {activeView === 'reports' && filteredReports.map((r) => (
            <button key={r.id} type="button" className={ROW_BASE + ' w-full text-left'} onClick={() => openDetail('reports', r)}>
              <div className="w-6 h-6 rounded bg-indigo-400/10 flex items-center justify-center shrink-0"><BarChart3 className="w-3 h-3 text-indigo-300" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/60 truncate">{r.name}</div>
                <div className="text-[10px] text-white/20">{r.date} · {r.pages} pages</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${r.cls}`}>{r.status}</span>
            </button>
          ))}
          {activeView === 'risk' && filteredRisks.map((r) => (
            <button key={r.id} type="button" className={ROW_BASE + ' w-full text-left'} onClick={() => openDetail('risk', r)}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${r.dotCls}`} />
              <div className="flex-1 min-w-0 text-xs text-white/60 truncate">{r.name}</div>
              <span className="text-[10px] text-white/20 shrink-0">{r.age}</span>
              <div className="w-5 h-5 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0"><span className="text-[9px] font-semibold text-white/40">{r.owner}</span></div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${r.cls}`}>{r.sev}</span>
            </button>
          ))}
          {activeView === 'policies' && filteredPolicies.map((p) => (
            <button key={p.id} type="button" className={ROW_BASE + ' w-full text-left'} onClick={() => openDetail('policies', p)}>
              <div className="w-6 h-6 rounded bg-rose-400/10 flex items-center justify-center shrink-0"><BookOpen className="w-3 h-3 text-rose-300" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/60 truncate">{p.name}</div>
                <div className="text-[10px] text-white/20">{p.ver} · {p.review} · {p.owner}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${p.cls}`}>{p.status}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(145deg, rgba(15,22,40,0.98) 0%, rgba(10,15,28,0.99) 100%)', border: '1px solid rgba(255,255,255,0.12)' }}>
      {/* Glass highlight */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: 'linear-gradient(170deg, rgba(255,255,255,0.04) 0%, transparent 18%)' }} />

      <div className="absolute inset-0 flex flex-col overflow-hidden">
        {/* Browser chrome bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.015] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
            </div>
            <div className="text-[11px] text-white/28 font-mono tracking-wider hidden sm:block">app.formaos.com.au / {activeView}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 sm:w-28 h-6 rounded-md bg-white/[0.03] border border-white/[0.07] flex items-center px-2">
              <span className="text-[10px] text-white/20">Search…</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400/25 to-emerald-500/15 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/55">FO</span>
            </div>
          </div>
        </div>

        {/* App body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar — desktop only */}
          {!isMobile && (
            <div className="w-[140px] shrink-0 border-r border-white/[0.06] bg-white/[0.02] py-3 px-2 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-2 mb-4">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-teal-400/25 to-emerald-500/15 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-teal-400/80">FO</span>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-white/55">FormaOS</div>
                  <div className="text-[8px] text-white/20">Enterprise</div>
                </div>
              </div>
              <nav className="space-y-0.5" role="tablist" aria-label="App navigation">
                {VIEWS.map((v, idx) => {
                  const VIcon = v.icon;
                  const isActive = activeView === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={isActive ? 0 : -1}
                      onClick={() => switchView(v.id)}
                      onKeyDown={(e) => handleSidebarKeyDown(e, idx)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-left transition-colors duration-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-teal-400/40 ${
                        isActive
                          ? 'bg-teal-400/[0.08] text-teal-300 border border-teal-400/12'
                          : 'text-white/30 hover:text-white/55 hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <VIcon className="w-3.5 h-3.5 opacity-70" />
                      <span className="truncate">{v.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="mt-auto pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-1.5 px-2 mt-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400/25 to-teal-400/15 shrink-0" />
                  <span className="text-[10px] text-white/30 truncate">Nancy M.</span>
                </div>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div ref={contentRef} className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
            {/* Mobile nav */}
            {isMobile && (
              <div className="flex gap-1 px-3 py-2 border-b border-white/[0.06] overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
                {VIEWS.map((v) => {
                  const VIcon = v.icon;
                  const isActive = activeView === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => switchView(v.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] shrink-0 transition-colors ${
                        isActive ? 'bg-teal-400/10 text-teal-300 border border-teal-400/20' : 'text-white/35 border border-transparent hover:text-white/55'
                      }`}
                    >
                      <VIcon className="w-3 h-3" />
                      {v.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Topbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-white/40" />
                <div>
                  <div className="text-sm font-semibold text-white/85">{viewMeta.label}</div>
                  <div className="text-[10px] text-white/20">Last synced 2 min ago</div>
                </div>
              </div>
              {activeView === 'dashboard' && (
                <div className="flex items-center gap-2">
                  <button onClick={handleExport} className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.07] text-[10px] text-white/30 hover:bg-white/[0.05] transition-colors">Export</button>
                  <button onClick={handleNew} className="px-2.5 py-1 rounded-md bg-teal-400/10 border border-teal-400/20 text-[10px] text-teal-300 hover:bg-teal-400/15 transition-colors">+ New</button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={reduced ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="h-full"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Detail drawer */}
            <DetailDrawer data={drawerData} onClose={() => setDrawerData(null)} onAction={addToast} reduced={reduced} />

            {/* Toasts */}
            <ToastContainer toasts={toasts} />
          </div>
        </div>
      </div>
    </div>
  );
}
