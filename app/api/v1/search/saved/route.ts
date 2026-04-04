import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['search:read'],
    });
    if (!auth.ok) return auth.response;

    const db = createSupabaseAdminClient();
    const { data } = await db
      .from('saved_searches')
      .select('*')
      .eq('org_id', auth.context.orgId)
      .eq('user_id', auth.context.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ savedSearches: data ?? [] });
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['search:read'],
    });
    if (!auth.ok) return auth.response;

    const body = await req.json();
    if (!body.name || !body.query) {
      return NextResponse.json(
        { error: 'name and query required' },
        { status: 400 },
      );
    }

    const db = createSupabaseAdminClient();
    const { data, error } = await db
      .from('saved_searches')
      .insert({
        org_id: auth.context.orgId,
        user_id: auth.context.userId,
        name: body.name,
        query: body.query,
        filters: body.filters ?? {},
      })
      .select()
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
