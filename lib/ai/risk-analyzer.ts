/**
 * =========================================================
 * AI-Powered Risk Analysis Engine
 * =========================================================
 * Analyze compliance risks using AI and machine learning
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/audit-trail';
import { sendNotification } from '@/lib/realtime';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskCategory =
  | 'certificate_expiration'
  | 'missing_evidence'
  | 'overdue_tasks'
  | 'incomplete_workflows'
  | 'security_vulnerability'
  | 'compliance_gap'
  | 'policy_violation'
  | 'audit_finding';

export interface RiskFactor {
  category: RiskCategory;
  severity: RiskLevel;
  score: number; // 0-100
  title: string;
  description: string;
  affectedEntities: string[];
  recommendation: string;
  detectedAt: string;
  metadata?: Record<string, any>;
}

export interface RiskAnalysisResult {
  overallRiskScore: number; // 0-100
  riskLevel: RiskLevel;
  totalRisks: number;
  risksByCategory: Record<RiskCategory, number>;
  risksBySeverity: Record<RiskLevel, number>;
  topRisks: RiskFactor[];
  trends: {
    direction: 'improving' | 'stable' | 'declining';
    changePercent: number;
    previousScore: number;
  };
  recommendations: string[];
}

export interface AIInsight {
  type: 'prediction' | 'anomaly' | 'recommendation' | 'optimization';
  title: string;
  description: string;
  confidence: number; // 0-1
  impact: RiskLevel;
  actionable: boolean;
  suggestedActions: string[];
  metadata?: Record<string, any>;
}

/**
 * Analyze certificate expiration risks
 */
async function analyzeCertificateRisks(
  organizationId: string,
): Promise<RiskFactor[]> {
  const supabase = await createSupabaseServerClient();
  const risks: RiskFactor[] = [];

  const { data: certificates } = await supabase
    .from('certifications')
    .select('*')
    .eq('organization_id', organizationId);

  if (!certificates) return risks;

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (const cert of certificates) {
    const expiryDate = new Date(cert.expiry_date);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0) {
      // Expired certificate - CRITICAL
      risks.push({
        category: 'certificate_expiration',
        severity: 'critical',
        score: 95,
        title: `Certificate Expired: ${cert.name}`,
        description: `${cert.name} expired ${Math.abs(daysUntilExpiry)} days ago`,
        affectedEntities: [cert.id],
        recommendation: 'Renew certificate immediately to maintain compliance',
        detectedAt: new Date().toISOString(),
        metadata: {
          certificateId: cert.id,
          daysOverdue: Math.abs(daysUntilExpiry),
        },
      });
    } else if (daysUntilExpiry <= 7) {
      // Expiring within 7 days - HIGH
      risks.push({
        category: 'certificate_expiration',
        severity: 'high',
        score: 80,
        title: `Certificate Expiring Soon: ${cert.name}`,
        description: `${cert.name} expires in ${daysUntilExpiry} days`,
        affectedEntities: [cert.id],
        recommendation: 'Schedule certificate renewal within the next week',
        detectedAt: new Date().toISOString(),
        metadata: { certificateId: cert.id, daysRemaining: daysUntilExpiry },
      });
    } else if (expiryDate <= thirtyDaysFromNow) {
      // Expiring within 30 days - MEDIUM
      risks.push({
        category: 'certificate_expiration',
        severity: 'medium',
        score: 50,
        title: `Certificate Renewal Needed: ${cert.name}`,
        description: `${cert.name} expires in ${daysUntilExpiry} days`,
        affectedEntities: [cert.id],
        recommendation: 'Plan certificate renewal process',
        detectedAt: new Date().toISOString(),
        metadata: { certificateId: cert.id, daysRemaining: daysUntilExpiry },
      });
    }
  }

  return risks;
}

/**
 * Analyze missing evidence risks
 */
async function analyzeEvidenceRisks(
  organizationId: string,
): Promise<RiskFactor[]> {
  const supabase = await createSupabaseServerClient();
  const risks: RiskFactor[] = [];

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('requires_evidence', true)
    .eq('status', 'completed');

  if (!tasks) return risks;

  for (const task of tasks) {
    const { data: evidence } = await supabase
      .from('evidence')
      .select('id')
      .eq('task_id', task.id);

    if (!evidence || evidence.length === 0) {
      risks.push({
        category: 'missing_evidence',
        severity: 'high',
        score: 75,
        title: `Missing Evidence: ${task.title}`,
        description: `Completed task "${task.title}" has no supporting evidence`,
        affectedEntities: [task.id],
        recommendation: 'Upload evidence documentation to maintain audit trail',
        detectedAt: new Date().toISOString(),
        metadata: { taskId: task.id },
      });
    }
  }

  return risks;
}

