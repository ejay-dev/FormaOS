/**
 * Toggle Workflow Status API
 * POST /api/workflows/[workflowId]/toggle - Toggle active/paused
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getWorkflow, updateWorkflow } from '@/lib/automation/workflow-store';
import type { WorkflowStatus } from '@/lib/automation/workflow-types';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['owner', 'admin', 'compliance_officer'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { workflowId } = await params;
  const orgId = membership.organization_id as string;
  const workflow = await getWorkflow(workflowId, orgId);

  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const newStatus: WorkflowStatus =
    workflow.status === 'active' ? 'paused' : 'active';

  const updated = await updateWorkflow(workflowId, orgId, {
    status: newStatus,
  });

  return NextResponse.json({ status: updated.status });
}
