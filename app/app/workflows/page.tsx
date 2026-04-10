
import { WorkflowManagementClient } from './WorkflowManagementClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listExecutions, listWorkflows } from '@/lib/automation/workflow-store';
import { listWorkflowTemplates } from '@/lib/automation/templates';

export default async function WorkflowsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    return null;
  }

  const [{ workflows }, { executions }] = await Promise.all([
    listWorkflows(membership.organization_id, { limit: 100 }),
    listExecutions(membership.organization_id, { limit: 100 }),
  ]);

  return (
    <div className="flex flex-col h-full">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workflow Engine</h1>
          <p className="page-description">Build compliance workflows with approvals, branching, and execution traces</p>
        </div>
      </div>

      <div className="page-content space-y-4">
      <WorkflowManagementClient
        initialWorkflows={workflows}
        executionHistory={executions}
        templates={listWorkflowTemplates()}
      />
      </div>
    </div>
  );
}
