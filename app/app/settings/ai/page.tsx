import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Cpu, RefreshCw, ToggleLeft, Database } from 'lucide-react';
import { AiUsageDashboard } from '@/components/ai-assistant/AiUsageDashboard';

export const metadata = { title: 'AI Settings | FormaOS' };

export default async function AiSettingsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();

  // Fetch index stats
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
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">AI Settings</h1>
        <p className="text-muted-foreground">
          Manage AI features, usage, and document indexing.
        </p>
      </div>

      {/* Usage Dashboard */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Usage Overview</h2>
        <AiUsageDashboard />
      </section>

      {/* Indexing Status */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Document Indexing</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <IndexStatCard
            icon={Database}
            label="Total Documents"
            value={totalCount}
          />
          <IndexStatCard
            icon={Cpu}
            label="Indexed"
            value={indexedCount}
            color="text-green-500"
          />
          <IndexStatCard
            icon={RefreshCw}
            label="Pending"
            value={pendingCount}
            color="text-yellow-500"
          />
          <IndexStatCard
            icon={ToggleLeft}
            label="Failed"
            value={failedCount}
            color="text-red-500"
          />
        </div>

        {/* Per-type breakdown */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium">Index by Type</h3>
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

        {/* Reindex Button */}
        <form action="/api/v1/ai/reindex" method="POST">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Reindex All Documents
          </button>
        </form>
      </section>

      {/* AI Features Toggle */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Features</h2>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          <FeatureToggle
            label="AI Assistant"
            description="Enable the AI compliance assistant for your organization."
            enabled={true}
          />
          <FeatureToggle
            label="Auto Evidence Analysis"
            description="Automatically analyze uploaded evidence for control mapping."
            enabled={false}
          />
          <FeatureToggle
            label="AI Gap Analysis"
            description="AI-powered compliance gap identification and recommendations."
            enabled={true}
          />
        </div>
      </section>
    </div>
  );
}

function IndexStatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Database;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <Icon className={`h-5 w-5 ${color ?? 'text-muted-foreground'}`} />
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function FeatureToggle({
  label,
  description,
  enabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </div>
  );
}
