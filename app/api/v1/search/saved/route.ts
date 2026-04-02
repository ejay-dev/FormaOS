import { NextRequest } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['search:read'],
  });
  if ('error' in auth) return auth.error;

  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('saved_searches')
    .select('*')
    .eq('org_id', auth.orgId)
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .limit(50);

  logV1Access(auth, 'search.saved.list', {});
  return jsonWithContext({ savedSearches: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['search:write'],
  });
  if ('error' in auth) return auth.error;

  const body = await req.json();
  if (!body.name || !body.query) {
    return jsonWithContext({ error: 'name and query required' }, 400);
  }

  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('saved_searches')
    .insert({
      org_id: auth.orgId,
      user_id: auth.userId,
      name: body.name,
      query: body.query,
      filters: body.filters ?? {},
    })
    .select()
    .single();

  if (error) return jsonWithContext({ error: error.message }, 500);

  logV1Access(auth, 'search.saved.create', { searchId: data.id });
  return jsonWithContext(data, 201);
}
