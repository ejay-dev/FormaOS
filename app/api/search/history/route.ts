import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/search/history');

export async function POST(request: Request) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const body = (await request.json().catch(() => ({}))) as {
      query?: string;
      resultsCount?: number;
    };
    if (!body.query || body.query.length > 500) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await supabase.from('search_history').insert({
      user_id: user.id,
      query: body.query,
      results_count: body.resultsCount ?? 0,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.warn({ err }, 'failed to log search history');
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ history: [] }, { status: 401 });

    const { data } = await supabase
      .from('search_history')
      .select('query, results_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({ history: data ?? [] });
  } catch (err) {
    log.warn({ err }, 'failed to load search history');
    return NextResponse.json({ history: [] });
  }
}
