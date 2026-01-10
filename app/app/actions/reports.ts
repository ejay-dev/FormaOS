"use server";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getOrgIdForUser, requireNoComplianceBlocks } from "@/app/app/actions/enforcement";
import { logActivity } from "@/lib/logger";
import { requirePermission } from "@/app/app/actions/rbac";
import { requireEntitlement } from "@/lib/billing/entitlements";
import { logAuditEvent } from "@/app/app/actions/audit-events";
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { createCorrelationId } from "@/lib/security/correlation";

type AuditBundleRow = {
  orgId: string;
  orgName: string;
  generatedAt: string;
  frameworkCode: string;
  complianceScore: number;
  totalControls: number;
  missingControls: number;
  missingCodes: string[];
  partialCodes: string[];
  policies: Array<{ title: string; status: string; updated_at: string | null }>;
  evidence: Array<{ title: string; status: string; created_at: string | null }>;
  tasks: Array<{ title: string; status: string; completed_at: string | null }>;
  auditLogs: Array<{ action: string; target: string; actor_email?: string | null; created_at: string }>;
};

function toDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

function safeFilePart(input: string) {
  return input.replace(/[^\w\-]+/g, "_").slice(0, 60);
}

async function safeSelectPolicies(supabase: any, orgId: string) {
  const attempts = [
    "title,status,updated_at",
    "title,status,last_updated_at",
    "title,status,created_at",
    "title,created_at",
  ];

  let lastError: string | null = null;
  for (const select of attempts) {
    try {
      const { data, error } = await supabase
        .from("org_policies")
        .select(select)
        .eq("organization_id", orgId)
        .order(select.includes("updated_at") ? "updated_at" : select.includes("last_updated_at") ? "last_updated_at" : "created_at", { ascending: false });
      if (!error) return data ?? [];
      lastError = error.message;
    } catch {
      // try next
    }
  }
  throw new Error(lastError || "Failed to load policies");
}

async function safeSelectEvidence(supabase: any, orgId: string) {
  const attempts = [
    "title,status,created_at",
    "title,verification_status,created_at",
    "title,created_at",
  ];

  let lastError: string | null = null;
  for (const select of attempts) {
    try {
      const { data, error } = await supabase
        .from("org_evidence")
        .select(select)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (!error) {
        return (data ?? []).map((row: any) => ({
          title: row.title,
          status: row.status ?? row.verification_status ?? null,
          created_at: row.created_at ?? null,
        }));
      }
      lastError = error.message;
    } catch {
      // try next
    }
  }
  throw new Error(lastError || "Failed to load evidence");
}

async function safeSelectTasks(supabase: any, orgId: string) {
  const attempts = [
    "title,status,completed_at",
    "title,status,updated_at",
    "title,status",
    "title",
  ];

  let lastError: string | null = null;
  for (const select of attempts) {
    try {
      const { data, error } = await supabase
        .from("org_tasks")
        .select(select)
        .eq("organization_id", orgId)
        .order(select.includes("completed_at") ? "completed_at" : "updated_at", { ascending: false });
      if (!error) {
        return (data ?? []).map((row: any) => ({
          title: row.title,
          status: row.status ?? null,
          completed_at: row.completed_at ?? null,
        }));
      }
      lastError = error.message;
    } catch {
      // try next
    }
  }
  throw new Error(lastError || "Failed to load tasks");
}

async function safeSelectAuditLogs(supabase: any, orgId: string) {
  const attempts = [
    "action,target,actor_email,created_at",
    "action,target,created_at",
    "activity_type,description,created_at",
  ];

  let lastError: string | null = null;
  for (const select of attempts) {
    try {
      const table = select.includes("activity_type") ? "org_audit_log" : "org_audit_logs";
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(80);
      if (!error) {
        if (table === "org_audit_log") {
          return (data ?? []).map((row: any) => ({
            action: row.activity_type,
            target: row.description,
            actor_email: null,
            created_at: row.created_at,
          }));
        }
        return data ?? [];
      }
      lastError = error.message;
    } catch {
      // try next
    }
  }
  throw new Error(lastError || "Failed to load audit logs");
}

/**
 * ✅ Existing function (kept)
 */
export async function generateAuditSummary() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const permissionCtx = await requirePermission("EXPORT_REPORTS");

  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) throw new Error("No organization found");
  const orgId = membership.organization_id;
  await requireEntitlement(orgId, "reports");

  const { data: evidenceData, error } = await supabase
    .from("org_tasks")
    .select(`
      title,
      status,
      completed_at,
      evidence:org_evidence (
        title,
        file_path,
        created_at
      )
    `)
    .eq("organization_id", orgId)
    .eq("status", "completed");

  if (error) throw error;

  await logActivity(orgId, "audit_export", "Generated Comprehensive Audit Summary");
  await logAuditEvent({
    organizationId: orgId,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "report",
    entityId: null,
    actionType: "AUDIT_SUMMARY_EXPORTED",
    afterState: { type: "audit_summary" },
    reason: "export",
  });
  return evidenceData;
}

