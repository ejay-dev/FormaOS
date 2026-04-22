import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token';

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

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('email_preferences')
    .upsert(
      {
        user_id: payload.userId,
        unsubscribed_all: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }

  return new NextResponse(null, { status: 200 });
}