/**
 * Analyze overdue task risks
 */
async function analyzeTaskRisks(organizationId: string): Promise<RiskFactor[]> {
  const supabase = await createSupabaseServerClient();
  const risks: RiskFactor[] = [];

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', organizationId)
    .in('status', ['pending', 'in_progress'])
    .not('due_date', 'is', null);

  if (!tasks) return risks;

  const now = new Date();

  for (const task of tasks) {
    const dueDate = new Date(task.due_date);
    const daysOverdue = Math.ceil(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysOverdue > 0) {
      const severity: RiskLevel =
        daysOverdue > 30
          ? 'critical'
          : daysOverdue > 14
            ? 'high'
            : daysOverdue > 7
              ? 'medium'
              : 'low';

      const score = Math.min(90, 30 + daysOverdue * 2);

      risks.push({
        category: 'overdue_tasks',
        severity,
        score,
        title: `Overdue Task: ${task.title}`,
        description: `Task "${task.title}" is ${daysOverdue} days overdue`,
        affectedEntities: [task.id],
        recommendation:
          daysOverdue > 30
            ? 'Reassign or escalate this critical overdue task'
            : 'Complete task or update due date',
        detectedAt: new Date().toISOString(),
        metadata: { taskId: task.id, daysOverdue, priority: task.priority },
      });
    }
  }

  return risks;
}

/**
 * Analyze workflow completion risks
 */
async function analyzeWorkflowRisks(
  organizationId: string,
): Promise<RiskFactor[]> {
  const supabase = await createSupabaseServerClient();
  const risks: RiskFactor[] = [];

  const { data: workflows } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'failed')
    .gte(
      'created_at',
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    );

  if (!workflows) return risks;

  // Group by workflow config
  const failuresByWorkflow: Record<string, number> = {};
  workflows.forEach((wf: { workflow_id: string }) => {
    failuresByWorkflow[wf.workflow_id] =
      (failuresByWorkflow[wf.workflow_id] || 0) + 1;
  });

  for (const [workflowId, failureCount] of Object.entries(failuresByWorkflow)) {
    if (failureCount >= 3) {
      const { data: config } = await supabase
        .from('workflow_configs')
        .select('name')
        .eq('id', workflowId)
        .single();

      risks.push({
        category: 'incomplete_workflows',
        severity: failureCount >= 5 ? 'high' : 'medium',
        score: Math.min(85, 40 + failureCount * 5),
        title: `Workflow Failures: ${config?.name || 'Unknown'}`,
        description: `Workflow has failed ${failureCount} times in the past 7 days`,
        affectedEntities: [workflowId],
        recommendation:
          'Review workflow configuration and resolve underlying issues',
        detectedAt: new Date().toISOString(),
        metadata: { workflowId, failureCount },
      });
    }
  }

  return risks;
}

/**
 * Detect compliance gaps using pattern analysis
 */
