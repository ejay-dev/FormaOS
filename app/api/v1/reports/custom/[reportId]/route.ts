import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { requireCustomReportsEntitlement } from '../_entitlement';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

const updateCustomReportSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).optional(),
    config: z.record(z.string(), z.unknown()).optional(),
    schedule: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    'At least one field must be provided',
  );

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['reports:read'],
    });
    if (!auth.ok) return auth.response;
    const entitlementError = await requireCustomReportsEntitlement(auth.context);
    if (entitlementError) return entitlementError;

    const { reportId } = await params;
    const supabase = createSupabaseOrgClient(auth.context.orgId);
    // .eq('org_id', orgId) appended automatically by the org-scoped client.
    const { data, error } = await supabase
      .from('org_saved_reports')
      .select('*')
      .eq('id', reportId)
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
    const entitlementError = await requireCustomReportsEntitlement(auth.context);
    if (entitlementError) return entitlementError;

    const { reportId } = await params;
    const validation = await validateBody(req, updateCustomReportSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const body = validation.data;

    const supabase = createSupabaseOrgClient(auth.context.orgId);
    const { data, error } = await supabase
      .from('org_saved_reports')
      .update({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.config !== undefined && { config: body.config }),
        ...(body.schedule !== undefined && { schedule: body.schedule }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
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
    const entitlementError = await requireCustomReportsEntitlement(auth.context);
    if (entitlementError) return entitlementError;

    const { reportId } = await params;
    const supabase = createSupabaseOrgClient(auth.context.orgId);
    const { error } = await supabase
      .from('org_saved_reports')
      .delete()
      .eq('id', reportId);

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
