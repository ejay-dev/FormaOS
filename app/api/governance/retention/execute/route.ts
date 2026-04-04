import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import {
  evaluateRetention,
  executeRetention,
} from '@/lib/data-governance/retention';
import { validateCsrfOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const csrfError = validateCsrfOrigin(request);
  if (csrfError) return csrfError;

  try {
    const rl = await rateLimitApi(request);
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }
    const body = (await request.json()) as Record<string, unknown>;
    const context = await requireOrgAdminContext(
      (body.orgId as string | undefined) ?? null,
    );
    const dryRun = body.dryRun !== false;
    const preview = await evaluateRetention(context.orgId);
    const result = await executeRetention(context.orgId, dryRun);
    return NextResponse.json({ ok: true, dryRun, preview, result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Retention execution failed',
      },
      { status: 400 },
    );
  }
}
