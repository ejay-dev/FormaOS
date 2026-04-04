import { NextRequest, NextResponse } from 'next/server';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['reports:read'],
    });
    if (!auth.ok) return auth.response;

    const { reportId } = await params;
    const db = createSupabaseAdminClient();
    const { data, error } = await db
      .from('org_saved_reports')
      .select('*')
      .eq('id', reportId)
      .eq('org_id', auth.context.orgId)
      .single();

    if (error || !data)
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['reports:write'],
    });
    if (!auth.ok) return auth.response;

    const { reportId } = await params;
    const body = await req.json();
    const db = createSupabaseAdminClient();

    const { data, error } = await db
      .from('org_saved_reports')
      .update({
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.config && { config: body.config }),
        ...(body.schedule !== undefined && { schedule: body.schedule }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('org_id', auth.context.orgId)
      .select()
      .single();

    if (error || !data)
      return NextResponse.json(
        { error: 'Report not found or update failed' },
        { status: 404 },
      );

    return NextResponse.json(data);
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['reports:write'],
    });
    if (!auth.ok) return auth.response;

    const { reportId } = await params;
    const db = createSupabaseAdminClient();

    const { error } = await db
      .from('org_saved_reports')
      .delete()
      .eq('id', reportId)
      .eq('org_id', auth.context.orgId);

    if (error)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
