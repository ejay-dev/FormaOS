import { NextResponse } from 'next/server';
import { discoverOrgSsoByEmail } from '@/lib/sso/org-sso';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/sso/discover?email=user@company.com
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }

  const result = await discoverOrgSsoByEmail(email);
  if (!result.ok || !result.orgId) {
    return NextResponse.json({ ok: false, error: result.error ?? 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    orgId: result.orgId,
    enforceSso: Boolean(result.enforceSso),
  });
}

