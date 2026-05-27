import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateV1Request } from '@/lib/api-keys/middleware';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { formatZodError, validateBody } from '@/lib/security/api-validation';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/search/saved');

const createSavedSearchSchema = z.object({
  name: z.string().trim().min(1).max(200),
  query: z.string().trim().min(1).max(2000),
  filters: z.record(z.string(), z.unknown()).optional().default({}),
});

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
    log.error({ err: error }, '[V1 API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // v4-031: was on `search:read`. Creating a saved search is a write
    // and should require the new `search:write` scope.
    const auth = await authenticateV1Request(req, {
      requiredScopes: ['search:write'],
    });
    if (!auth.ok) return auth.response;

    const validation = await validateBody(req, createSavedSearchSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const body = validation.data;

    const db = createSupabaseAdminClient();
    const { data, error } = await db
      .from('saved_searches')
      .insert({
        org_id: auth.context.orgId,
        user_id: auth.context.userId,
        name: body.name,
        query: body.query,
        filters: body.filters,
      })
      .select()
      .single();

    if (error) {
      log.error({ err: error }, '[V1 API] saved_searches insert failed:');
      return NextResponse.json(
        { error: 'Failed to save search' },
        { status: 500 },
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    log.error({ err: error }, '[V1 API] Unhandled error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
