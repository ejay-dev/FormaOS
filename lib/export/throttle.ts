/**
 * =========================================================
 * Export Job Throttling
 * =========================================================
 * Rate limiting for enterprise export jobs
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const MAX_CONCURRENT_EXPORTS_PER_ORG = 2;
const MAX_CONCURRENT_EXPORTS_GLOBAL = 10;

/**
 * Enterprise export throttling must be persistent in a serverless environment.
 * We use the database as the source of truth (status='processing') so limits
 * are consistent across Vercel regions/instances.
 */

/**
 * Check if a new export can be started
 */
export async function canStartExport(orgId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const admin = createSupabaseAdminClient();

  const [globalRes, orgRes] = await Promise.all([
    admin
      .from('enterprise_export_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing'),
    admin
      .from('enterprise_export_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing')
      .eq('organization_id', orgId),
  ]);

  const globalActiveCount = globalRes.count ?? 0;
  const orgActiveCount = orgRes.count ?? 0;

  if (globalActiveCount >= MAX_CONCURRENT_EXPORTS_GLOBAL) {
    return {
      allowed: false,
      reason: `System is processing maximum number of exports (${MAX_CONCURRENT_EXPORTS_GLOBAL}). Please try again later.`,
    };
  }

  if (orgActiveCount >= MAX_CONCURRENT_EXPORTS_PER_ORG) {
    return {
      allowed: false,
      reason: `Maximum concurrent exports reached (${MAX_CONCURRENT_EXPORTS_PER_ORG}). Wait for current exports to complete.`,
    };
  }

  return { allowed: true };
}

/**
 * Track export job start
 */
export function trackExportStart(orgId: string, jobId: string): void {
  // No-op: status transitions in enterprise_export_jobs are the source of truth.
  void orgId;
  void jobId;
}

/**
 * Track export job end
 */
export function trackExportEnd(orgId: string, jobId: string): void {
  // No-op: status transitions in enterprise_export_jobs are the source of truth.
  void orgId;
  void jobId;
}

/**
 * Get current export stats
 */
export function getExportStats(): {
  globalActive: number;
  globalLimit: number;
  perOrgLimit: number;
  orgsWithActiveExports: number;
} {
  return {
    globalActive: 0,
    globalLimit: MAX_CONCURRENT_EXPORTS_GLOBAL,
    perOrgLimit: MAX_CONCURRENT_EXPORTS_PER_ORG,
    orgsWithActiveExports: 0,
  };
}

/**
 * Clean up stale export tracking (for cleanup jobs)
 */
export function cleanupStaleExports(staleJobIds: string[]): void {
  // No-op: tracked via DB statuses.
  void staleJobIds;
}
