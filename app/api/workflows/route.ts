/**
 * Workflow Definitions API
 * GET  /api/workflows       - List workflows for org
 * POST /api/workflows       - Create new workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { listWorkflows, createWorkflow } from '@/lib/automation/workflow-store';
import type { WorkflowStatus } from '@/lib/automation/workflow-types';

async function getAuthContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) return null;

  return {
    user,
    orgId: membership.organization_id as string,
    role: membership.role as string,
  };
}

export async function GET(request: NextRequest) {
  const rl = await rateLimitApi(request);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = (searchParams.get('status') ?? undefined) as
    | WorkflowStatus
    | undefined;
  const limit = Number(searchParams.get('limit') ?? '50');
  const offset = Number(searchParams.get('offset') ?? '0');

  const result = await listWorkflows(ctx.orgId, { status, limit, offset });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin', 'compliance_officer'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rl = await rateLimitApi(request);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const workflow = await createWorkflow(ctx.orgId, ctx.user.id, body);
    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create workflow',
      },
      { status: 400 },
    );
  }
}
