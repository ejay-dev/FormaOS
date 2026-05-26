/**
 * Audit 2026-05-26 (M2): this is the LEGACY direct audit-writing
 * path. It was renamed from `@/lib/logger` (the original mislead-
 * ingly-named module) to make the legacy intent obvious. The
 * `no-restricted-imports` ESLint rule in eslint.config.mjs blocks
 * the old import path so new code lands on the canonical surface:
 *
 *   app/app/actions/audit (server-action wrapper)
 *     → lib/audit/log-activity.ts (core)
 *       → lib/audit/org-audit-log.ts (writer; hash-chained)
 *
 * Existing callers of this file write to the same underlying
 * `insertOrgAuditLog`, but bypass the session→org check that the
 * server-action wrapper enforces. Do NOT add new callers; migrate
 * existing ones opportunistically.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { insertOrgAuditLog } from '@/lib/audit/org-audit-log';
import { consoleShim } from '@/lib/monitoring/console-shim';

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
    metadata?: Record<string, unknown>;
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

    const { error } = await insertOrgAuditLog(supabase, payload);

    if (error) {
      consoleShim.error("[AUDIT ERROR] Insert failed:", error.message);
    }
  } catch (error) {
    consoleShim.error("[AUDIT CRASH] Logger failed:", error);
    // Always swallow errors: logging must never block business logic
  }
}
