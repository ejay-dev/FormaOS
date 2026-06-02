import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveActiveMembership } from '@/lib/auth/membership-cache';
import { routeLog } from '@/lib/monitoring/server-logger';
import {
  getRuntimeSnapshot,
  resolveControlPlaneEnvironment,

} from '@/lib/control-plane/server';

const log = routeLog('/api/runtime/control-plane');

async function resolveContext() {
  const supabase = await createSupabaseServerClient();
  const membership = await resolveActiveMembership(supabase);

  if (membership.kind === 'unauthorized') {
    return { userId: null, orgId: null };
  }

  // Only bind an org when the active org is unambiguous. For a multi-org
  // user with no active selection we deliberately fall back to a no-org
  // snapshot rather than picking an arbitrary (oldest) org, which could
  // surface another tenant's runtime flags.
  if (membership.kind === 'ok') {
    return { userId: membership.userId, orgId: membership.organizationId };
  }

  return {
    userId: 'userId' in membership ? membership.userId : null,
    orgId: null,
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
    log.error({ err: error }, "[runtime/control-plane] failed:");
    return NextResponse.json(
      { error: 'runtime_unavailable' },
      {
        status: 500,
      },
    );
  }
}
