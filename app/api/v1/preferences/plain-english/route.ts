import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/v1/preferences/plain-english');

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rate.resetAt },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plain_english_mode')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      enabled: profile?.plain_english_mode ?? true,
    });
  } catch (err) {
    log.error({ err }, 'failed to read plain-english preference');
    return NextResponse.json({ enabled: true });
  }
}

export async function PATCH(request: Request) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rate.resetAt },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const enabled = body.enabled === true;

    const { error } = await supabase
      .from('user_profiles')
      .update({ plain_english_mode: enabled })
      .eq('user_id', user.id);

    if (error) {
      log.error({ err: error }, 'failed to update plain-english preference');
      return NextResponse.json(
        { error: 'Failed to save preference' },
        { status: 500 },
      );
    }

    return NextResponse.json({ enabled });
  } catch (err) {
    log.error({ err }, 'unexpected error updating plain-english preference');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
