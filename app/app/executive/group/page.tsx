import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/auth/system-state';
import { getGroupRollup } from '@/lib/executive/multi-org-rollup';
import { OrgComparisonTable } from '@/components/executive/org-comparison-table';
import { BarChart3, Building2, AlertTriangle, Shield } from 'lucide-react';

export const metadata = { title: 'Group Rollup – Executive' };

export default async function GroupRollupPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = createSupabaseServerClient();

  // Find groups where current org is parent
  const { data: groups } = await db
    .from('org_groups')
    .select('id, name')
    .eq('parent_org_id', state.organizationId);

  if (!groups?.length) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Group Rollup</h1>
        <div className="border border-border rounded-lg p-8 bg-card text-center">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">No Organization Groups</h3>
          <p className="text-sm text-muted-foreground">
            Create a group to see consolidated compliance metrics across
            multiple organizations.
          </p>
        </div>
      </div>
    );
  }

  // Use first group for now
  const group = groups[0];
  const rollup = await getGroupRollup(group.id);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{group.name} — Group Rollup</h1>
        <p className="text-muted-foreground">
          Consolidated compliance posture across {rollup.orgs.length}{' '}
          organizations.
        </p>
      </div>

      {/* Summary */}
      {rollup.combined && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Shield className="h-4 w-4" /> Avg Compliance
            </div>
            <p className="text-2xl font-bold">
              {rollup.combined.avgComplianceScore}%
            </p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <BarChart3 className="h-4 w-4" /> Total Controls
            </div>
            <p className="text-2xl font-bold">
              {rollup.combined.totalControls}
            </p>
            <p className="text-xs text-muted-foreground">
              {rollup.combined.totalSatisfied} satisfied
            </p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="text-sm text-muted-foreground mb-1">
              Total Evidence
            </div>
            <p className="text-2xl font-bold">
              {rollup.combined.totalEvidence}
            </p>
          </div>
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 text-sm mb-1">
              <AlertTriangle className="h-4 w-4 text-yellow-600" /> Incidents
              (30d)
            </div>
            <p className="text-2xl font-bold">
              {rollup.combined.totalIncidents}
            </p>
          </div>
        </div>
      )}

      {/* Org Comparison */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Organization Comparison</h2>
        <OrgComparisonTable orgs={rollup.orgs} />
      </div>
    </div>
  );
}
