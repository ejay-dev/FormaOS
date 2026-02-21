import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  getRuntimeSnapshot,
  resolveControlPlaneEnvironment,
} from '@/lib/control-plane/server';

async function resolveContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      userId: null,
      orgId: null,
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: membership } = await admin
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    userId: user.id,
    orgId: membership?.organization_id ?? null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const environment = resolveControlPlaneEnvironment(
      searchParams.get('environment') ?? undefined,
    );

    const context = await resolveContext();
    const snapshot = await getRuntimeSnapshot({
      environment,
      context,
      includePrivateFlags: false,
    });

    return NextResponse.json(snapshot, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[runtime/control-plane] failed:', error);
    return NextResponse.json(
      { error: 'runtime_unavailable' },
      {
        status: 500,
      },
    );
  }
}
