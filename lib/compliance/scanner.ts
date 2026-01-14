/**
 * =========================================================
 * Automated Compliance Scanning
 * =========================================================
 * Automated scanning and validation of compliance requirements
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/audit-trail';
import { sendNotification } from '@/lib/realtime';

export type ComplianceFramework =
  | 'soc2'
  | 'iso27001'
  | 'hipaa'
  | 'gdpr'
  | 'pci_dss'
  | 'nist'
  | 'custom';

export type ScanType = 'full' | 'incremental' | 'targeted' | 'quick';

export interface ComplianceRequirement {
  id: string;
  framework: ComplianceFramework;
  controlId: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  evidenceRequired: boolean;
  testable: boolean;
}

export interface ScanFinding {
  requirementId: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence?: string[];
  remediation: string;
  estimatedEffort: number; // hours
  detectedAt: string;
}

export interface ScanResult {
  scanId: string;
  organizationId: string;
  framework: ComplianceFramework;
  scanType: ScanType;
  startedAt: string;
  completedAt: string;
  totalRequirements: number;
  compliant: number;
  nonCompliant: number;
  partial: number;
  notApplicable: number;
  complianceScore: number; // 0-100
  findings: ScanFinding[];
  recommendations: string[];
}

/**
 * SOC 2 Type II Requirements
 */
const SOC2_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: 'soc2-cc1.1',
    framework: 'soc2',
    controlId: 'CC1.1',
    title: 'Control Environment',
    description:
      'The entity demonstrates a commitment to integrity and ethical values',
    category: 'Common Criteria',
    mandatory: true,
    evidenceRequired: true,
    testable: true,
  },
  {
    id: 'soc2-cc2.1',
    framework: 'soc2',
    controlId: 'CC2.1',
    title: 'Communication and Information',
    description:
      'The entity obtains or generates and uses relevant, quality information',
    category: 'Common Criteria',
    mandatory: true,
    evidenceRequired: true,
    testable: true,
  },
  {
    id: 'soc2-cc6.1',
    framework: 'soc2',
    controlId: 'CC6.1',
    title: 'Logical and Physical Access Controls',
    description:
      'The entity implements logical access security software, infrastructure, and architectures',
    category: 'Common Criteria',
    mandatory: true,
    evidenceRequired: true,
    testable: true,
  },
  {
    id: 'soc2-cc7.2',
    framework: 'soc2',
    controlId: 'CC7.2',
    title: 'System Monitoring',
    description:
      'The entity monitors system components and the operation of those components',
    category: 'Common Criteria',
    mandatory: true,
    evidenceRequired: true,
    testable: true,
  },
  {
    id: 'soc2-cc8.1',
    framework: 'soc2',
    controlId: 'CC8.1',
    title: 'Change Management',
    description:
      'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures',
    category: 'Common Criteria',
    mandatory: true,
    evidenceRequired: true,
    testable: true,
  },
];

/**
 * ISO 27001 Requirements
 */
const ISO27001_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: 'iso-a5.1',
    framework: 'iso27001',
    controlId: 'A.5.1',
    title: 'Information Security Policies',
    description: 'Management direction for information security',
    category: 'Organizational Controls',
    mandatory: true,
    evidenceRequired: true,
    testable: true,
  },
  {
    id: 'iso-a6.1',
    framework: 'iso27001',
    controlId: 'A.6.1',
    title: 'Screening',
    description:
      'Background verification checks on all candidates for employment',
    category: 'People Controls',
    mandatory: true,
    evidenceRequired: true,
    testable: true,
  },
  {
    id: 'iso-a8.1',
    framework: 'iso27001',
    controlId: 'A.8.1',
    title: 'User Endpoint Devices',
    description:
      'Information stored on, processed by or accessible via user endpoint devices',
    category: 'Technological Controls',
    mandatory: true,
    evidenceRequired: true,
    testable: true,
  },
];

/**
 * Scan for evidence completeness
 */
