import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface BoardPackOptions {
  dateRange: { from: string; to: string };
  frameworks?: string[];
  includeAppendix?: boolean;
  classification?: string;
}

interface BoardPackSection {
  title: string;
  type:
    | 'summary'
    | 'scorecard'
    | 'risk_register'
    | 'gaps'
    | 'audit_readiness'
    | 'incidents'
    | 'remediation'
    | 'appendix';
  data: unknown;
}

/** Generate a comprehensive board-ready pack. Returns structured sections for PDF rendering. */
export async function generateBoardPack(
  orgId: string,
  options: BoardPackOptions,
): Promise<{
  sections: BoardPackSection[];
  generatedAt: string;
  orgName: string;
}> {
  const db = createSupabaseAdminClient();

  // Org info
  const { data: org } = await db
    .from('organizations')
    .select('name, logo_url')
    .eq('id', orgId)
    .single();
  const orgName = org?.name ?? 'Organization';

  const sections: BoardPackSection[] = [];

  // 1. Executive Summary
  const { data: controls } = await db
    .from('org_controls')
    .select('id, status, priority, framework_id')
    .eq('organization_id', orgId);

  const totalControls = controls?.length ?? 0;
  const satisfiedControls =
    controls?.filter((c) => c.status === 'satisfied').length ?? 0;
  const complianceScore =
    totalControls > 0
      ? Math.round((satisfiedControls / totalControls) * 100)
      : 0;

  const { count: evidenceCount } = await db
    .from('org_evidence')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  const { count: openTasks } = await db
    .from('org_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['todo', 'in_progress']);

  sections.push({
    title: 'Executive Summary',
    type: 'summary',
    data: {
      complianceScore,
      totalControls,
      satisfiedControls,
      evidenceCount: evidenceCount ?? 0,
      openTasks: openTasks ?? 0,
      dateRange: options.dateRange,
    },
  });

  // 2. Compliance Scorecard by Framework
  const frameworkScores: Record<
    string,
    { total: number; satisfied: number; score: number }
  > = {};
  for (const ctrl of controls ?? []) {
    const fw = ctrl.framework_id ?? 'unassigned';
    if (options.frameworks?.length && !options.frameworks.includes(fw))
      continue;
    if (!frameworkScores[fw])
      frameworkScores[fw] = { total: 0, satisfied: 0, score: 0 };
    frameworkScores[fw].total++;
    if (ctrl.status === 'satisfied') frameworkScores[fw].satisfied++;
  }
  for (const fw of Object.keys(frameworkScores)) {
    frameworkScores[fw].score =
      frameworkScores[fw].total > 0
        ? Math.round(
            (frameworkScores[fw].satisfied / frameworkScores[fw].total) * 100,
          )
        : 0;
  }

  sections.push({
    title: 'Compliance Scorecard',
    type: 'scorecard',
    data: frameworkScores,
  });

  // 3. Risk Register — top 10 critical/high priority unsatisfied controls
  const topRisks = (controls ?? [])
    .filter(
      (c) =>
        c.status !== 'satisfied' &&
        ['critical', 'high'].includes(c.priority ?? ''),
    )
    .slice(0, 10);

  sections.push({
    title: 'Risk Register',
    type: 'risk_register',
    data: topRisks,
  });

  // 4. Control Gaps — controls without adequate evidence
  const { data: gapControls } = await db
    .from('org_controls')
    .select('id, title, status, priority')
    .eq('organization_id', orgId)
    .neq('status', 'satisfied')
    .order('priority');

  sections.push({
    title: 'Control Gaps',
    type: 'gaps',
    data: (gapControls ?? []).slice(0, 20),
  });

  // 5. Audit Readiness
  const readinessPercent = complianceScore;
  sections.push({
    title: 'Audit Readiness',
    type: 'audit_readiness',
    data: { readinessPercent },
  });

  // 6. Incident Summary
  const { data: incidents } = await db
    .from('org_incidents')
    .select('id, status, severity, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', options.dateRange.from)
    .lte('created_at', options.dateRange.to);

  const incidentData = {
    total: incidents?.length ?? 0,
    resolved: incidents?.filter((i) => i.status === 'resolved').length ?? 0,
    open: incidents?.filter((i) => i.status !== 'resolved').length ?? 0,
    bySeverity: {} as Record<string, number>,
  };
  for (const inc of incidents ?? []) {
    incidentData.bySeverity[inc.severity] =
      (incidentData.bySeverity[inc.severity] ?? 0) + 1;
  }

  sections.push({
    title: 'Incident Summary',
    type: 'incidents',
    data: incidentData,
  });

  // 7. Remediation Tracker
  const { data: tasks } = await db
    .from('org_tasks')
    .select('id, status, due_date')
    .eq('organization_id', orgId);

  const overdueTasks = (tasks ?? []).filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date) < new Date() &&
      t.status !== 'completed',
  );

  sections.push({
    title: 'Remediation Tracker',
    type: 'remediation',
    data: {
      total: tasks?.length ?? 0,
      completed: tasks?.filter((t) => t.status === 'completed').length ?? 0,
      overdue: overdueTasks.length,
    },
  });

  // 8. Appendix (optional)
  if (options.includeAppendix) {
    sections.push({
      title: 'Appendix: Control-by-Control Status',
      type: 'appendix',
      data: controls ?? [],
    });
  }

  // Record generation
  await db.from('org_report_generations').insert({
    organization_id: orgId,
    report_type: 'board_pack',
    format: 'pdf',
    metadata: {
      dateRange: options.dateRange,
      classification: options.classification ?? 'Confidential',
    },
    generated_at: new Date().toISOString(),
  });

  return {
    sections,
    generatedAt: new Date().toISOString(),
    orgName,
  };
}
