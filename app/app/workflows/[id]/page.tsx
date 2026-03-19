import { notFound } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getExecutionDetail,
  getWorkflow,
  getWorkflowExecutionHistory,
} from '@/lib/automation/workflow-store';
import { WorkflowDetailClient } from './WorkflowDetailClient';

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    notFound();
  }

  const workflowId = (await params).id;
  const workflow = await getWorkflow(workflowId, membership.organization_id);
  if (!workflow) {
    notFound();
  }

  const executions = await getWorkflowExecutionHistory(workflow.id, { limit: 25 });
  const latestExecution = executions[0]
    ? await getExecutionDetail(executions[0].id)
    : null;

  return (
    <WorkflowDetailClient
      workflow={workflow}
      executions={executions}
      latestExecution={latestExecution}
    />
  );
}
