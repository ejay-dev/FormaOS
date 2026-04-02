import { NextRequest } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['reports:read'],
  });
  if ('error' in auth) return auth.error;

  const { reportId } = await params;
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from('org_saved_reports')
    .select('*')
    .eq('id', reportId)
    .eq('org_id', auth.orgId)
    .single();

  if (error || !data)
    return jsonWithContext({ error: 'Report not found' }, 404);

  logV1Access(auth, 'reports.get', { reportId });
  return jsonWithContext(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['reports:write'],
  });
  if ('error' in auth) return auth.error;

  const { reportId } = await params;
  const body = await req.json();
  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from('org_saved_reports')
    .update({
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.config && { config: body.config }),
      ...(body.schedule !== undefined && { schedule: body.schedule }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('org_id', auth.orgId)
    .select()
    .single();

  if (error || !data)
    return jsonWithContext({ error: 'Report not found or update failed' }, 404);

  logV1Access(auth, 'reports.update', { reportId });
  return jsonWithContext(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const auth = await authenticateV1Request(req, {
    requiredScopes: ['reports:write'],
  });
  if ('error' in auth) return auth.error;

  const { reportId } = await params;
  const db = createSupabaseAdminClient();

  const { error } = await db
    .from('org_saved_reports')
    .delete()
    .eq('id', reportId)
    .eq('org_id', auth.orgId);

  if (error) return jsonWithContext({ error: 'Delete failed' }, 500);

  logV1Access(auth, 'reports.delete', { reportId });
  return jsonWithContext({ deleted: true });
}
