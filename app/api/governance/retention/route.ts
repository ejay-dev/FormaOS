import { NextResponse } from 'next/server';
import { requireOrgAdminContext } from '@/lib/identity/org-access';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import {
  applyRetentionPolicy,
  listRetentionExecutions,
  listRetentionPolicies,
} from '@/lib/data-governance/retention';
import { validateCsrfOrigin } from '@/lib/security/csrf';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const rl = await rateLimitApi(request);
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }
    const orgId = new URL(request.url).searchParams.get('orgId');
    const context = await requireOrgAdminContext(orgId);
    const [policies, executions] = await Promise.all([
      listRetentionPolicies(context.orgId),
      listRetentionExecutions(context.orgId),
    ]);
    return NextResponse.json({ ok: true, policies, executions });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Forbidden',
      },
      { status: 403 },
    );
  }
}

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
    const policy = await applyRetentionPolicy(context.orgId, {
      resource_type: String(body.resource_type ?? body.resourceType ?? ''),
      retention_days: Number(body.retention_days ?? body.retentionDays ?? 0),
      action: body.action as 'archive' | 'delete' | 'anonymize',
      exceptions: Array.isArray(body.exceptions)
        ? body.exceptions.map((item) => String(item))
        : [],
      framework:
        (body.framework as 'GDPR' | 'SOC2' | 'HIPAA' | 'custom' | undefined) ??
        'custom',
    });
    return NextResponse.json({ ok: true, policy });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to save policy',
      },
      { status: 400 },
    );
  }
}
