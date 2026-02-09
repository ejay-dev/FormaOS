/**
 * =========================================================
 * Automation Failures API
 * =========================================================
 * Returns recent automation job failures for founder support console
 */

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireFounderAccess } from "@/app/app/admin/access";
import { enterpriseMonitor } from "@/lib/observability/enterprise-monitor";
import { handleAdminError } from '@/app/api/admin/_helpers';

interface AutomationFailure {
  id: string;
  jobName: string;
  orgId?: string;
  errorCode: string;
  errorMessage: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export async function GET(request: Request) {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();
    const url = new URL(request.url);

    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const hours = Math.min(parseInt(url.searchParams.get("hours") || "24"), 168); // max 7 days

    const since = new Date();
    since.setHours(since.getHours() - hours);

    // Get failures from audit logs (automation domain)
    const { data: auditLogs, error } = await admin
      .from("org_audit_logs")
      .select("id, organization_id, action, metadata, created_at")
      .ilike("action", "%AUTOMATION%ERROR%")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[automation-failures] Query error:", error);
    }

    // Transform audit logs to failure format
    const failures: AutomationFailure[] = (auditLogs || []).map((log: { id: string; organization_id: string; action: string; metadata: unknown; created_at: string }) => ({
      id: log.id,
      jobName: extractJobName(log.action),
      orgId: log.organization_id,
      errorCode: (log.metadata as Record<string, unknown>)?.error_code as string || "UNKNOWN",
      errorMessage: (log.metadata as Record<string, unknown>)?.error_message as string || "Unknown error",
      timestamp: log.created_at,
      duration: (log.metadata as Record<string, unknown>)?.duration_ms as number | undefined,
      metadata: log.metadata as Record<string, unknown>,
    }));

    // Also get current metrics from enterprise monitor
    const metrics = enterpriseMonitor.exportMetrics();
    const jobMetrics = metrics.jobs.filter(j => j.failures > 0);
    const alerts = metrics.alerts.filter(a => a.type === "job_failure");

    // Summary stats
    const summary = {
      totalFailures: failures.length,
      uniqueJobs: new Set(failures.map(f => f.jobName)).size,
      uniqueOrgs: new Set(failures.filter(f => f.orgId).map(f => f.orgId)).size,
      timeRange: {
        from: since.toISOString(),
        to: new Date().toISOString(),
      },
      activeAlerts: alerts.length,
      jobStats: jobMetrics.map(j => ({
        jobName: j.jobName,
        runs: j.runs,
        failures: j.failures,
        failureRate: j.runs > 0 ? (j.failures / j.runs * 100).toFixed(1) + "%" : "0%",
        avgDuration: j.runs > 0 ? Math.round(j.totalDuration / j.runs) : 0,
        lastRun: j.lastRun,
      })),
    };

    return NextResponse.json({
      failures,
      summary,
      alerts,
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/support/automation-failures');
  }
}

function extractJobName(action: string): string {
  // Extract job name from action like "AUTOMATION_ERROR:billing_sync"
  const parts = action.split(":");
  if (parts.length > 1) {
    return parts.slice(1).join(":").toLowerCase().replace(/_/g, " ");
  }
  return action.toLowerCase().replace(/automation_?error_?/i, "").replace(/_/g, " ") || "unknown";
}
