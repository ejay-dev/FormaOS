import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function resolveOrgId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (error || !data?.organization_id) {
    return null;
  }

  return data.organization_id as string;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = await resolveOrgId(supabase, user.id);
  if (!orgId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const { data } = await supabase
    .from('user_onboarding_state')
    .select('completed, skipped, last_step, updated_at')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .maybeSingle();

  if (data) {
    return NextResponse.json({
      completed: Boolean(data.completed),
      skipped: Boolean(data.skipped),
      lastStep: Number(data.last_step ?? 0),
      updatedAt: data.updated_at,
    });
  }

  const now = new Date().toISOString();
  await supabase.from('user_onboarding_state').insert({
    user_id: user.id,
    org_id: orgId,
    completed: false,
    skipped: false,
    last_step: 0,
    updated_at: now,
  });

  return NextResponse.json({
    completed: false,
    skipped: false,
    lastStep: 0,
    updatedAt: now,
  });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orgId = await resolveOrgId(supabase, user.id);
  if (!orgId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const completed = Boolean(payload?.completed);
  const skipped = Boolean(payload?.skipped);
  const lastStepRaw = Number(payload?.lastStep ?? 0);
  const lastStep = Number.isFinite(lastStepRaw) ? lastStepRaw : 0;

  const now = new Date().toISOString();

  await supabase.from('user_onboarding_state').upsert(
    {
      user_id: user.id,
      org_id: orgId,
      completed,
      skipped,
      last_step: lastStep,
      updated_at: now,
    },
    { onConflict: 'user_id,org_id' },
  );

  return NextResponse.json({
    completed,
    skipped,
    lastStep,
    updatedAt: now,
  });
}
