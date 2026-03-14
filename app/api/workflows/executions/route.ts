/**
 * Workflow Executions API
 * GET /api/workflows/executions - List execution history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listExecutions } from '@/lib/automation/workflow-store';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const workflowId = searchParams.get('workflowId') ?? undefined;
  const status = searchParams.get('status') as any;
  const limit = Number(searchParams.get('limit') ?? '50');
  const offset = Number(searchParams.get('offset') ?? '0');

  const result = await listExecutions(membership.organization_id, {
    workflowId,
    status,
    limit,
    offset,
  });

  return NextResponse.json(result);
}
