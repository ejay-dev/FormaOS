import { NextResponse } from 'next/server';
import { isFounder } from '@/lib/utils/founder';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * Debug endpoint — only accessible by founders.
 * Never exposes raw env values in response.
 */
export async function GET() {
  // 1. Require authenticated founder
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isFounder(user.email ?? '', user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Return sanitized diagnostics (no raw env values)
  const hasFounderEmails = Boolean(process.env.FOUNDER_EMAILS?.length);
  const hasFounderIds = Boolean(process.env.FOUNDER_USER_IDS?.length);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    config: {
      hasFounderEmails,
      hasFounderIds,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
