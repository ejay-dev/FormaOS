"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

function scoreAge(createdAt?: string | null) {
  if (!createdAt) return 0;
  const ageDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (ageDays > 365) return -20;
  if (ageDays > 180) return -10;
  return 0;
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

export async function scoreEvidenceQuality(reason?: string) {
  const supabase = await createSupabaseServerClient();
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: evidenceRows, error } = await supabase
    .from("org_evidence")
    .select("id, title, status, verification_status, created_at")
    .eq("organization_id", permissionCtx.orgId);

  if (error || !evidenceRows) return { success: false, scored: 0 };

  const evidenceIds = evidenceRows.map((e: any) => e.id);
  const { data: evidenceLinks } = await supabase
    .from("control_evidence")
    .select("control_id, evidence_id")
    .eq("organization_id", permissionCtx.orgId)
    .in("evidence_id", evidenceIds);

  const controlIds = Array.from(new Set((evidenceLinks ?? []).map((e: any) => e.control_id).filter(Boolean)));
  const { data: controls } = controlIds.length
    ? await supabase
        .from("compliance_controls")
        .select("id, code, title, risk_level")
        .in("id", controlIds)
    : { data: [] as any[] };

  const controlsById = new Map((controls ?? []).map((c: any) => [c.id, c]));
  const evidenceToControls = new Map<string, any[]>();
  for (const link of evidenceLinks ?? []) {
    if (!evidenceToControls.has(link.evidence_id)) evidenceToControls.set(link.evidence_id, []);
    evidenceToControls.get(link.evidence_id)!.push(controlsById.get(link.control_id));
  }

  let scored = 0;
  for (const evidence of evidenceRows as any[]) {
    const status = (evidence.verification_status || evidence.status || "pending").toLowerCase();
    let base = 60;
    if (status === "approved" || status === "verified") base = 80;
    if (status === "rejected") base = 30;

    const relatedControls = evidenceToControls.get(evidence.id) || [];
    const evidenceText = normalize(`${evidence.title || ""}`);
    const matchBonus = relatedControls.some((c: any) => {
      if (!c) return false;
      const controlText = normalize(`${c.code || ""} ${c.title || ""}`);
      return controlText.split(" ").some((t: string) => t && evidenceText.includes(t));
    })
      ? 10
      : 0;

    const agePenalty = scoreAge(evidence.created_at);
    const score = Math.max(0, Math.min(100, base + matchBonus + agePenalty));

    const riskFlag = score < 50 ? "high" : score < 70 ? "medium" : "low";
    const summary = relatedControls.length
      ? `Mapped to ${relatedControls.length} control(s). Quality score ${score}.`
      : `No control mapping detected. Quality score ${score}.`;

    await supabase
      .from("org_evidence")
      .update({
        quality_score: score,
        risk_flag: riskFlag,
        ai_summary: summary,
        last_scored_at: new Date().toISOString(),
      })
      .eq("id", evidence.id)
      .eq("organization_id", permissionCtx.orgId);

    scored++;
  }

  await logAuditEvent({
    organizationId: permissionCtx.orgId,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "evidence",
    entityId: null,
    actionType: "EVIDENCE_QUALITY_SCORED",
    afterState: { scored },
    reason: reason && reason.trim().length ? reason.trim() : "ai_quality_scoring",
  });

  return { success: true, scored };
}

export async function autoMapEvidenceToControls(evidenceId: string, reason?: string) {
  const supabase = await createSupabaseServerClient();
  const permissionCtx = await requirePermission("EDIT_CONTROLS");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: evidence, error } = await supabase
    .from("org_evidence")
    .select("id, title, file_name, organization_id")
    .eq("id", evidenceId)
    .eq("organization_id", permissionCtx.orgId)
    .maybeSingle();

  if (error || !evidence) throw new Error("Evidence not found");
  if (evidence.organization_id !== permissionCtx.orgId) throw new Error("Organization mismatch.");

  const evidenceText = normalize(`${evidence.title || ""} ${evidence.file_name || ""}`);

  const { data: controls } = await supabase
    .from("compliance_controls")
    .select("id, code, title")
    .order("code", { ascending: true });

  const matchedControls = (controls ?? []).filter((control: any) => {
    const controlText = normalize(`${control.code} ${control.title}`);
    const tokens = controlText.split(" ").filter(Boolean);
    return tokens.some((t) => evidenceText.includes(t));
  });

  for (const control of matchedControls) {
    await supabase.from("control_evidence").upsert(
      {
        organization_id: permissionCtx.orgId,
        control_id: control.id,
        evidence_id: evidence.id,
        status: "pending",
      },
      { onConflict: "organization_id,control_id,evidence_id" }
    );
  }

  await logAuditEvent({
    organizationId: permissionCtx.orgId,
    actorUserId: user.id,
    actorRole: permissionCtx.role,
    entityType: "evidence",
    entityId: evidence.id,
    actionType: "EVIDENCE_AUTO_MAPPED",
    afterState: { matchedControls: matchedControls.map((c: any) => c.code) },
    reason: reason && reason.trim().length ? reason.trim() : "auto_mapping",
  });

  return { success: true, matchedControlCount: matchedControls.length };
}
