import { NextRequest, NextResponse } from 'next/server';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url), { status: 303 });
}

export async function GET(request: NextRequest) {
  const state = await fetchSystemState();
  if (!state) return redirectTo(request, '/signin');

  const db = await createSupabaseServerClient();
  const orgId = state.organization.id;
  const now = Date.now();
  const slug = `form-${now.toString(36)}`;

  const { data, error } = await db
    .from('org_forms')
    .insert({
      org_id: orgId,
      title: 'Untitled form',
      description: null,
      slug,
      status: 'draft',
      fields: [],
      settings: {},
      created_by: state.user.id,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    const msg = error?.message ?? 'Unable to create form';
    return redirectTo(request, `/app/forms?error=${encodeURIComponent(msg)}`);
  }

  return redirectTo(request, `/app/forms/builder/${data.id}`);
}
