import { notFound } from 'next/navigation';

import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getExecutionDetailForOrg,
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

  const { data: entitlement } = await supabase
    .from('org_entitlements')
    .select('enabled')
    .eq('organization_id', membership.organization_id)
    .eq('feature_key', 'workflow_automation')
    .maybeSingle();

  if (entitlement?.enabled !== true) {
    return (
      <div className="space-y-6 p-6">
        <section className="rounded-[28px] border border-border bg-card p-6">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-foreground" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Workflow automation is not enabled
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Builder edits, manual runs, execution history, and workflow
                settings require the workflow_automation entitlement.
              </p>
              <Link
                href="/app/workflows"
                className="mt-5 inline-flex rounded-xl border bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Back to Workflows
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const workflowId = (await params).id;
  const workflow = await getWorkflow(workflowId, membership.organization_id);
  if (!workflow) {
    notFound();
  }

  const executions = await getWorkflowExecutionHistory(
    workflow.id,
    membership.organization_id,
    { limit: 25 },
  );
  const latestExecution = executions[0]
    ? await getExecutionDetailForOrg(
        executions[0].id,
        membership.organization_id,
      )
    : null;

  return (
    <WorkflowDetailClient
      workflow={workflow}
      executions={executions}
      latestExecution={latestExecution}
    />
  );
}