async function scanEvidenceCompleteness(
  organizationId: string,
): Promise<ScanFinding[]> {
  const supabase = await createClient();
  const findings: ScanFinding[] = [];

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('requires_evidence', true);

  if (!tasks) return findings;

  for (const task of tasks) {
    const { data: evidence } = await supabase
      .from('evidence')
      .select('id')
      .eq('task_id', task.id);

    if (!evidence || evidence.length === 0) {
      findings.push({
        requirementId: 'evidence-completeness',
        status: 'non_compliant',
        severity: task.status === 'completed' ? 'high' : 'medium',
        title: `Missing Evidence: ${task.title}`,
        description: `Task "${task.title}" requires evidence but none has been provided`,
        remediation: 'Upload supporting evidence documentation for this task',
        estimatedEffort: 1,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return findings;
}

/**
 * Scan for policy documentation
 */
async function scanPolicyDocumentation(
  organizationId: string,
): Promise<ScanFinding[]> {
  const supabase = await createClient();
  const findings: ScanFinding[] = [];

  const requiredPolicies = [
    'Information Security Policy',
    'Access Control Policy',
    'Incident Response Policy',
    'Data Classification Policy',
    'Acceptable Use Policy',
  ];

  const { data: policies } = await supabase
    .from('policies')
    .select('title')
    .eq('organization_id', organizationId);

  const existingPolicies =
    policies?.map((p: { title: string }) => p.title.toLowerCase()) || [];

  for (const required of requiredPolicies) {
    const exists = existingPolicies.some((p: string) =>
      p.includes(required.toLowerCase().replace(' policy', '')),
    );

    if (!exists) {
      findings.push({
        requirementId: 'policy-documentation',
        status: 'non_compliant',
        severity: 'high',
        title: `Missing Policy: ${required}`,
        description: `Required policy "${required}" has not been documented`,
        remediation: `Create and approve a formal ${required}`,
        estimatedEffort: 8,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return findings;
}

/**
 * Scan for access control implementation
 */
async function scanAccessControls(
  organizationId: string,
): Promise<ScanFinding[]> {
  const supabase = await createClient();
  const findings: ScanFinding[] = [];

  // Check for users without 2FA
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id, profiles!user_id(two_factor_enabled)')
    .eq('organization_id', organizationId);

  if (members) {
    const without2FA = members.filter(
      (m: { profiles?: { two_factor_enabled?: boolean } }) =>
        !m.profiles?.two_factor_enabled,
    );
    if (without2FA.length > 0) {
      findings.push({
        requirementId: 'access-control-2fa',
        status: 'non_compliant',
        severity: 'medium',
        title: 'Multi-Factor Authentication Not Enforced',
        description: `${without2FA.length} users do not have 2FA enabled`,
        remediation:
          'Enforce 2FA for all users, especially those with elevated privileges',
        estimatedEffort: 2,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  // Check for proper role segregation
  const { data: adminUsers } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('role', 'owner');

  if (adminUsers && adminUsers.length > 3) {
    findings.push({
      requirementId: 'access-control-least-privilege',
      status: 'partial',
      severity: 'low',
      title: 'Excessive Administrative Access',
      description: `${adminUsers.length} users have owner-level access, which may violate least privilege principle`,
      remediation:
        'Review and reduce the number of users with owner-level privileges',
      estimatedEffort: 3,
      detectedAt: new Date().toISOString(),
    });
  }

  return findings;
}

/**
 * Scan for data retention compliance
 */
async function scanDataRetention(
  organizationId: string,
): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = [];
  const supabase = await createClient();

  // Check for evidence older than retention policy (e.g., 7 years)
  const retentionYears = 7;
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - retentionYears);

  const { data: oldEvidence } = await supabase
    .from('evidence')
    .select('id, title, created_at')
    .eq('organization_id', organizationId)
    .lt('created_at', cutoffDate.toISOString());

  if (oldEvidence && oldEvidence.length > 0) {
    findings.push({
      requirementId: 'data-retention',
      status: 'partial',
      severity: 'low',
      title: 'Evidence Beyond Retention Period',
      description: `${oldEvidence.length} evidence items are older than ${retentionYears} years`,
      remediation:
        'Review and archive or delete evidence that has exceeded retention period',
      estimatedEffort: 4,
      detectedAt: new Date().toISOString(),
    });
  }

  return findings;
}

/**
 * Scan for security monitoring
 */
async function scanSecurityMonitoring(
  organizationId: string,
): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = [];
  const supabase = await createClient();

  // Check for recent audit log activity
  const { data: recentLogs } = await supabase
    .from('activity_logs')
    .select('id')
    .eq('organization_id', organizationId)
    .gte(
      'created_at',
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    );

  if (!recentLogs || recentLogs.length === 0) {
    findings.push({
      requirementId: 'security-monitoring',
      status: 'non_compliant',
      severity: 'high',
      title: 'No Recent Security Monitoring Activity',
      description: 'No audit logs detected in the past 24 hours',
      remediation: 'Ensure audit logging is enabled and functioning correctly',
      estimatedEffort: 2,
      detectedAt: new Date().toISOString(),
    });
  }

  return findings;
}

/**
 * Scan for incident response preparedness
 */
async function scanIncidentResponse(
  organizationId: string,
): Promise<ScanFinding[]> {
  const findings: ScanFinding[] = [];
  const supabase = await createClient();

  // Check for incident response workflows
  const { data: workflows } = await supabase
    .from('workflow_configs')
    .select('name')
    .eq('organization_id', organizationId);

  const hasIncidentWorkflow = workflows?.some(
    (w: { name: string }) =>
      w.name.toLowerCase().includes('incident') ||
      w.name.toLowerCase().includes('breach'),
  );

  if (!hasIncidentWorkflow) {
    findings.push({
      requirementId: 'incident-response',
      status: 'non_compliant',
      severity: 'medium',
      title: 'No Incident Response Workflow Defined',
      description:
        'Organization does not have an automated incident response workflow',
      remediation: 'Create and test an incident response workflow',
      estimatedEffort: 6,
      detectedAt: new Date().toISOString(),
    });
  }

  return findings;
}

/**
 * Perform compliance scan
 */
export async function performComplianceScan(
  organizationId: string,
  framework: ComplianceFramework,
  scanType: ScanType = 'full',
): Promise<ScanResult> {
  const scanId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // Get requirements for framework
  const requirements =
    framework === 'soc2'
      ? SOC2_REQUIREMENTS
      : framework === 'iso27001'
        ? ISO27001_REQUIREMENTS
        : [];

  // Perform scans
  const [
    evidenceFindings,
    policyFindings,
    accessFindings,
    retentionFindings,
    monitoringFindings,
    incidentFindings,
  ] = await Promise.all([
    scanEvidenceCompleteness(organizationId),
    scanPolicyDocumentation(organizationId),
    scanAccessControls(organizationId),
    scanDataRetention(organizationId),
    scanSecurityMonitoring(organizationId),
    scanIncidentResponse(organizationId),
  ]);

  const allFindings = [
    ...evidenceFindings,
    ...policyFindings,
    ...accessFindings,
    ...retentionFindings,
    ...monitoringFindings,
    ...incidentFindings,
  ];

  // Calculate compliance metrics
  const totalRequirements = requirements.length;
  const compliant = allFindings.filter(
    (f: { status: string }) => f.status === 'compliant',
  ).length;
  const nonCompliant = allFindings.filter(
    (f: { status: string }) => f.status === 'non_compliant',
  ).length;
  const partial = allFindings.filter(
    (f: { status: string }) => f.status === 'partial',
  ).length;
  const notApplicable = allFindings.filter(
    (f: { status: string }) => f.status === 'not_applicable',
  ).length;

  const complianceScore =
    totalRequirements > 0
      ? Math.round(
          ((totalRequirements - nonCompliant) / totalRequirements) * 100,
        )
      : 100;

  // Generate recommendations
  const recommendations = allFindings
    .filter(
      (f: { status: string }) =>
        f.status === 'non_compliant' || f.status === 'partial',
    )
    .sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    })
    .slice(0, 10)
    .map((f: { remediation: string }) => f.remediation);

  const completedAt = new Date().toISOString();

  // Save scan result
  const supabase = await createClient();
  await supabase.from('compliance_scans').insert({
    scan_id: scanId,
    organization_id: organizationId,
    framework,
    scan_type: scanType,
    started_at: startedAt,
    completed_at: completedAt,
    total_requirements: totalRequirements,
    compliant,
    non_compliant: nonCompliant,
    partial,
    not_applicable: notApplicable,
    compliance_score: complianceScore,
    findings: allFindings,
    recommendations,
  });

  // Log activity
  await logActivity(
    organizationId,
    '', // System action
    'create',
    'report',
    {
      entityId: scanId,
      entityName: `${framework.toUpperCase()} Compliance Scan`,
      details: {
        framework,
        complianceScore,
        nonCompliant,
        findings: allFindings.length,
      },
    },
  );

  // Send notification if compliance score is low
  if (complianceScore < 70) {
    await sendNotification(
      '', // System notification
      `Low Compliance Score: ${complianceScore}%`,
      `${framework.toUpperCase()} compliance scan identified ${nonCompliant} non-compliant items`,
      'warning',
      `/dashboard/compliance/${scanId}`,
    );
  }

  return {
    scanId,
    organizationId,
    framework,
    scanType,
    startedAt,
    completedAt,
    totalRequirements,
    compliant,
    nonCompliant,
    partial,
    notApplicable,
    complianceScore,
    findings: allFindings,
    recommendations,
  };
}

/**
 * Get scan history
 */
export async function getScanHistory(
  organizationId: string,
  framework?: ComplianceFramework,
  limit = 10,
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase
    .from('compliance_scans')
    .select('*')
    .eq('organization_id', organizationId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (framework) {
    query = query.eq('framework', framework);
  }

  const { data, error } = await query;

  if (error) return [];

  return data || [];
}

/**
 * Schedule automated compliance scans
 */
export async function scheduleComplianceScan(
  organizationId: string,
  framework: ComplianceFramework,
  frequency: 'daily' | 'weekly' | 'monthly',
): Promise<void> {
  const supabase = await createClient();

  await supabase.from('scheduled_tasks').insert({
    organization_id: organizationId,
    task_type: 'compliance_scan',
    frequency,
    enabled: true,
    metadata: { framework },
    next_run: new Date().toISOString(),
  });
}

/**
 * Get compliance trends
 */
export async function getComplianceTrends(
  organizationId: string,
  framework: ComplianceFramework,
  days = 90,
): Promise<Array<{ date: string; score: number }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('compliance_scans')
    .select('completed_at, compliance_score')
    .eq('organization_id', organizationId)
    .eq('framework', framework)
    .gte(
      'completed_at',
      new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
    )
    .order('completed_at', { ascending: true });

  if (error || !data) return [];

  return data.map((scan: { completed_at: string; compliance_score: number }) => ({
    date: scan.completed_at,
    score: scan.compliance_score,
  }));
}
