"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { logActivity as logger } from "@/lib/logger";
import { logAuditEvent } from "@/app/app/actions/audit-events";
import { createCorrelationId } from "@/lib/security/correlation";
import { getFrameworkCodeForSlug } from "@/lib/frameworks/framework-installer";

type ControlStatus = "compliant" | "at_risk" | "non_compliant" | "not_applicable";

type EvidenceStatus = "pending" | "approved" | "rejected";

type FrameworkRow = {
  id: string;
  code: string;
  title?: string | null;
  description?: string | null;
};

type FrameworkScore = {
  frameworkId: string;
  frameworkCode: string;
  frameworkTitle: string;
  score: number;
  riskScore: number;
  totalControls: number;
  compliant: number;
  atRisk: number;
  nonCompliant: number;
  notApplicable: number;
};

type CategoryScore = {
  category: string;
  score: number;
  riskScore: number;
  totalControls: number;
  compliant: number;
  atRisk: number;
  nonCompliant: number;
  notApplicable: number;
};

type ComplianceSnapshot = {
  overallScore: number;
  frameworkBreakdown: FrameworkScore[];
  categoryBreakdown: CategoryScore[];
  trend: {
    overallDelta: number | null;
    frameworkDeltas: Array<{ frameworkCode: string; delta: number | null }>;
  };
  openViolations: Array<{
    controlId: string;
    frameworkId: string;
    frameworkCode: string;
    code: string;
    title: string;
    status: ControlStatus;
    riskLevel: string;
    category: string;
    entityId?: string | null;
    requiredEvidenceCount: number;
    approvedEvidenceCount: number;
    pendingEvidenceCount: number;
    rejectedEvidenceCount: number;
    openTaskCount: number;
    overdueTaskCount: number;
  }>;
  highRiskControls: Array<{
    controlId: string;
    frameworkId: string;
    frameworkCode: string;
    code: string;
    title: string;
    status: ControlStatus;
    riskLevel: string;
    category: string;
  }>;
  evidenceBacklog: {
    pending: number;
    rejected: number;
    total: number;
  };
  taskBacklog: {
    open: number;
    overdue: number;
    total: number;
  };
  forecast: {
    projectedScoreIn21Days: number | null;
    daysToFullCompliance: number | null;
    basis: string;
  };
};

type EvidenceRow = {
  control_id: string;
  evidence_id: string | null;
  status: EvidenceStatus | null;
  created_at?: string | null;
  entity_id?: string | null;
};

type TaskRow = {
  id: string;
  status?: string | null;
  due_at?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
};

function riskMultiplier(riskLevel: string | null | undefined) {
  const level = (riskLevel || "medium").toLowerCase();
  if (level === "critical") return 1.4;
  if (level === "high") return 1.2;
  if (level === "low") return 0.8;
  return 1;
}

function scoreFromStatus(status: ControlStatus) {
  if (status === "compliant") return 1;
  if (status === "at_risk") return 0.5;
  return 0;
}

function isTaskComplete(task: TaskRow) {
  const status = (task.status || "").toLowerCase();
  return status === "completed" || status === "done";
}

function isTaskOverdue(task: TaskRow) {
  if (isTaskComplete(task)) return false;
  const due = task.due_at || task.due_date;
  if (!due) return false;
  try {
    return new Date(due) < new Date();
  } catch {
    return false;
  }
}

