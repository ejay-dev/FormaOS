import { NextResponse } from 'next/server';
import { discoverOrgSsoByEmail } from '@/lib/sso/org-sso';
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
} from '@/lib/security/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Strict rate limit for SSO discovery — prevents org enumeration
const SSO_DISCOVER_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,       // 5 requests per minute per IP
  keyPrefix: 'rl:sso_discover',
};

// GET /api/sso/discover?email=user@company.com
export async function GET(request: Request) {
  // Rate limit by IP to prevent enumeration
  const identifier = await getClientIdentifier();
  const rateLimitResult = await checkRateLimit(SSO_DISCOVER_LIMIT, identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: createRateLimitHeaders(rateLimitResult) },
    );
  }

  const url = new URL(request.url);
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  const result = await discoverOrgSsoByEmail(email);

  // Return a generic response regardless of whether SSO was found
  // to prevent organization enumeration
  if (!result.ok || !result.orgId) {
    return NextResponse.json(
      { ok: false, ssoAvailable: false },
      { status: 200, headers: createRateLimitHeaders(rateLimitResult) },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      ssoAvailable: true,
      orgId: result.orgId,
      enforceSso: Boolean(result.enforceSso),
    },
    { headers: createRateLimitHeaders(rateLimitResult) },
  );
}
