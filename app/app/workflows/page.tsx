
import { WorkflowManagementClient } from './WorkflowManagementClient';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { listExecutions, listWorkflows } from '@/lib/automation/workflow-store';
import { listWorkflowTemplates } from '@/lib/automation/templates';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';

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
        <PageHero
          eyebrow="Automation · Workflows"
          title="Workflows"
          subtitle="Build compliance workflows with approvals, branching, and execution traces."
        />

        <div className="page-content">
          <section
            className="rounded-xl border border-border bg-card p-6"
            data-testid="workflow-entitlement-disabled"
          >
            <h2 className="text-lg font-semibold text-foreground">
              Workflow automation is available on the Enterprise plan
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Creating workflows, installing templates, running them manually
              and editing them in the builder all need an Enterprise
              subscription for this workspace.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="/app/billing"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Review billing
              </a>
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground opacity-50"
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
        <PageHero
          eyebrow="Automation · Workflows"
          title="Workflows"
          subtitle="Build compliance workflows with approvals, branching, and execution traces."
        />

        <div className="page-content">
          <section
            className="rounded-xl border border-warning/30 bg-warning/10 p-6"
            data-testid="workflow-schema-disabled"
          >
            <h2 className="text-lg font-semibold text-foreground">
              Workflows are not switched on for this environment
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-foreground">
              Creating workflows, installing templates and running them are
              unavailable here. Contact support if you expected this workspace
              to have workflow automation.
            </p>
            <div className="mt-5">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground opacity-50"
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

  const runningCount = executions.filter(
    (execution) => execution.status === 'running',
  ).length;
  const failedCount = executions.filter(
    (execution) => execution.status === 'failed',
  ).length;

  const heroMetrics: PageHeroMetric[] = [
    { label: 'Workflows', value: workflows.length, sub: 'defined' },
    {
      label: 'Runs',
      value: executions.length,
      sub: executions.length > 0 ? 'recorded' : 'none yet',
    },
    {
      label: 'Running',
      value: runningCount,
      sub: runningCount > 0 ? 'in progress' : 'nothing in flight',
    },
    {
      label: 'Failed',
      value: failedCount,
      sub: failedCount > 0 ? 'needs attention' : 'none failed',
      tone: failedCount > 0 ? 'danger' : 'neutral',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <PageHero
        eyebrow="Automation · Workflows"
        title="Workflows"
        subtitle="Build compliance workflows with approvals, branching, and execution traces."
        metrics={heroMetrics}
      />

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