function stableHash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a_${(h >>> 0).toString(16)}`;
}

async function safeLogActivity(orgId: string, action: string, description: string, metadata?: any) {
  try {
    if (typeof logger === "function") {
      await (logger as any)(orgId, action, description, metadata);
      return;
    }
  } catch {
    // fall back below
  }

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("org_audit_logs").insert({
      organization_id: orgId,
      action,
      target: description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString(),
    });
  } catch {
    // best-effort only
  }
}

async function safeSelectFrameworks(
  supabase: any,
  orgId?: string,
  strict: boolean = false
): Promise<FrameworkRow[]> {
  try {
    const { data, error } = await supabase
      .from("compliance_frameworks")
      .select("id, code, name, description");
    if (error) {
      if (strict) throw new Error(error.message);
      return [];
    }
    const frameworks = (data ?? []).map((row: any) => ({
      ...row,
      title: row.title ?? row.name ?? null,
    }));
    if (!orgId) return frameworks;

    try {
      const { data: enabled } = await supabase
        .from("org_frameworks")
        .select("framework_slug")
        .eq("org_id", orgId);

      const enabledSlugs = (enabled ?? []).map((row: any) => row.framework_slug);
      if (!enabledSlugs.length) return frameworks;

      const enabledCodes = new Set(
        enabledSlugs.map((slug: string) => getFrameworkCodeForSlug(slug))
      );

      return frameworks.filter((fw: any) => enabledCodes.has(fw.code));
    } catch {
      return frameworks;
    }
  } catch {
    if (strict) throw new Error("Failed to load frameworks");
    return [];
  }
}

async function safeSelectControls(supabase: any, frameworkId: string, strict: boolean = false) {
  try {
    const { data, error } = await supabase
      .from("compliance_controls")
      .select(
        "id, framework_id, code, title, description, category, risk_level, weight, required_evidence_count, is_mandatory"
      )
      .eq("framework_id", frameworkId);
    if (error) {
      if (strict) throw new Error(error.message);
      return [];
    }
    return data ?? [];
  } catch {
    if (strict) throw new Error("Failed to load controls");
    return [];
  }
}

async function safeSelectControlEvidence(
  supabase: any,
  orgId: string,
  controlIds: string[],
  strict: boolean = false
): Promise<EvidenceRow[]> {
  if (!controlIds.length) return [];

  let lastError: string | null = null;
  try {
    const { data, error } = await supabase
      .from("control_evidence")
      .select("control_id, evidence_id, status, created_at, entity_id")
      .eq("organization_id", orgId)
      .in("control_id", controlIds);
    if (!error && data) return data as EvidenceRow[];
    lastError = error?.message ?? null;
  } catch {
    // fall through
  }

  // fallback to legacy mapping if present
  try {
    const { data, error } = await supabase
      .from("org_control_mappings")
      .select("control_id, evidence_id, org_evidence ( status )")
      .eq("organization_id", orgId)
      .in("control_id", controlIds);
    if (error || !data) {
      lastError = error?.message ?? lastError;
      if (strict) throw new Error(lastError || "Failed to load control evidence");
      return [];
    }
    return (data as any[]).map((row) => ({
      control_id: row.control_id,
      evidence_id: row.evidence_id,
      status: (row.org_evidence?.status || "pending") as EvidenceStatus,
      entity_id: row.entity_id ?? null,
    }));
  } catch {
    if (strict) throw new Error(lastError || "Failed to load control evidence");
    return [];
  }
}

async function safeSelectControlTasks(
  supabase: any,
  orgId: string,
  controlIds: string[],
  strict: boolean = false
): Promise<Array<{ control_id: string; task_id: string }>> {
  if (!controlIds.length) return [];

  try {
    const { data, error } = await supabase
      .from("control_tasks")
      .select("control_id, task_id, entity_id")
      .eq("organization_id", orgId)
      .in("control_id", controlIds);
    if (error) {
      if (strict) throw new Error(error.message);
      return [];
    }
    return (data ?? []).map((row: any) => ({
      control_id: row.control_id,
      task_id: row.task_id,
      entity_id: row.entity_id ?? null,
    }));
  } catch {
    if (strict) throw new Error("Failed to load control tasks");
    return [];
  }
}

async function safeSelectTasksByIds(
  supabase: any,
  orgId: string,
  taskIds: string[],
  strict: boolean = false
): Promise<TaskRow[]> {
  if (!taskIds.length) return [];
  try {
    const { data, error } = await supabase
      .from("org_tasks")
      .select("id,status,due_at,due_date,completed_at")
      .eq("organization_id", orgId)
      .in("id", taskIds);
    if (error) {
      if (strict) throw new Error(error.message);
      return [];
    }
    return (data ?? []) as TaskRow[];
  } catch {
    if (strict) throw new Error("Failed to load tasks");
    return [];
  }
}

async function upsertEvaluations(supabase: any, rows: any[]) {
  if (!rows.length) return;
  try {
    await supabase
      .from("org_control_evaluations")
      .upsert(rows, { onConflict: "organization_id,control_type,control_key" });
  } catch {
    // best-effort only
  }
}

async function logEvaluationAudit(supabase: any, orgId: string, rows: any[]) {
  if (!rows.length) return;
  try {
    const logs = rows.map((row) => ({
      organization_id: orgId,
      action: "control_evaluated",
      target: row.control_key,
      actor_email: "system",
      created_at: row.last_evaluated_at,
      metadata: row.details || null,
    }));
    await supabase.from("org_audit_logs").insert(logs);
  } catch {
    // swallow to avoid blocking page render
  }
}

async function refreshComplianceBlocks(
  supabase: any,
  orgId: string,
  frameworkCode: string,
  missingMandatoryCodes: string[]
) {
  const frameworkGate =
    frameworkCode === "ISO27001" ? "FRAMEWORK_ISO27001"
    : frameworkCode === "SOC2" ? "FRAMEWORK_SOC2"
    : frameworkCode === "HIPAA" ? "FRAMEWORK_HIPAA"
    : frameworkCode === "NDIS" ? "FRAMEWORK_NDIS"
    : null;

  const reason = `${missingMandatoryCodes.length} mandatory controls missing required evidence or remediation.`;

  if (missingMandatoryCodes.length > 0) {
    const { data: existingAudit } = await supabase
      .from("org_compliance_blocks")
      .select("id")
      .eq("organization_id", orgId)
      .eq("gate_key", "AUDIT_EXPORT")
      .is("resolved_at", null)
      .limit(1);

    if (!existingAudit || existingAudit.length === 0) {
      await supabase.from("org_compliance_blocks").insert({
        organization_id: orgId,
        gate_key: "AUDIT_EXPORT",
        reason,
        created_by: null,
        metadata: { framework: frameworkCode, missingCodes: missingMandatoryCodes.slice(0, 50) },
      });
    }

    const { data: existingCert } = await supabase
      .from("org_compliance_blocks")
      .select("id")
      .eq("organization_id", orgId)
      .eq("gate_key", "CERT_REPORT")
      .is("resolved_at", null)
      .limit(1);

    if (!existingCert || existingCert.length === 0) {
      await supabase.from("org_compliance_blocks").insert({
        organization_id: orgId,
        gate_key: "CERT_REPORT",
        reason,
        created_by: null,
        metadata: { framework: frameworkCode, missingCodes: missingMandatoryCodes.slice(0, 50) },
      });
    }

    if (frameworkGate) {
      const { data: existingFw } = await supabase
        .from("org_compliance_blocks")
        .select("id")
        .eq("organization_id", orgId)
        .eq("gate_key", frameworkGate)
        .is("resolved_at", null)
        .limit(1);

      if (!existingFw || existingFw.length === 0) {
        await supabase.from("org_compliance_blocks").insert({
          organization_id: orgId,
          gate_key: frameworkGate,
          reason,
          created_by: null,
          metadata: { framework: frameworkCode, missingCodes: missingMandatoryCodes.slice(0, 50) },
        });
      }
    }
  } else {
    await supabase
      .from("org_compliance_blocks")
      .update({ resolved_at: new Date().toISOString() })
      .eq("organization_id", orgId)
      .in("gate_key", frameworkGate ? ["AUDIT_EXPORT", "CERT_REPORT", frameworkGate] : ["AUDIT_EXPORT", "CERT_REPORT"])
      .is("resolved_at", null);

    await safeLogActivity(orgId, "compliance_resolved", `Resolved compliance blocks for ${frameworkCode}`, {
      frameworkCode,
    });
  }

  await safeLogActivity(orgId, "control_evaluated", `Compliance blocks refreshed for ${frameworkCode}`, {
    frameworkCode,
    missingMandatoryCount: missingMandatoryCodes.length,
  });

  await logAuditEvent({
    organizationId: orgId,
    actorUserId: null,
    actorRole: "system",
    entityType: "compliance_block",
    entityId: null,
    actionType: missingMandatoryCodes.length > 0 ? "COMPLIANCE_BLOCK_CREATED" : "COMPLIANCE_BLOCK_RESOLVED",
    afterState: { frameworkCode, missingMandatoryCount: missingMandatoryCodes.length },
    reason: "automated_enforcement",
  });
}

export async function evaluateFrameworkControls(orgId: string, frameworkCode: string) {
  const supabase = await createSupabaseServerClient();
  if (!orgId || !frameworkCode) return null;
  const correlationId = createCorrelationId();
  await requireEntitlement(orgId, "framework_evaluations");

  const { data: framework, error: fwErr } = await supabase
    .from("compliance_frameworks")
    .select("id, code, title")
    .eq("code", frameworkCode)
    .single();

  if (fwErr || !framework?.id) return null;

  const controls = await safeSelectControls(supabase, framework.id);
  if (!controls.length) return null;

  const controlIds = controls.map((c: any) => c.id);
  const [evidenceRows, controlTaskRows] = await Promise.all([
    safeSelectControlEvidence(supabase, orgId, controlIds),
    safeSelectControlTasks(supabase, orgId, controlIds),
  ]);

  const taskIds = Array.from(new Set(controlTaskRows.map((row) => row.task_id).filter(Boolean)));
  const tasks = await safeSelectTasksByIds(supabase, orgId, taskIds);
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  const evidenceByControl = new Map<string, EvidenceRow[]>();
  for (const row of evidenceRows) {
    if (!evidenceByControl.has(row.control_id)) evidenceByControl.set(row.control_id, []);
    evidenceByControl.get(row.control_id)!.push(row);
  }

  const tasksByControl = new Map<string, TaskRow[]>();
  const entityByControl = new Map<string, string | null>();
  for (const row of controlTaskRows as any[]) {
    const task = taskById.get(row.task_id);
    if (!task) continue;
    if (!tasksByControl.has(row.control_id)) tasksByControl.set(row.control_id, []);
    tasksByControl.get(row.control_id)!.push(task);
    if (!entityByControl.get(row.control_id) && row.entity_id) {
      entityByControl.set(row.control_id, row.entity_id);
    }
  }

  const evaluatedAt = new Date().toISOString();
  const evaluations: any[] = [];
  const missingMandatoryCodes: string[] = [];
  const atRiskCodes: string[] = [];
  let totalWeight = 0;
  let weightedScore = 0;
  let compliantCount = 0;
  let atRiskCount = 0;
  let nonCompliantCount = 0;
  let notApplicableCount = 0;

  for (const control of controls as any[]) {
    const evidenceList = evidenceByControl.get(control.id) ?? [];
    const taskList = tasksByControl.get(control.id) ?? [];
    const entityId =
      evidenceList.find((e) => e.entity_id)?.entity_id ??
      entityByControl.get(control.id) ??
      null;

    const requiredEvidence = Number(control.required_evidence_count ?? 1);
    const isMandatory = control.is_mandatory !== false;
    const weight = Number(control.weight ?? 1);
    const riskLevel = (control.risk_level || "medium").toLowerCase();
    const riskWeight = riskMultiplier(riskLevel);

    const approvedEvidenceCount = evidenceList.filter((e) => (e.status || "pending") === "approved").length;
    const pendingEvidenceCount = evidenceList.filter((e) => (e.status || "pending") === "pending").length;
    const rejectedEvidenceCount = evidenceList.filter((e) => (e.status || "pending") === "rejected").length;

    const overdueTaskCount = taskList.filter((t) => isTaskOverdue(t)).length;
    const openTaskCount = taskList.filter((t) => !isTaskComplete(t)).length;

    const evidenceSatisfied = requiredEvidence <= 0 || approvedEvidenceCount >= requiredEvidence;
    const hasEvidencePending = pendingEvidenceCount > 0;
    const hasEvidenceRejected = rejectedEvidenceCount > 0;

    let status: ControlStatus = "at_risk";

    if (!isMandatory) {
      status = "not_applicable";
    } else if (evidenceSatisfied && openTaskCount === 0) {
      status = "compliant";
    } else if (overdueTaskCount > 0) {
      status = "non_compliant";
    } else if (!evidenceSatisfied && (riskLevel === "critical" || riskLevel === "high")) {
      status = "non_compliant";
    } else if (hasEvidenceRejected && !evidenceSatisfied) {
      status = "at_risk";
    } else if (!evidenceSatisfied || hasEvidencePending || openTaskCount > 0) {
      status = "at_risk";
    }

    if (isMandatory && status === "non_compliant") {
      missingMandatoryCodes.push(control.code);
    }
    if (status === "at_risk") {
      atRiskCodes.push(control.code);
    }

    if (status === "compliant") compliantCount++;
    if (status === "at_risk") atRiskCount++;
    if (status === "non_compliant") nonCompliantCount++;
    if (status === "not_applicable") notApplicableCount++;

    if (status !== "not_applicable") {
      totalWeight += weight * riskWeight;
      weightedScore += weight * riskWeight * scoreFromStatus(status);
    }

    evaluations.push({
      organization_id: orgId,
      entity_id: entityId,
      control_type: "framework_control",
      control_key: `control:${control.id}`,
      required: isMandatory,
      status,
      last_evaluated_at: evaluatedAt,
      details: {
        control_id: control.id,
        framework_id: framework.id,
        framework_code: framework.code,
        code: control.code,
        title: control.title,
        category: control.category || "General",
        risk_level: riskLevel,
        weight,
        required_evidence_count: requiredEvidence,
        approved_evidence_count: approvedEvidenceCount,
        pending_evidence_count: pendingEvidenceCount,
        rejected_evidence_count: rejectedEvidenceCount,
        open_task_count: openTaskCount,
        overdue_task_count: overdueTaskCount,
      },
    });
  }

  await upsertEvaluations(supabase, evaluations);
  await logEvaluationAudit(supabase, orgId, evaluations);

  const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  const snapshotStatus: ControlStatus =
    score === 100 ? "compliant" : score >= 80 ? "at_risk" : "non_compliant";

  const snapshotPayload = JSON.stringify({
    orgId,
    frameworkCode: framework.code,
    score,
    evaluatedAt,
    missingMandatoryCodes,
  });

  try {
    await supabase.from("org_control_evaluations").insert({
      organization_id: orgId,
      control_type: "framework_snapshot",
      control_key: `framework:${framework.code}:${evaluatedAt}`,
      required: true,
      status: snapshotStatus,
      last_evaluated_at: evaluatedAt,
      framework_id: framework.id,
      compliance_score: score,
      total_controls: controls.length,
      satisfied_controls: evaluations.filter((e) => e.status === "compliant").length,
      missing_controls: evaluations.filter((e) => e.status === "non_compliant").length,
      missing_control_codes: missingMandatoryCodes,
      partial_control_codes: atRiskCodes,
      evaluated_by: null,
      snapshot_hash: stableHash(snapshotPayload),
      evaluated_at: evaluatedAt,
      details: {
        framework_code: framework.code,
        missing_mandatory_codes: missingMandatoryCodes,
      },
    });
  } catch {
    // best-effort only
  }

  try {
    await supabase
      .from("org_compliance_status")
      .upsert({
        organization_id: orgId,
        last_framework_code: framework.code,
        last_score: score,
        last_total_controls: controls.length,
        last_missing_controls: nonCompliantCount,
        last_partial_controls: atRiskCount,
        last_evaluated_at: evaluatedAt,
        updated_at: new Date().toISOString(),
      });
  } catch {
    // ignore if table missing
  }

  await refreshComplianceBlocks(supabase, orgId, framework.code, missingMandatoryCodes);

  try {
    await logAuditEvent({
      organizationId: orgId,
      actorUserId: null,
      actorRole: "system",
      entityType: "framework",
      entityId: framework.id,
      actionType: "FRAMEWORK_EVALUATED",
      afterState: {
        frameworkCode: framework.code,
        score,
        totalControls: controls.length,
        missingMandatory: missingMandatoryCodes.length,
        correlation_id: correlationId,
      },
      reason: "evaluation",
    });
  } catch {
    // best-effort logging
  }

  return {
    frameworkId: framework.id as string,
    frameworkCode: framework.code as string,
    score,
    missingMandatoryCodes,
    totalControls: controls.length,
    compliantCount,
    atRiskCount,
    nonCompliantCount,
    notApplicableCount,
    partialCodes: atRiskCodes,
  };
}

export async function getOrgComplianceSnapshot(orgId: string, strict: boolean = false): Promise<ComplianceSnapshot> {
  const supabase = await createSupabaseServerClient();
  if (!orgId) {
    return {
      overallScore: 0,
      frameworkBreakdown: [],
      categoryBreakdown: [],
      trend: { overallDelta: null, frameworkDeltas: [] },
      openViolations: [],
      highRiskControls: [],
      evidenceBacklog: { pending: 0, rejected: 0, total: 0 },
      taskBacklog: { open: 0, overdue: 0, total: 0 },
      forecast: { projectedScoreIn21Days: null, daysToFullCompliance: null, basis: "insufficient_data" },
    };
  }

  const frameworks = await safeSelectFrameworks(supabase, orgId, strict);
  const controlsByFramework: Record<string, any[]> = {};
  await Promise.all(
    frameworks.map(async (framework) => {
      controlsByFramework[framework.id] = await safeSelectControls(
        supabase,
        framework.id,
        strict,
      );
    }),
  );

  const allControls = frameworks.flatMap((fw) => controlsByFramework[fw.id] || []);
  const controlIds = allControls.map((c: any) => c.id);

  const [evidenceRows, controlTaskRows] = await Promise.all([
    safeSelectControlEvidence(supabase, orgId, controlIds, strict),
    safeSelectControlTasks(supabase, orgId, controlIds, strict),
  ]);

  const taskIds = Array.from(new Set(controlTaskRows.map((row) => row.task_id).filter(Boolean)));
  const tasks = await safeSelectTasksByIds(supabase, orgId, taskIds, strict);
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  const evidenceByControl = new Map<string, EvidenceRow[]>();
  for (const row of evidenceRows) {
    if (!evidenceByControl.has(row.control_id)) evidenceByControl.set(row.control_id, []);
    evidenceByControl.get(row.control_id)!.push(row);
  }

  const tasksByControl = new Map<string, TaskRow[]>();
  const entityByControl = new Map<string, string | null>();
  for (const row of controlTaskRows as any[]) {
    const task = taskById.get(row.task_id);
    if (!task) continue;
    if (!tasksByControl.has(row.control_id)) tasksByControl.set(row.control_id, []);
    tasksByControl.get(row.control_id)!.push(task);
    if (!entityByControl.get(row.control_id) && row.entity_id) {
      entityByControl.set(row.control_id, row.entity_id);
    }
  }

  const evidenceBacklog = {
    pending: evidenceRows.filter((e) => (e.status || "pending") === "pending").length,
    rejected: evidenceRows.filter((e) => (e.status || "pending") === "rejected").length,
    total: 0,
  };
  evidenceBacklog.total = evidenceBacklog.pending + evidenceBacklog.rejected;

  const taskBacklog = {
    open: tasks.filter((t) => !isTaskComplete(t)).length,
    overdue: tasks.filter((t) => isTaskOverdue(t)).length,
    total: 0,
  };
  taskBacklog.total = taskBacklog.open;

  let overallWeight = 0;
  let overallScore = 0;
  const frameworkScores: FrameworkScore[] = [];
  const categoryScores: Record<string, CategoryScore> = {};
  const openViolations: ComplianceSnapshot["openViolations"] = [];
  const highRiskControls: ComplianceSnapshot["highRiskControls"] = [];

  for (const framework of frameworks as any[]) {
    const controls = controlsByFramework[framework.id] || [];
    let fwWeight = 0;
    let fwScore = 0;
    let fwRiskWeight = 0;
    let fwRiskScore = 0;
    let compliant = 0;
    let atRisk = 0;
    let nonCompliant = 0;
    let notApplicable = 0;

    for (const control of controls) {
      const evidenceList = evidenceByControl.get(control.id) ?? [];
      const taskList = tasksByControl.get(control.id) ?? [];
      const entityId =
        evidenceList.find((e) => e.entity_id)?.entity_id ??
        entityByControl.get(control.id) ??
        null;

      const requiredEvidence = Number(control.required_evidence_count ?? 1);
      const isMandatory = control.is_mandatory !== false;
      const weight = Number(control.weight ?? 1);
      const riskLevel = (control.risk_level || "medium").toLowerCase();
      const riskWeight = riskMultiplier(riskLevel);

      const approvedEvidenceCount = evidenceList.filter((e) => (e.status || "pending") === "approved").length;
      const pendingEvidenceCount = evidenceList.filter((e) => (e.status || "pending") === "pending").length;
      const rejectedEvidenceCount = evidenceList.filter((e) => (e.status || "pending") === "rejected").length;

      const overdueTaskCount = taskList.filter((t) => isTaskOverdue(t)).length;
      const openTaskCount = taskList.filter((t) => !isTaskComplete(t)).length;

      const evidenceSatisfied = requiredEvidence <= 0 || approvedEvidenceCount >= requiredEvidence;
      let status: ControlStatus = "at_risk";

      if (!isMandatory) {
        status = "not_applicable";
      } else if (evidenceSatisfied && openTaskCount === 0) {
        status = "compliant";
      } else if (overdueTaskCount > 0) {
        status = "non_compliant";
      } else if (!evidenceSatisfied && (riskLevel === "critical" || riskLevel === "high")) {
        status = "non_compliant";
      } else {
        status = "at_risk";
      }

      if (status !== "not_applicable") {
        fwWeight += weight * riskWeight;
        fwScore += weight * riskWeight * scoreFromStatus(status);
        fwRiskWeight += weight * riskWeight;
        fwRiskScore += weight * riskWeight * (status === "non_compliant" ? 1 : status === "at_risk" ? 0.5 : 0);

        overallWeight += weight * riskWeight;
        overallScore += weight * riskWeight * scoreFromStatus(status);
      }

      if (status === "compliant") compliant++;
      if (status === "at_risk") atRisk++;
      if (status === "non_compliant") nonCompliant++;
      if (status === "not_applicable") notApplicable++;

      if (status !== "compliant" && isMandatory) {
        openViolations.push({
          controlId: control.id,
          frameworkId: framework.id,
          frameworkCode: framework.code,
          code: control.code,
          title: control.title,
          status,
          riskLevel,
          category: control.category || "General",
          entityId,
          requiredEvidenceCount: requiredEvidence,
          approvedEvidenceCount,
          pendingEvidenceCount,
          rejectedEvidenceCount,
          openTaskCount,
          overdueTaskCount,
        });
      }

      if ((riskLevel === "high" || riskLevel === "critical") && status !== "compliant") {
        highRiskControls.push({
          controlId: control.id,
          frameworkId: framework.id,
          frameworkCode: framework.code,
          code: control.code,
          title: control.title,
          status,
          riskLevel,
          category: control.category || "General",
        });
      }

      const categoryKey = control.category || "General";
      if (!categoryScores[categoryKey]) {
        categoryScores[categoryKey] = {
          category: categoryKey,
          score: 0,
          riskScore: 0,
          totalControls: 0,
          compliant: 0,
          atRisk: 0,
          nonCompliant: 0,
          notApplicable: 0,
        };
      }
      const cat = categoryScores[categoryKey];
      if (status !== "not_applicable") {
        cat.score += weight * riskWeight * scoreFromStatus(status);
        cat.riskScore += weight * riskWeight * (status === "non_compliant" ? 1 : status === "at_risk" ? 0.5 : 0);
        cat.totalControls += weight * riskWeight;
      }
      if (status === "compliant") cat.compliant++;
      if (status === "at_risk") cat.atRisk++;
      if (status === "non_compliant") cat.nonCompliant++;
      if (status === "not_applicable") cat.notApplicable++;
    }

    const frameworkScore = fwWeight > 0 ? Math.round((fwScore / fwWeight) * 100) : 0;
    const frameworkRiskScore = fwRiskWeight > 0 ? Math.round((fwRiskScore / fwRiskWeight) * 100) : 0;

    frameworkScores.push({
      frameworkId: framework.id,
      frameworkCode: framework.code,
      frameworkTitle: framework.title || framework.code,
      score: frameworkScore,
      riskScore: frameworkRiskScore,
      totalControls: controls.length,
      compliant,
      atRisk,
      nonCompliant,
      notApplicable,
    });
  }

  const overallScorePct = overallWeight > 0 ? Math.round((overallScore / overallWeight) * 100) : 0;
  const categoryBreakdown = Object.values(categoryScores).map((cat) => ({
    ...cat,
    score: cat.totalControls > 0 ? Math.round((cat.score / cat.totalControls) * 100) : 0,
    riskScore: cat.totalControls > 0 ? Math.round((cat.riskScore / cat.totalControls) * 100) : 0,
  }));

  let trend = { overallDelta: null as number | null, frameworkDeltas: [] as Array<{ frameworkCode: string; delta: number | null }> };
  try {
    const { data: snapshotRows } = await supabase
      .from("org_control_evaluations")
      .select("framework_id, compliance_score, last_evaluated_at, details")
      .eq("organization_id", orgId)
      .eq("control_type", "framework_snapshot")
      .order("last_evaluated_at", { ascending: false })
      .limit(200);

    const rows = snapshotRows ?? [];
    if (rows.length >= 2) {
      trend.overallDelta = (rows[0]?.compliance_score ?? 0) - (rows[1]?.compliance_score ?? 0);
    }

    const rowsByFramework: Record<string, any[]> = {};
    for (const row of rows) {
      const frameworkId = row.framework_id as string | undefined;
      if (!frameworkId) continue;
      if (!rowsByFramework[frameworkId]) rowsByFramework[frameworkId] = [];
      rowsByFramework[frameworkId].push(row);
    }

    trend.frameworkDeltas = frameworks.map((fw) => {
      const fwRows = rowsByFramework[fw.id] || [];
      if (fwRows.length < 2) {
        return { frameworkCode: fw.code, delta: null };
      }
      return {
        frameworkCode: fw.code,
        delta: (fwRows[0]?.compliance_score ?? 0) - (fwRows[1]?.compliance_score ?? 0),
      };
    });
  } catch {
    trend = { overallDelta: null, frameworkDeltas: [] };
  }

  highRiskControls.sort((a, b) => {
    const rank = (level: string) => (level === "critical" ? 3 : level === "high" ? 2 : 1);
    return rank(b.riskLevel) - rank(a.riskLevel);
  });

  const completedRecently = tasks.filter((t) => t.completed_at && new Date(t.completed_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
  const evidenceApprovedRecently = evidenceRows.filter((e) => (e.status || "pending") === "approved" && e.created_at && new Date(e.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
  const velocityPerDay = (completedRecently + evidenceApprovedRecently) / 30;
  const backlogItems = taskBacklog.total + evidenceBacklog.total;
  const daysToFull = velocityPerDay > 0 ? Math.ceil(backlogItems / velocityPerDay) : null;

  const projectedScoreIn21Days =
    velocityPerDay > 0 && overallWeight > 0
      ? Math.min(100, Math.round(overallScorePct + (100 - overallScorePct) * Math.min(1, 21 / (daysToFull || 21))))
      : null;

  return {
    overallScore: overallScorePct,
    frameworkBreakdown: frameworkScores,
    categoryBreakdown,
    trend,
    openViolations,
    highRiskControls: highRiskControls.slice(0, 5),
    evidenceBacklog,
    taskBacklog,
    forecast: {
      projectedScoreIn21Days,
      daysToFullCompliance: daysToFull,
      basis: velocityPerDay > 0 ? "30_day_velocity_model" : "insufficient_data",
    },
  };
}

export async function getFrameworkCertificationReadiness(orgId: string) {
  const snapshot = await getOrgComplianceSnapshot(orgId);
  const readinessByFramework: Record<string, { missing: string[]; atRisk: string[]; requiredEvidence: number; openTasks: number }> = {};

  for (const violation of snapshot.openViolations) {
    if (!readinessByFramework[violation.frameworkCode]) {
      readinessByFramework[violation.frameworkCode] = { missing: [], atRisk: [], requiredEvidence: 0, openTasks: 0 };
    }
    const bucket = readinessByFramework[violation.frameworkCode];
    if (violation.status === "non_compliant") bucket.missing.push(violation.code);
    if (violation.status === "at_risk") bucket.atRisk.push(violation.code);

    const missingEvidence = Math.max(0, violation.requiredEvidenceCount - violation.approvedEvidenceCount);
    bucket.requiredEvidence += missingEvidence;
    bucket.openTasks += violation.openTaskCount;
  }

  return snapshot.frameworkBreakdown.map((fw) => {
    const stats = readinessByFramework[fw.frameworkCode] || { missing: [], atRisk: [], requiredEvidence: 0, openTasks: 0 };
    let status: "certifiable" | "conditionally_ready" | "blocked" = "certifiable";
    if (stats.missing.length > 0) status = "blocked";
    else if (stats.atRisk.length > 0 || stats.requiredEvidence > 0 || stats.openTasks > 0) status = "conditionally_ready";

    return {
      frameworkId: fw.frameworkId,
      frameworkCode: fw.frameworkCode,
      frameworkTitle: fw.frameworkTitle,
      status,
      missingControls: stats.missing,
      atRiskControls: stats.atRisk,
      requiredEvidence: stats.requiredEvidence,
      openRemediationTasks: stats.openTasks,
    };
  });
}
