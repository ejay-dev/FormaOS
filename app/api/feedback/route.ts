import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('api/feedback');

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sentiment?: string; message?: string };
    const { sentiment, message } = body;

    if (!sentiment || !['positive', 'neutral', 'negative'].includes(sentiment)) {
      return NextResponse.json({ error: 'Invalid sentiment' }, { status: 400 });
    }

    // Identify the submitting user (best-effort — feedback is unauthenticated-safe)
    let userId: string | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getUser();
      userId = data?.user?.id ?? null;
    } catch {
      // Not logged in — still accept anonymous feedback
    }

    log.info({ sentiment, userId }, 'Feedback received');

    // Persist to Supabase if table exists, otherwise just log
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.from('feedback').insert({
        sentiment,
        message: message?.slice(0, 2000) ?? null,
        user_id: userId,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Table may not exist yet — feedback is best-effort
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'Feedback submission failed');
    return NextResponse.json({ ok: true }); // Never surface errors to the widget
  }
}
