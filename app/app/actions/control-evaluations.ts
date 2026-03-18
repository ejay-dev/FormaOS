"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type ControlStatus = "compliant" | "non_compliant" | "at_risk";

type ComplianceSummary = {
  total: number;
  compliant: number;
  atRisk: number;
  nonCompliant: number;
  requiredNonCompliant: number;
};

type RawTask = {
  id: string;
  title?: string | null;
  status?: string | null;
  due_at?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
};

type RawEvidence = {
  id: string;
  title?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type RawPolicy = {
  id: string;
  title?: string | null;
  status?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  required?: boolean | null;
};

const APPROVED_POLICY_STATUSES = new Set(["approved", "published"]);
const APPROVED_EVIDENCE_STATUSES = new Set(["approved", "verified"]);

const REQUIRED_POLICIES: Array<{ key: string; match: string[]; label: string }> = [
  { key: "information_security_policy", match: ["information security", "security policy"], label: "Information security policy" },
  { key: "incident_management_policy", match: ["incident management", "incident response", "incident"], label: "Incident management policy" },
  { key: "access_control_policy", match: ["access control", "identity access"], label: "Access control policy" },
  { key: "code_of_conduct", match: ["code of conduct", "staff conduct", "worker conduct"], label: "Code of conduct" },
  { key: "complaints_management", match: ["complaints management", "complaint handling", "feedback management"], label: "Complaints management" },
  { key: "patient_privacy_policy", match: ["patient privacy", "privacy policy", "confidentiality"], label: "Patient privacy policy" },
  { key: "infection_control_policy", match: ["infection control", "hygiene", "sterilization"], label: "Infection control policy" },
  { key: "data_breach_response_plan", match: ["data breach", "breach response", "incident response plan"], label: "Data breach response plan" },
  { key: "child_protection_policy", match: ["child protection", "child safety", "mandatory reporting"], label: "Child protection policy" },
  { key: "delivery_and_collection_of_children", match: ["delivery and collection", "collection of children", "arrival and departure"], label: "Delivery and collection of children" },
  { key: "sun_protection_policy", match: ["sun protection", "sun safety"], label: "Sun protection policy" },
  { key: "dignity_and_choice_policy", match: ["dignity and choice", "consumer rights", "resident choice"], label: "Dignity and choice policy" },
  { key: "clinical_governance_framework", match: ["clinical governance", "governance framework"], label: "Clinical governance framework" },
  { key: "serious_incident_response_scheme", match: ["serious incident response scheme", "sirs", "incident reporting"], label: "Serious incident response scheme" },
];

function normalizeKey(input?: string | null) {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isOverdue(task: RawTask) {
  const due = task.due_at || task.due_date;
  if (!due) return false;
  try {
    return new Date(due) < new Date();
  } catch {
    return false;
  }
}

function taskStatus(task: RawTask): ControlStatus {
  const status = (task.status || "").toLowerCase();
  if (status === "completed" || status === "done") return "compliant";
  if (isOverdue(task)) return "non_compliant";
  return "at_risk";
}

function evidenceStatus(evidence: RawEvidence): ControlStatus {
  const status = (evidence.status || "").toLowerCase();
  if (APPROVED_EVIDENCE_STATUSES.has(status)) return "compliant";
  return "at_risk";
}

function policyStatus(policy: RawPolicy): ControlStatus {
  const status = (policy.status || "").toLowerCase();
  if (APPROVED_POLICY_STATUSES.has(status)) return "compliant";
  return "non_compliant";
}

async function safeSelectTasks(supabase: any, orgId: string): Promise<RawTask[]> {
  const attempts = [
    "id,title,status,due_at,completed_at",
    "id,title,status,due_date,completed_at",
    "id,title,status,completed_at",
  ];

  for (const select of attempts) {
    try {
      const { data, error } = await supabase
        .from("org_tasks")
        .select(select)
        .eq("organization_id", orgId);
      if (!error) return (data ?? []) as RawTask[];
    } catch {
      // try next
    }
  }
  return [];
}

async function safeSelectEvidence(supabase: any, orgId: string): Promise<RawEvidence[]> {
  const attempts = [
    "id,title,status,created_at",
    "id,title,state,created_at",
    "id,title,created_at",
  ];

  for (const select of attempts) {
    try {
      const { data, error } = await supabase
        .from("org_evidence")
        .select(select)
        .eq("organization_id", orgId);
      if (error) continue;

      const normalized = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        status: row.status ?? row.state,
        created_at: row.created_at,
      })) as RawEvidence[];

      return normalized;
    } catch {
      // try next
    }
  }

  return [];
}

async function safeSelectPolicies(supabase: any, orgId: string): Promise<RawPolicy[]> {
  const attempts = [
    "id,title,status,updated_at,created_at,required",
    "id,title,status,updated_at,created_at",
    "id,title,status,created_at",
  ];

  for (const select of attempts) {
    try {
      const { data, error } = await supabase
        .from("org_policies")
        .select(select)
        .eq("organization_id", orgId);
      if (!error) return (data ?? []) as RawPolicy[];
    } catch {
      // try next
    }
  }
  return [];
}

