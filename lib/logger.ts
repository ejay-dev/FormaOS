import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Audit domain categories (for filtering, dashboards, alerts)
 */
export type AuditDomain =
  | "governance"
  | "compliance"
  | "security"
  | "operations"
  | "system";

/**
 * Severity levels for future alerting & reporting
 */
export type AuditSeverity = "low" | "medium" | "high" | "critical";

/**
 * Structured audit payload (backward compatible)
 */
export interface AuditEvent {
  orgId: string;
  action: string;
  target: string;

  domain?: AuditDomain;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}

/**
 * CENTRAL AUDIT LOGGER
 * - Safe: never throws
 * - Backward compatible
 * - Structured for analytics, feeds, and alerts
 */
export async function logActivity(
  orgId: string,
  action: string,
  target: string,
  options?: {
    domain?: AuditDomain;
    severity?: AuditSeverity;
    metadata?: Record<string, any>;
  }
) {
  try {
    if (!orgId || !action) return;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const payload = {
      organization_id: orgId,
      actor_id: user.id,
      actor_email: user.email ?? null,
      action,
      target,

      // Optional structured fields
      domain: options?.domain ?? "system",
      severity: options?.severity ?? "low",
      metadata: options?.metadata ?? {},

      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("org_audit_logs").insert(payload);

    if (error) {
      console.error("[AUDIT ERROR] Insert failed:", error.message);
    }
  } catch (error) {
    console.error("[AUDIT CRASH] Logger failed:", error);
    // Always swallow errors: logging must never block business logic
  }
}