import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateV1Request,
} from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['search:read'],
  });
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('org_id', auth.context.orgId)
    .eq('user_id', auth.context.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
