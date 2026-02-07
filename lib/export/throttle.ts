/**
 * =========================================================
 * Export Job Throttling
 * =========================================================
 * Rate limiting for enterprise export jobs
 */

const MAX_CONCURRENT_EXPORTS_PER_ORG = 2;
const MAX_CONCURRENT_EXPORTS_GLOBAL = 10;

// In-memory tracking (would use Redis in production)
const activeExports = new Map<string, Set<string>>();
let globalActiveCount = 0;

/**
 * Check if a new export can be started
 */
export async function canStartExport(orgId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // Check global limit
  if (globalActiveCount >= MAX_CONCURRENT_EXPORTS_GLOBAL) {
    return {
      allowed: false,
      reason: `System is processing maximum number of exports (${MAX_CONCURRENT_EXPORTS_GLOBAL}). Please try again later.`,
    };
  }

  // Check per-org limit
  const orgExports = activeExports.get(orgId);
  if (orgExports && orgExports.size >= MAX_CONCURRENT_EXPORTS_PER_ORG) {
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
  let orgExports = activeExports.get(orgId);
  if (!orgExports) {
    orgExports = new Set();
    activeExports.set(orgId, orgExports);
  }
  orgExports.add(jobId);
  globalActiveCount++;
}

/**
 * Track export job end
 */
export function trackExportEnd(orgId: string, jobId: string): void {
  const orgExports = activeExports.get(orgId);
  if (orgExports) {
    orgExports.delete(jobId);
    if (orgExports.size === 0) {
      activeExports.delete(orgId);
    }
  }
  globalActiveCount = Math.max(0, globalActiveCount - 1);
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
    globalActive: globalActiveCount,
    globalLimit: MAX_CONCURRENT_EXPORTS_GLOBAL,
    perOrgLimit: MAX_CONCURRENT_EXPORTS_PER_ORG,
    orgsWithActiveExports: activeExports.size,
  };
}

/**
 * Clean up stale export tracking (for cleanup jobs)
 */
export function cleanupStaleExports(staleJobIds: string[]): void {
  for (const [orgId, orgExports] of activeExports.entries()) {
    for (const jobId of staleJobIds) {
      if (orgExports.has(jobId)) {
        orgExports.delete(jobId);
        globalActiveCount = Math.max(0, globalActiveCount - 1);
      }
    }
    if (orgExports.size === 0) {
      activeExports.delete(orgId);
    }
  }
}
