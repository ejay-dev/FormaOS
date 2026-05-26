import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // v4-031: DELETE is a destructive op; require search:write.
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['search:write'],
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

    if (error) {
      console.error('[V1 API] saved_searches delete failed:', error);
      return NextResponse.json(
        { error: 'Failed to delete saved search' },
        { status: 500 },
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
