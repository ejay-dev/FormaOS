import { NextResponse } from 'next/server';
import { runOrgPurgeTick } from '@/lib/admin/org-purge';
import { authLogger } from '@/lib/observability/structured-logger';
import { verifyVercelCronRequest } from '@/lib/security/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Audit 2026-05-27 — companion to /api/cron/process-user-purges. Drives
// the final phase of the org-retire lifecycle: pick retired orgs whose
// 90-day grace window has elapsed, verify their export job actually
// completed, then cascade-delete the organizations row.
//
// Default-off. Without ORG_PURGE_ENABLED=true the tick logs that it
// skipped and exits — gives ops a controlled rollout: deploy first,
// confirm the cron entry is wired and the log line shows up nightly,
// THEN flip the env var on once a target org is ready to purge.

export async function GET(request: Request) {
  const authError = verifyVercelCronRequest(request);
  if (authError) return authError;

  try {
    const result = await runOrgPurgeTick();
    return NextResponse.json({
      ok: true,
      enabled: result.enabled,
      picked: result.picked,
      outcomes: result.outcomes,
    });
  } catch (err) {
    authLogger.error(
      'org_purge_processor_threw',
      err instanceof Error ? err : new Error(String(err)),
    );
    return NextResponse.json(
      { ok: false, error: 'processor_failed' },
      { status: 500 },
    );
  }
}
