import { NextResponse } from 'next/server';
import { routeLog } from '@/lib/monitoring/server-logger';
import type { PlatformAdminAccessContext } from '@/app/app/admin/access';
import { requireAdminApproval } from '@/app/app/admin/access';

/**
 * Standard error handler for admin API routes.
 *
 * Distinguishes auth/permission errors (403) from server errors (500).
 * Auth errors show "Unavailable (permission)" — never leak stack traces.
 */
const log = routeLog('/api/admin/');

export function handleAdminError(error: unknown, route: string) {
  const msg =
    error instanceof Error ? error.message : String(error ?? 'Unknown');

  if (msg === 'Unauthorized' || msg === 'Forbidden') {
    return NextResponse.json(
      { error: 'Unavailable (permission)' },
      { status: 403 },
    );
  }

  if (msg === 'Founder access not configured') {
    return NextResponse.json(
      { error: 'Unavailable (permission)' },
      { status: 403 },
    );
  }

  log.error({ err: error, route }, 'admin route error');
  return NextResponse.json(
    { error: `Failed to process ${route}` },
    { status: 500 },
  );
}

/** Standard Cache-Control header for admin GET endpoints (30 s). */
export const ADMIN_CACHE_HEADERS = {
  'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
} as const;

export async function parseAdminMutationPayload(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const json = await request.json().catch(() => ({}));
    return {
      contentType,
      payload:
        json && typeof json === 'object' && !Array.isArray(json)
          ? (json as Record<string, unknown>)
          : {},
    };
  }

  const form = await request.formData();
  return {
    contentType,
    payload: Object.fromEntries(form.entries()),
  };
}

export function extractAdminReason(
  payload: Record<string, unknown>,
  request?: Request,
) {
  const fromPayload =
    typeof payload.reason === 'string' ? payload.reason.trim() : '';
  const fromHeader = request?.headers.get('x-admin-reason')?.trim() ?? '';
  return fromPayload || fromHeader;
}

export function assertAdminReason(
  reason: string | null | undefined,
  actionLabel = 'This admin change',
) {
  const normalized = reason?.trim() ?? '';
  if (normalized.length < 8) {
    throw new Error(`${actionLabel} requires a reason of at least 8 characters`);
  }
  return normalized;
}

export async function requireAdminChangeControl(args: {
  context: PlatformAdminAccessContext;
  action: string;
  targetType: string;
  targetId?: string | null;
  reason: string;
  requireApproval?: boolean;
}) {
  const normalizedReason = assertAdminReason(args.reason, args.action);

  if (args.requireApproval) {
    await requireAdminApproval({
      context: args.context,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId ?? null,
    });
  }

  return normalizedReason;
}
