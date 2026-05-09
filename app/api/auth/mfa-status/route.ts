import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { evaluateMfaGate } from '@/lib/auth/mfa-gate';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/auth/mfa-status');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user) {
      return NextResponse.json(
        { ok: false, error: 'unauthorized' },
        { status: 401 },
      );
    }

    const state = await evaluateMfaGate(supabase);
    return NextResponse.json({
      ok: true,
      requiresMfa: state.required,
      passed: state.passed,
    });
  } catch (err) {
    log.error({ err }, 'mfa-status failed');
    return NextResponse.json(
      { ok: false, error: 'mfa_status_failed' },
      { status: 500 },
    );
  }
}
