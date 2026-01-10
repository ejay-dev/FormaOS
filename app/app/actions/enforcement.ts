// app/app/actions/enforcement.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity as logger } from "@/lib/logger";
import { requirePermission } from "@/app/app/actions/rbac";
import { logAuditEvent } from "@/app/app/actions/audit-events";

/**
 * GateKey union
 */
export type GateKey =
  | "AUDIT_EXPORT"
  | "CERT_REPORT"
  | "FRAMEWORK_ISO27001"
  | "FRAMEWORK_SOC2"
  | "FRAMEWORK_HIPAA"
  | "FRAMEWORK_NDIS";

/**
 * Compliance block shape (matches DB)
 */
export type ComplianceBlock = {
  id: string;
  organization_id?: string | null;
  gate_key: string;
  reason?: string | null;
  metadata?: any;
  created_at?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
};

/**
 * Strongly typed enforcement error
 */
export class ComplianceBlockedError extends Error {
  public gate: GateKey;
  public blocks: ComplianceBlock[];

  constructor(gate: GateKey, blocks: ComplianceBlock[] = []) {
    const message =
      blocks && blocks.length
        ? `Action blocked by compliance gate: ${gate} (${blocks.length} unresolved block(s))`
        : `Action blocked by compliance gate: ${gate}`;
    super(message);
    this.name = "ComplianceBlockedError";
    this.gate = gate;
    this.blocks = blocks;
    // maintain proper prototype chain
    Object.setPrototypeOf(this, ComplianceBlockedError.prototype);
  }
}

/**
 * Safe wrapper for logging activities.
 * Tries lib/logger first; falls back to inserting a minimal audit row.
 */
async function safeLogActivity(orgId: string, action: string, description: string, metadata?: any) {
  try {
    if (typeof logger === "function") {
      // logger signature in repo: logActivity(orgId, action, description)
      try {
        await (logger as any)(orgId, action, description, metadata);
        return;
      } catch {
        // continue to fallback
      }
    }
  } catch {
    // ignore
  }

  // Fallback: best-effort insert into org_audit_logs
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
    // swallow — logging must never block enforcement flow further
  }
}

/**
 * Return org context for current user (orgId, role, userId)
 */
export async function getOrgIdForUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: membership, error } = await supabase
    .from("org_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error("Organization context lost");
  if (!membership || !membership.organization_id) throw new Error("Organization context lost");

  return {
    orgId: membership.organization_id as string,
    role: (membership as any).role as string | undefined,
    userId: user.id,
  };
}

/**
 * Fetch unresolved compliance blocks for an org (newest-first).
 * If gateKey provided, it filters down to that gate (but still returns matches).
 */
export async function getComplianceBlocks(orgId: string, gateKey?: GateKey) {
  const supabase = await createSupabaseServerClient();

  try {
    let q = supabase
      .from("org_compliance_blocks")
      .select("id, gate_key, reason, metadata, created_at")
      .eq("organization_id", orgId)
      .is("resolved_at", null);

    if (gateKey) q = q.eq("gate_key", gateKey);

    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) {
      // If table missing or RLS blocks, return empty safely.
      return [] as ComplianceBlock[];
    }

    return (data ?? []) as ComplianceBlock[];
  } catch {
    return [] as ComplianceBlock[];
  }
}

/**
 * Enforcement check: ensure there are no unresolved blocks that would prevent the action.
 * This checks for direct gate blocks and relevant FRAMEWORK_* blocks as described.
 * If blocks are found, logs the blocking event and throws ComplianceBlockedError.
 */
export async function requireNoComplianceBlocks(orgId: string, gateKey: GateKey) {
  const supabase = await createSupabaseServerClient();

  try {
    // collect relevant gate keys: the specific gate and canonical framework gates
    const gateCandidates = [
      gateKey,
      "FRAMEWORK_ISO27001",
      "FRAMEWORK_SOC2",
      "FRAMEWORK_HIPAA",
      "FRAMEWORK_NDIS",
    ];

    const { data, error } = await supabase
      .from("org_compliance_blocks")
      .select("id, gate_key, reason, metadata, created_at")
      .eq("organization_id", orgId)
      .is("resolved_at", null)
      .in("gate_key", gateCandidates);

    if (error) {
      throw new ComplianceBlockedError(gateKey, []);
    }

    const blocks = (data ?? []) as ComplianceBlock[];

    if (blocks.length > 0) {
      // Log the enforcement event with metadata (best-effort)
      try {
        await safeLogActivity(orgId, "compliance_blocked", `Blocked gate: ${gateKey}`, {
          gateKey,
          reasonCount: blocks.length,
          blockIds: blocks.map((b) => b.id),
        });
      } catch {
        // swallow
      }

      try {
        await logAuditEvent({
          organizationId: orgId,
          actorUserId: null,
          actorRole: "system",
          entityType: "compliance_block",
          entityId: null,
          actionType: "COMPLIANCE_BLOCK_ENFORCED",
          afterState: { gateKey, blockIds: blocks.map((b) => b.id) },
          reason: "enforcement_gate",
        });
      } catch {
        // swallow
      }

      // Throw a typed error so callers can handle specifically
      throw new ComplianceBlockedError(gateKey, blocks);
    }

    return true;
  } catch (err) {
    // If the thrown error is already ComplianceBlockedError, rethrow
    if (err instanceof ComplianceBlockedError) throw err;
    // Any other unexpected error should not be swallowed — rethrow to surface auth/db issues
    throw err;
  }
}

/**
 * Resolve compliance blocks for a given gate key (mark resolved_at and resolved_by).
 */
export async function resolveComplianceBlocks(orgId: string, gateKey: GateKey) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const membership = await requirePermission("RESOLVE_COMPLIANCE_BLOCK");
  if (membership.orgId !== orgId) {
    throw new Error("Organization mismatch.");
  }

  try {
    const { data: blocks } = await supabase
      .from("org_compliance_blocks")
      .select("id, created_by, gate_key, reason")
      .eq("organization_id", orgId)
      .eq("gate_key", gateKey)
      .is("resolved_at", null);

    if ((blocks ?? []).some((b: any) => b.created_by && b.created_by === user.id)) {
      throw new Error("Segregation violation: cannot resolve your own compliance blocks.");
    }

    const { error } = await supabase
      .from("org_compliance_blocks")
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id ?? null,
      })
      .eq("organization_id", orgId)
      .eq("gate_key", gateKey)
      .is("resolved_at", null);

    if (error) throw new Error(error.message);

    await logAuditEvent({
      organizationId: orgId,
      actorUserId: user.id,
      actorRole: membership.role,
      entityType: "compliance_block",
      entityId: null,
      actionType: "COMPLIANCE_BLOCK_RESOLVED",
      beforeState: { gate_key: gateKey, unresolved_blocks: (blocks ?? []).map((b: any) => b.id) },
      afterState: { gate_key: gateKey, resolved_at: new Date().toISOString() },
      reason: "manual_resolution",
    });

    await safeLogActivity(orgId, "compliance_resolved", `Resolved gate: ${gateKey}`, { gateKey });
    return { success: true };
  } catch (e) {
    throw e;
  }
}
