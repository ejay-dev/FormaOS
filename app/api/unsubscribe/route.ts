import { NextResponse, type NextRequest } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token';
import { unsubscribeUserFromAllEmail } from '@/lib/email/unsubscribe';

/**
 * RFC 8058 one-click unsubscribe handler. Mail clients that honor the
 * `List-Unsubscribe` and `List-Unsubscribe-Post` headers POST here with
 * `List-Unsubscribe=One-Click` and no user interaction. Responds 200 with
 * an empty body on success so clients surface the unsubscribe immediately.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const payload = token ? verifyUnsubscribeToken(token) : null;

  if (!payload) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 });
  }

  const { ok } = await unsubscribeUserFromAllEmail(payload.userId);

  if (!ok) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