async function upsertEvaluations(supabase: any, rows: any[]) {
  if (rows.length === 0) return;
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

export async function evaluateOrgCompliance(orgId: string) {
  const supabase = await createSupabaseServerClient();
  if (!orgId) return;

  const evaluatedAt = new Date().toISOString();
  const [tasks, evidence, policies] = await Promise.all([
    safeSelectTasks(supabase, orgId),
    safeSelectEvidence(supabase, orgId),
    safeSelectPolicies(supabase, orgId),
  ]);

  const evaluations: any[] = [];

  // Tasks
  for (const task of tasks) {
    const status = taskStatus(task);
    evaluations.push({
      organization_id: orgId,
      control_type: "task",
      control_key: `task:${task.id}`,
      required: true,
      status,
      last_evaluated_at: evaluatedAt,
      details: {
        title: task.title,
        status: task.status,
        due_at: task.due_at ?? task.due_date ?? null,
        completed_at: task.completed_at ?? null,
        reason: status === "non_compliant" ? "overdue" : undefined,
      },
    });
  }

  // Evidence
  if (evidence.length === 0) {
    evaluations.push({
      organization_id: orgId,
      control_type: "evidence",
      control_key: "evidence_registry",
      required: true,
      status: "at_risk",
      last_evaluated_at: evaluatedAt,
      details: {
        reason: "no_evidence_uploaded",
      },
    });
  } else {
    for (const item of evidence) {
      evaluations.push({
        organization_id: orgId,
        control_type: "evidence",
        control_key: `evidence:${item.id}`,
        required: true,
        status: evidenceStatus(item),
        last_evaluated_at: evaluatedAt,
        details: {
          title: item.title,
          status: item.status,
          created_at: item.created_at ?? null,
        },
      });
    }
  }

  // Policies (required + reviewed)
  const policyMatches: Record<string, RawPolicy | null> = {};
  for (const policy of policies) {
    const title = policy.title || "";
    const titleLower = title.toLowerCase();
    for (const template of REQUIRED_POLICIES) {
      if (template.match.some((m) => titleLower.includes(m))) {
        policyMatches[template.key] = policy;
      }
    }
  }

  for (const template of REQUIRED_POLICIES) {
    const matched = policyMatches[template.key] || null;
    if (!matched) {
      evaluations.push({
        organization_id: orgId,
        control_type: "policy",
        control_key: `policy:${template.key}`,
        required: true,
        status: "non_compliant",
        last_evaluated_at: evaluatedAt,
        details: {
          policy_label: template.label,
          reason: "missing_required_policy",
        },
      });
      continue;
    }

    const status = policyStatus(matched);
    evaluations.push({
      organization_id: orgId,
      control_type: "policy",
      control_key: `policy:${template.key}`,
      required: true,
      status,
      last_evaluated_at: evaluatedAt,
      details: {
        policy_id: matched.id,
        title: matched.title,
        status: matched.status,
        updated_at: matched.updated_at ?? matched.created_at ?? null,
        reason: status === "non_compliant" ? "unreviewed_policy" : undefined,
      },
    });
  }

  // Additional policies marked required in schema (if column exists)
  const templateKeySet = new Set(REQUIRED_POLICIES.map((p) => p.key));
  for (const policy of policies) {
    if (!policy.required) continue;
    const normalized = normalizeKey(policy.title);
    if (normalized && templateKeySet.has(normalized)) continue;
    const status = policyStatus(policy);
    evaluations.push({
      organization_id: orgId,
      control_type: "policy",
      control_key: `policy:${normalized || policy.id}`,
      required: true,
      status,
      last_evaluated_at: evaluatedAt,
      details: {
        policy_id: policy.id,
        title: policy.title,
        status: policy.status,
        updated_at: policy.updated_at ?? policy.created_at ?? null,
      },
    });
  }

  await upsertEvaluations(supabase, evaluations);
  await logEvaluationAudit(supabase, orgId, evaluations);
}

export async function fetchComplianceSummary(orgId: string): Promise<ComplianceSummary> {
  const supabase = await createSupabaseServerClient();
  if (!orgId) {
    return { total: 0, compliant: 0, atRisk: 0, nonCompliant: 0, requiredNonCompliant: 0 };
  }

  try {
    const { data, error } = await supabase
      .from("org_control_evaluations")
      .select("status, required")
      .eq("organization_id", orgId);

    if (error || !data) {
      return { total: 0, compliant: 0, atRisk: 0, nonCompliant: 0, requiredNonCompliant: 0 };
    }

    const total = data.length;
    const compliant = data.filter((r: any) => r.status === "compliant").length;
    const atRisk = data.filter((r: any) => r.status === "at_risk").length;
    const nonCompliant = data.filter((r: any) => r.status === "non_compliant").length;
    const requiredNonCompliant = data.filter((r: any) => r.required && r.status === "non_compliant").length;

    return {
      total,
      compliant,
      atRisk,
      nonCompliant,
      requiredNonCompliant,
    };
  } catch {
    return { total: 0, compliant: 0, atRisk: 0, nonCompliant: 0, requiredNonCompliant: 0 };
  }
}

export async function fetchComplianceSummaryStrict(orgId: string): Promise<ComplianceSummary> {
  const supabase = await createSupabaseServerClient();
  if (!orgId) {
    throw new Error("Organization context missing");
  }

  const { data, error } = await supabase
    .from("org_control_evaluations")
    .select("status, required")
    .eq("organization_id", orgId);

  if (error || !data) {
    throw new Error("Compliance summary lookup failed");
  }

  const total = data.length;
  const compliant = data.filter((r: any) => r.status === "compliant").length;
  const atRisk = data.filter((r: any) => r.status === "at_risk").length;
  const nonCompliant = data.filter((r: any) => r.status === "non_compliant").length;
  const requiredNonCompliant = data.filter((r: any) => r.required && r.status === "non_compliant").length;

  return {
    total,
    compliant,
    atRisk,
    nonCompliant,
    requiredNonCompliant,
  };
}

export async function fetchRequiredNonCompliantCount() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  try {
    const { data: membership, error } = await supabase
      .from("org_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !membership?.organization_id) return 0;

    const summary = await fetchComplianceSummary(membership.organization_id);
    return summary.requiredNonCompliant;
  } catch {
    return 0;
  }
}
