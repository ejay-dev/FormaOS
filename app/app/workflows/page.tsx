
import { WorkflowManagementClient } from './WorkflowManagementClient';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listExecutions, listWorkflows } from '@/lib/automation/workflow-store';
import { listWorkflowTemplates } from '@/lib/automation/templates';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';

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

  const admin = createSupabaseAdminClient();
  const [entitlementCheck, definitionCheck, executionCheck] = await Promise.all([
    admin
      .from('org_entitlements')
      .select('enabled')
      .eq('organization_id', membership.organization_id)
      .eq('feature_key', 'workflow_automation')
      .maybeSingle(),
    admin.from('workflow_definitions').select('id').limit(1),
    admin.from('workflow_executions').select('id').limit(1),
  ]);

  if (entitlementCheck.data?.enabled !== true) {
    return (
      <div className="flex h-full flex-col">
        <div className="page-header">
          <div>
            <h1 className="page-title">Workflow Engine</h1>
            <p className="page-description">
              Build compliance workflows with approvals, branching, and execution traces
            </p>
          </div>
        </div>

        <div className="page-content">
          <section
            className="rounded-[28px] border border-cyan-400/30 bg-cyan-500/10 p-6"
            data-testid="workflow-entitlement-disabled"
          >
            <h2 className="text-lg font-semibold text-foreground">
              Workflow automation is an Enterprise feature
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Creation, template installation, manual runs, toggles, and builder
              edits are disabled until this workspace has the
              workflow_automation entitlement enabled.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="/app/billing"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
              >
                Review Billing
              </a>
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-xl border border-edge-2 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-foreground opacity-50"
              >
                Create workflow
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const missingWorkflowTables = [
    isMissingSupabaseTableError(
      definitionCheck.error,
      'workflow_definitions',
    )
      ? 'workflow_definitions'
      : null,
    isMissingSupabaseTableError(executionCheck.error, 'workflow_executions')
      ? 'workflow_executions'
      : null,
  ].filter(Boolean) as string[];

  if (missingWorkflowTables.length > 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="page-header">
          <div>
            <h1 className="page-title">Workflow Engine</h1>
            <p className="page-description">
              Build compliance workflows with approvals, branching, and execution traces
            </p>
          </div>
        </div>

        <div className="page-content">
          <section
            className="rounded-[28px] border border-amber-400/30 bg-amber-500/10 p-6"
            data-testid="workflow-schema-disabled"
          >
            <h2 className="text-lg font-semibold text-foreground">
              Workflow automation is not available in this environment
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              The backing database tables are not migrated yet:
              {' '}
              <span className="font-mono text-foreground">
                {missingWorkflowTables.join(', ')}
              </span>
              . Workflow creation, template installation, runs, and toggles are
              unavailable until the workflow schema is present.
            </p>
            <div className="mt-5">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-xl border border-edge-2 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-foreground opacity-50"
              >
                Create workflow
              </button>
            </div>
          </section>
        </div>
      </div>
    );
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
