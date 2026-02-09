import { NextResponse } from 'next/server';

/**
 * Standard error handler for admin API routes.
 *
 * Distinguishes auth/permission errors (403) from server errors (500).
 * Auth errors show "Unavailable (permission)" — never leak stack traces.
 */
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

  console.error(`${route} error:`, error);
  return NextResponse.json(
    { error: `Failed to process ${route}` },
    { status: 500 },
  );
}

/** Standard Cache-Control header for admin GET endpoints (30 s). */
export const ADMIN_CACHE_HEADERS = {
  'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
} as const;