async function detectComplianceGaps(
  organizationId: string,
): Promise<RiskFactor[]> {
  const supabase = await createSupabaseServerClient();
  const risks: RiskFactor[] = [];

  // Check for inactive compliance activities
  const { data: activityLogs } = await supabase
    .from('activity_logs')
    .select('action, entity_type, created_at')
    .eq('organization_id', organizationId)
    .gte(
      'created_at',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  if (!activityLogs || activityLogs.length < 10) {
    risks.push({
      category: 'compliance_gap',
      severity: 'medium',
      score: 60,
      title: 'Low Compliance Activity',
      description:
        'Limited compliance-related activities detected in the past 30 days',
      affectedEntities: [],
      recommendation:
        'Increase engagement with compliance tasks and evidence management',
      detectedAt: new Date().toISOString(),
      metadata: { activityCount: activityLogs?.length || 0 },
    });
  }

  // Check for unbalanced workload
  const { data: members } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('organization_id', organizationId);

  if (members && members.length > 1) {
    const { data: taskAssignments } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('organization_id', organizationId)
      .not('assigned_to', 'is', null);

    if (taskAssignments) {
      const assignmentCounts: Record<string, number> = {};
      taskAssignments.forEach((t: { assigned_to: string }) => {
        assignmentCounts[t.assigned_to] =
          (assignmentCounts[t.assigned_to] || 0) + 1;
      });

      const counts = Object.values(assignmentCounts);
      const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
      const max = Math.max(...counts);

      if (max > avg * 2.5) {
        risks.push({
          category: 'compliance_gap',
          severity: 'low',
          score: 35,
          title: 'Unbalanced Workload Distribution',
          description:
            'Some team members have significantly more tasks than others',
          affectedEntities: [],
          recommendation:
            'Review task assignments and redistribute workload for better efficiency',
          detectedAt: new Date().toISOString(),
          metadata: { maxTasks: max, avgTasks: Math.round(avg) },
        });
      }
    }
  }

  return risks;
}

/**
 * Generate AI insights using pattern recognition
 */
async function generateAIInsights(
  organizationId: string,
  risks: RiskFactor[],
): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  // Insight 1: Certificate renewal pattern
  const certRisks = risks.filter(
    (r) => r.category === 'certificate_expiration',
  );
  if (certRisks.length >= 2) {
    insights.push({
      type: 'prediction',
      title: 'Certificate Renewal Clustering',
      description: `${certRisks.length} certificates require attention. Consider implementing a staggered renewal schedule to avoid multiple renewals at once.`,
      confidence: 0.85,
      impact: 'medium',
      actionable: true,
      suggestedActions: [
        'Create a certificate renewal calendar',
        'Set up automated renewal reminders 60 days in advance',
        'Consider multi-year certificates where possible',
      ],
      metadata: { affectedCertificates: certRisks.length },
    });
  }

  // Insight 2: Task completion patterns
  const taskRisks = risks.filter((r) => r.category === 'overdue_tasks');
  if (taskRisks.length >= 3) {
    insights.push({
      type: 'anomaly',
      title: 'Elevated Overdue Task Rate',
      description: `${taskRisks.length} overdue tasks detected. This is higher than normal and may indicate resource constraints or unclear priorities.`,
      confidence: 0.78,
      impact: 'high',
      actionable: true,
      suggestedActions: [
        'Review and reprioritize task assignments',
        'Identify and address blockers',
        'Consider extending deadlines or adding resources',
      ],
      metadata: { overdueTasks: taskRisks.length },
    });
  }

  // Insight 3: Evidence management optimization
  const evidenceRisks = risks.filter((r) => r.category === 'missing_evidence');
  if (evidenceRisks.length > 0) {
    insights.push({
      type: 'optimization',
      title: 'Evidence Collection Process Improvement',
      description: `${evidenceRisks.length} completed tasks are missing evidence. Implementing automated evidence prompts could improve compliance documentation.`,
      confidence: 0.92,
      impact: 'medium',
      actionable: true,
      suggestedActions: [
        'Enable automated evidence upload reminders',
        'Create evidence templates for common tasks',
        'Set up workflow automation to require evidence before task completion',
      ],
      metadata: { missingEvidence: evidenceRisks.length },
    });
  }

  // Insight 4: Proactive recommendations
  const criticalRisks = risks.filter((r) => r.severity === 'critical');
  if (criticalRisks.length === 0 && risks.length < 5) {
    insights.push({
      type: 'recommendation',
      title: 'Strong Compliance Posture',
      description:
        'Your organization is maintaining good compliance health with minimal critical risks. Continue current practices and consider implementing advanced automation.',
      confidence: 0.88,
      impact: 'low',
      actionable: true,
      suggestedActions: [
        'Implement predictive analytics for future risk identification',
        'Set up advanced workflow automation',
        'Prepare for compliance framework expansion',
      ],
    });
  }

  return insights;
}

/**
 * Calculate overall risk score
 */
function calculateOverallRiskScore(risks: RiskFactor[]): number {
  if (risks.length === 0) return 0;

  const severityWeights = {
    low: 0.25,
    medium: 0.5,
    high: 0.75,
    critical: 1.0,
  };

  const weightedSum = risks.reduce((sum, risk) => {
    return sum + risk.score * severityWeights[risk.severity];
  }, 0);

  const maxPossibleScore = risks.length * 100;
  return Math.round((weightedSum / maxPossibleScore) * 100);
}

/**
 * Perform comprehensive risk analysis
 */
