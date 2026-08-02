import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { RefreshCw } from 'lucide-react';
import { AiUsageDashboard } from '@/components/ai-assistant/AiUsageDashboard';
import {
  SettingsPageHeader,
  SettingsPageShell,
} from '@/components/settings/settings-page-header';
import { entitlementName } from '@/lib/billing/entitlement-labels';
import { isAIConfigured } from '@/lib/ai/streaming';

export const metadata = { title: 'AI assistant | Settings | FormaOS' };

const CAPABILITIES = [
  {
    label: 'Assistant',
    description: 'Ask questions about your controls, policies, and evidence.',
  },
  {
    label: 'Evidence analysis',
    description: 'Summarises uploaded evidence against the control it supports.',
  },
  {
    label: 'Gap analysis',
    description: 'Points out controls with thin or missing coverage.',
  },
];

export default async function AiSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    error?: string;
    reindexed?: string;
    reindexErrors?: string;
  }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
  const notices = (await searchParams) ?? {};

  const db = await createSupabaseServerClient();
  const { data: entitlement } = await db
    .from('org_entitlements')
    .select('enabled')
    .eq('organization_id', state.organization.id)
    .eq('feature_key', 'ai_assistant')
    .maybeSingle();
  const aiConfigured = isAIConfigured();
  const aiEntitled = entitlement?.enabled === true;
  const canManageAi = state.role === 'owner' || state.role === 'admin';
  const reindexDisabled = !aiConfigured || !aiEntitled || !canManageAi;
  const aiAvailable = aiConfigured && aiEntitled;

  const { data: indexStats } = await db
    .from('ai_index_status')
    .select('source_type, status')
    .eq('org_id', state.organization.id);

  const stats = indexStats ?? [];
  const indexedCount = stats.filter((s) => s.status === 'indexed').length;
  const pendingCount = stats.filter((s) => s.status === 'pending').length;
  const failedCount = stats.filter((s) => s.status === 'failed').length;
  const totalCount = stats.length;

  const typeCounts: Record<string, number> = {};
  for (const s of stats) {
    typeCounts[s.source_type] = (typeCounts[s.source_type] ?? 0) + 1;
  }

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        title="AI assistant"
        description="What the assistant can do in this workspace, and which documents it has indexed."
      />

      {notices.error || notices.reindexed ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            notices.error
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-success/30 bg-success/10 text-success'
          }`}
        >
          {notices.error
            ? 'Reindexing could not be started. Try again in a few minutes.'
            : `Reindexed ${notices.reindexed} document${notices.reindexed === '1' ? '' : 's'}, ${notices.reindexErrors ?? 0} failed.`}
        </div>
      ) : null}

      {!aiAvailable ? (
        <section className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          {!aiConfigured
            ? 'AI features are not set up for this workspace yet. Contact support and we will switch them on.'
            : `${entitlementName('ai_assistant')} is not included in your current plan.`}
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          What the assistant can do
        </h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {CAPABILITIES.map((capability) => (
            <div
              key={capability.label}
              className="flex items-start justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {capability.label}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {capability.description}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm ${
                  aiAvailable ? 'text-success' : 'text-muted-foreground'
                }`}
              >
                {aiAvailable ? 'Available' : 'Not available'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Usage</h2>
        <AiUsageDashboard />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Document indexing
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <IndexStatCard label="Documents" value={totalCount} />
          <IndexStatCard label="Indexed" value={indexedCount} />
          <IndexStatCard label="Pending" value={pendingCount} />
          <IndexStatCard
            label="Failed"
            value={failedCount}
            tone={failedCount > 0 ? 'destructive' : undefined}
          />
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium">Indexed by type</h3>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span className="text-sm capitalize">
                  {type.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {count}
                </span>
              </div>
            ))}
            {Object.keys(typeCounts).length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No documents indexed yet.
              </div>
            )}
          </div>
        </div>

        <form action="/api/v1/ai/reindex" method="POST">
          <button
            type="submit"
            disabled={reindexDisabled}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Reindex all documents
          </button>
        </form>
      </section>
    </SettingsPageShell>
  );
}

function IndexStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'destructive';
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p
        className={`text-2xl font-semibold ${
          tone === 'destructive' ? 'text-destructive' : 'text-foreground'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