/**
 * ✅ Phase 8: Backend Audit Bundle Engine
 * - Enforces compliance gate (AUDIT_EXPORT)
 * - Aggregates org state
 * - Generates PDF on SERVER
 * - Uploads to Supabase Storage (private bucket)
 * - Returns signed URL
 */
export async function generateAuditBundlePdf(frameworkCode: string = "ISO27001") {
  // 1) Identify org + enforce gates
  const membership = await requirePermission("EXPORT_REPORTS");
  const { orgId } = await getOrgIdForUser();
  if (membership.orgId !== orgId) throw new Error("Organization mismatch.");
  const identifier = await getClientIdentifier();
  const rateLimit = await checkRateLimit(RATE_LIMITS.EXPORT, identifier, membership.userId);
  if (!rateLimit.success) {
    throw new Error("Export rate limit exceeded. Please try again later.");
  }
  const correlationId = createCorrelationId();
  await requireEntitlement(orgId, "audit_export");
  await requireNoComplianceBlocks(orgId, "AUDIT_EXPORT");

  const supabase = await createSupabaseServerClient();

  // 2) Fetch org name (best-effort)
  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const orgName = orgRow?.name || "FormaOS Client";

  // 3) Latest compliance evaluation for framework (framework snapshots only)
  let frameworkId: string | null = null;
  try {
    const { data: frameworkRow } = await supabase
      .from("compliance_frameworks")
      .select("id")
      .eq("code", frameworkCode)
      .maybeSingle();
    frameworkId = frameworkRow?.id ?? null;
  } catch {
    frameworkId = null;
  }

  let evalRow: any = null;
  try {
    let evalQuery = supabase
      .from("org_control_evaluations")
      .select("compliance_score,total_controls,missing_control_codes,partial_control_codes,framework_id,created_at,evaluated_at,last_evaluated_at")
      .eq("organization_id", orgId)
      .eq("control_type", "framework_snapshot");

    if (frameworkId) evalQuery = evalQuery.eq("framework_id", frameworkId);

    const { data, error } = await evalQuery
      .order("last_evaluated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    evalRow = data;
  } catch {
    try {
      let fallbackQuery = supabase
        .from("org_control_evaluations")
        .select("framework_id, created_at")
        .eq("organization_id", orgId);
      if (frameworkId) fallbackQuery = fallbackQuery.eq("framework_id", frameworkId);
      const { data } = await fallbackQuery
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      evalRow = data ?? null;
    } catch {
      evalRow = null;
    }
  }

  const complianceScore = evalRow?.compliance_score ?? 0;
  const totalControls = evalRow?.total_controls ?? 0;
  const missingCodes = (evalRow?.missing_control_codes ?? []) as string[];
  const partialCodes = (evalRow?.partial_control_codes ?? []) as string[];

  // 4) Fetch core datasets (defensive)
  const [policiesData, evidenceData, tasksData, auditLogs] = await Promise.all([
    safeSelectPolicies(supabase, orgId),
    safeSelectEvidence(supabase, orgId),
    safeSelectTasks(supabase, orgId),
    safeSelectAuditLogs(supabase, orgId),
  ]);

  const bundleData: AuditBundleRow = {
    orgId,
    orgName,
    generatedAt: new Date().toISOString(),
    frameworkCode,
    complianceScore,
    totalControls,
    missingControls: missingCodes.length,
    missingCodes,
    partialCodes,
    policies: policiesData,
    evidence: evidenceData,
    tasks: tasksData,
    auditLogs,
  };

  // 5) Generate PDF on server (PDFKit)
  const pdfBuffer = await buildAuditBundlePdf(bundleData);

  // 6) Upload to Storage (private)
  const datePart = new Date().toISOString().slice(0, 10);
  const fileName = `Audit_Bundle_${safeFilePart(orgName)}_${frameworkCode}_${Date.now()}.pdf`;
  const storagePath = `${orgId}/${datePart}/${fileName}`;

  const upload = await supabase.storage
    .from("audit-bundles")
    .upload(storagePath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (upload.error) {
    throw new Error(`Storage upload failed: ${upload.error.message}`);
  }

  // 7) Create a signed URL (1 hour)
  const signed = await supabase.storage
    .from("audit-bundles")
    .createSignedUrl(storagePath, 60 * 60);

  if (signed.error) {
    throw new Error(`Signed URL failed: ${signed.error.message}`);
  }

  // 8) Write audit log entry (immutable)
  await logActivity(orgId, "audit_export", `Generated Audit Bundle PDF (${frameworkCode}) @ ${storagePath}`);
  try {
    const { error: exportErr } = await supabase.from("org_exports").insert({
      organization_id: orgId,
      export_type: "AUDIT_BUNDLE",
      framework_id: frameworkId,
      status: "generated",
      created_by: membership.userId,
      payload: {
        storagePath,
        frameworkCode,
        complianceScore,
        totalControls,
        missing: missingCodes.length,
        correlation_id: correlationId,
      },
    });
    if (exportErr) throw exportErr;
  } catch {
    await supabase.from("org_exports").insert({
      organization_id: orgId,
      type: "AUDIT_BUNDLE",
      framework_code: frameworkCode,
      snapshot_hash: null,
      file_path: storagePath,
      created_by: membership.userId,
      payload: { correlation_id: correlationId },
    });
  }
  await logAuditEvent({
    organizationId: orgId,
    actorUserId: membership.userId,
    actorRole: membership.role,
    entityType: "export",
    entityId: null,
    actionType: "AUDIT_BUNDLE_EXPORTED",
    afterState: {
      frameworkCode,
      storagePath,
      complianceScore,
      totalControls,
      missing: missingCodes.length,
      correlation_id: correlationId,
    },
    reason: "export",
  });

  revalidatePath("/app/reports");

  return {
    success: true,
    filePath: storagePath,
    signedUrl: signed.data.signedUrl,
    meta: {
      orgName,
      frameworkCode,
      complianceScore,
      totalControls,
      missing: missingCodes.length,
      policies: bundleData.policies.length,
      evidenceTotal: bundleData.evidence.length,
      evidenceApproved: bundleData.evidence.filter(e => e.status === "approved").length,
      logsIncluded: bundleData.auditLogs.length,
    },
  };
}

/**
 * Internal: PDF builder
 */
async function buildAuditBundlePdf(data: AuditBundleRow): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  const drawH1 = (text: string) => {
    page.drawText(text, { x: margin, y, size: 20, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 28;
  };

  const drawH2 = (text: string) => {
    page.drawText(text, { x: margin, y, size: 12, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
    y -= 18;
  };

  const drawP = (text: string) => {
    const size = 10;
    const lineHeight = 14;
    const maxWidth = width - margin * 2;
    const words = text.split(" ");
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      const tw = font.widthOfTextAtSize(test, size);
      if (tw > maxWidth) {
        page.drawText(line, { x: margin, y, size, font, color: rgb(0.2, 0.2, 0.2) });
        y -= lineHeight;
        line = w;
      } else {
        line = test;
      }
    }
    if (line) {
      page.drawText(line, { x: margin, y, size, font, color: rgb(0.2, 0.2, 0.2) });
      y -= lineHeight;
    }
  };

  drawH1("Compliance Audit Bundle");
  drawP(`Organization: ${data.orgName}`);
  drawP(`Framework: ${data.frameworkCode}`);
  drawP(`Generated: ${toDate(data.generatedAt)}`);
  drawP(`Org ID: ${data.orgId}`);
  y -= 10;

  drawH2("Executive Summary");
  drawP(`Compliance Score: ${data.complianceScore}%`);
  drawP(`Total Controls: ${data.totalControls}`);
  drawP(`Missing Controls: ${data.missingControls}`);
  drawP(`Policies: ${data.policies.length}`);
  drawP(`Evidence Items: ${data.evidence.length}`);
  drawP(`Approved Evidence: ${data.evidence.filter(e => e.status === "approved").length}`);
  drawP(`Recent Governance Actions Included: ${data.auditLogs.length}`);
  y -= 10;

  if (data.missingControls > 0) {
    drawH2("Priority Gaps (Missing Control Codes)");
    drawP(data.missingCodes.slice(0, 60).join(", ") || "—");
    y -= 8;
  }

  const addSection = (title: string, lines: string[]) => {
    const sectionPage = pdfDoc.addPage([595.28, 841.89]);
    const { height: ph } = sectionPage.getSize();
    let py = ph - margin;
    sectionPage.drawText(title, { x: margin, y: py, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    py -= 22;
    const size = 10;
    const lineHeight = 14;
    const maxWidth = width - margin * 2;
    for (const line of lines) {
      const words = line.split(" ");
      let chunk = "";
      for (const w of words) {
        const test = chunk ? chunk + " " + w : w;
        const tw = font.widthOfTextAtSize(test, size);
        if (tw > maxWidth) {
          sectionPage.drawText(chunk, { x: margin, y: py, size, font, color: rgb(0.2, 0.2, 0.2) });
          py -= lineHeight;
          chunk = w;
        } else {
          chunk = test;
        }
      }
      if (chunk) {
        sectionPage.drawText(chunk, { x: margin, y: py, size, font, color: rgb(0.2, 0.2, 0.2) });
        py -= lineHeight;
      }
      if (py < margin + lineHeight) {
        break;
      }
    }
  };

  addSection(
    "Policy Inventory",
    data.policies.slice(0, 200).map((p, idx) => `${idx + 1}. ${p.title} — ${p.status || "—"} — ${toDate(p.updated_at)}`)
  );
  addSection(
    "Evidence Ledger",
    data.evidence.slice(0, 250).map((e, idx) => `${idx + 1}. ${e.title} — ${e.status || "—"} — ${toDate(e.created_at)}`)
  );
  addSection(
    "Task Ledger",
    data.tasks.slice(0, 250).map((t, idx) => `${idx + 1}. ${t.title} — ${t.status || "—"} — ${toDate(t.completed_at)}`)
  );
  addSection(
    "Audit Trail (Recent Governance Actions)",
    data.auditLogs.slice(0, 120).map((l, idx) => `${idx + 1}. ${l.action || "—"} — ${l.target || "—"} — ${toDate(l.created_at)}${l.actor_email ? ` | ${l.actor_email}` : ""}`)
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