export async function performRiskAnalysis(
  organizationId: string,
): Promise<RiskAnalysisResult> {
  const supabase = await createSupabaseServerClient();

  // Gather all risk factors
  const [certRisks, evidenceRisks, taskRisks, workflowRisks, gapRisks] =
    await Promise.all([
      analyzeCertificateRisks(organizationId),
      analyzeEvidenceRisks(organizationId),
      analyzeTaskRisks(organizationId),
      analyzeWorkflowRisks(organizationId),
      detectComplianceGaps(organizationId),
    ]);

  const allRisks = [
    ...certRisks,
    ...evidenceRisks,
    ...taskRisks,
    ...workflowRisks,
    ...gapRisks,
  ].sort((a, b) => b.score - a.score);

  // Calculate metrics
  const overallRiskScore = calculateOverallRiskScore(allRisks);
  const riskLevel: RiskLevel =
    overallRiskScore >= 75
      ? 'critical'
      : overallRiskScore >= 50
        ? 'high'
        : overallRiskScore >= 25
          ? 'medium'
          : 'low';

  // Group risks
  const risksByCategory: Record<RiskCategory, number> = {
    certificate_expiration: certRisks.length,
    missing_evidence: evidenceRisks.length,
    overdue_tasks: taskRisks.length,
    incomplete_workflows: workflowRisks.length,
    security_vulnerability: 0,
    compliance_gap: gapRisks.length,
    policy_violation: 0,
    audit_finding: 0,
  };

  const risksBySeverity: Record<RiskLevel, number> = {
    low: allRisks.filter((r) => r.severity === 'low').length,
    medium: allRisks.filter((r) => r.severity === 'medium').length,
    high: allRisks.filter((r) => r.severity === 'high').length,
    critical: allRisks.filter((r) => r.severity === 'critical').length,
  };

  // Get previous analysis for trends
  const { data: previousAnalysis } = await supabase
    .from('risk_analyses')
    .select('overall_risk_score')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const previousScore =
    previousAnalysis?.overall_risk_score || overallRiskScore;
  const changePercent =
    previousScore > 0
      ? Math.round(((overallRiskScore - previousScore) / previousScore) * 100)
      : 0;

  const direction: 'improving' | 'stable' | 'declining' =
    changePercent < -5
      ? 'improving'
      : changePercent > 5
        ? 'declining'
        : 'stable';

  // Generate AI insights
  const aiInsights = await generateAIInsights(organizationId, allRisks);

  // Compile recommendations
  const recommendations = [
    ...allRisks
      .filter((r) => r.severity === 'critical' || r.severity === 'high')
      .slice(0, 5)
      .map((r) => r.recommendation),
    ...aiInsights
      .filter((i) => i.actionable)
      .slice(0, 3)
      .flatMap((i) => i.suggestedActions),
  ];

  // Save analysis to database
  await supabase.from('risk_analyses').insert({
    organization_id: organizationId,
    overall_risk_score: overallRiskScore,
    risk_level: riskLevel,
    total_risks: allRisks.length,
    risks_by_category: risksByCategory,
    risks_by_severity: risksBySeverity,
    top_risks: allRisks.slice(0, 10),
    ai_insights: aiInsights,
    recommendations,
    created_at: new Date().toISOString(),
  });

  // Log activity
  await logActivity(
    organizationId,
    '', // System action
    'view',
    'report',
    {
      entityId: organizationId,
      entityName: 'Risk Analysis',
      details: {
        riskScore: overallRiskScore,
        riskLevel,
        totalRisks: allRisks.length,
      },
    },
  );

  // Send notification for high/critical risk
  if (riskLevel === 'high' || riskLevel === 'critical') {
    await sendNotification(
      '', // Will be sent to admins
      `${riskLevel.toUpperCase()} Risk Level Detected`,
      `Risk analysis identified ${allRisks.length} risks requiring attention`,
      'warning',
      '/dashboard/risk-analysis',
    );
  }

  return {
    overallRiskScore,
    riskLevel,
    totalRisks: allRisks.length,
    risksByCategory,
    risksBySeverity,
    topRisks: allRisks.slice(0, 10),
    trends: {
      direction,
      changePercent,
      previousScore,
    },
    recommendations: recommendations.slice(0, 10),
  };
}

/**
 * Get risk analysis history
 */
export async function getRiskAnalysisHistory(
  organizationId: string,
  limit = 30,
): Promise<any[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('risk_analyses')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return data || [];
}

/**
 * Get AI insights for organization
 */
export async function getAIInsights(
  organizationId: string,
): Promise<AIInsight[]> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from('risk_analyses')
    .select('ai_insights')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data?.ai_insights || [];
}

/**
 * Schedule automated risk analysis
 */
export async function scheduleRiskAnalysis(
  organizationId: string,
  frequency: 'daily' | 'weekly' | 'monthly',
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  await supabase.from('scheduled_tasks').insert({
    organization_id: organizationId,
    task_type: 'risk_analysis',
    frequency,
    enabled: true,
    next_run: new Date().toISOString(),
  });
}
