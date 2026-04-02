import { NextRequest } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['search:write'],
  });
  if ('error' in auth) return auth.error;

  const { id } = await params;
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('org_id', auth.orgId)
    .eq('user_id', auth.userId);

  if (error) return jsonWithContext({ error: error.message }, 500);

  logV1Access(auth, 'search.saved.delete', { searchId: id });
  return jsonWithContext({ deleted: true });
}
