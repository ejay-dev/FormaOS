/**
 * Single Workflow API
 * GET    /api/workflows/[workflowId] - Get workflow
 * PUT    /api/workflows/[workflowId] - Update workflow
 * DELETE /api/workflows/[workflowId] - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import {
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from '@/lib/automation/workflow-store';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const rl = await rateLimitApi(_request);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { workflowId } = await params;
  const workflow = await getWorkflow(workflowId, ctx.orgId);

  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(workflow);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin', 'compliance_officer'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { workflowId } = await params;

  try {
    const rl = await rateLimitApi(request);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const workflow = await updateWorkflow(workflowId, ctx.orgId, body);
    return NextResponse.json(workflow);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update workflow',
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const rl = await rateLimitApi(_request);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin', 'compliance_officer'].includes(ctx.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { workflowId } = await params;

  try {
    await deleteWorkflow(workflowId, ctx.orgId);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete workflow',
      },
      { status: 400 },
    );
  }
}
