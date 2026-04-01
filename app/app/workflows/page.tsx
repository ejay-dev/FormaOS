import { ShieldCheck } from 'lucide-react';

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
    <div className="space-y-8 pb-24">
      <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_30%),rgba(2,6,23,0.82)] p-8">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Workflow Automation
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground">
          Enterprise Workflow Engine
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-foreground/70">
          Build compliance workflows with approvals, branching, delays, loops, and execution traces.
        </p>
      </div>

      <WorkflowManagementClient
        initialWorkflows={workflows}
        executionHistory={executions}
        templates={listWorkflowTemplates()}
      />
    </div>
  );
}
