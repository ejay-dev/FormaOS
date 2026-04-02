import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  CrossMapMatrix,
  DeduplicationOpportunities,
} from '@/components/compliance/cross-map-matrix';
import { Shield, GitMerge, Zap, Layers } from 'lucide-react';

export default async function CrossMapPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = await createSupabaseServerClient();

  const { data: mappings } = await db
    .from('framework_control_mappings')
    .select('*');
  const { data: groups } = await db.from('control_groups').select('*');
  const { data: groupMembers } = await db
    .from('control_group_members')
    .select('*');

  const { data: orgControls } = await db
    .from('org_controls')
    .select('framework, control_id, status')
    .eq('organization_id', state.organization.id);

  // Build frameworks list
  const frameworkSet = new Set<string>();
  for (const m of mappings || []) {
    frameworkSet.add(m.source_framework);
    frameworkSet.add(m.target_framework);
  }
  const frameworks = Array.from(frameworkSet).sort();

  // Build deduplication opportunities
  const controlStatus = new Map<string, string>();
  for (const c of orgControls || []) {
    controlStatus.set(`${c.framework}|${c.control_id}`, c.status);
  }

  const opportunities = (groups || [])
    .map((group) => {
      const members = (groupMembers || []).filter(
        (m) => m.group_id === group.id,
      );
      const satisfied = members.filter((m) => {
        const s = controlStatus.get(`${m.framework}|${m.control_id}`);
        return s === 'satisfied' || s === 'met';
      });
      const unsatisfied = members.filter((m) => {
        const s = controlStatus.get(`${m.framework}|${m.control_id}`);
        return s && s !== 'satisfied' && s !== 'met' && s !== 'not_applicable';
      });

      if (satisfied.length > 0 && unsatisfied.length > 0) {
        return {
          groupName: group.name,
          category: group.category,
          satisfiedControls: satisfied.map((m) => ({
            framework: m.framework,
            controlId: m.control_id,
          })),
          unsatisfiedControls: unsatisfied.map((m) => ({
            framework: m.framework,
            controlId: m.control_id,
          })),
          potentialScoreImprovement: unsatisfied.length * 2,
        };
      }
      return null;
    })
    .filter(Boolean) as NonNullable<
    ReturnType<typeof Array.prototype.map>[number]
  >[];

  const totalMappings = mappings?.length || 0;
  const totalGroups = groups?.length || 0;
  const totalOpportunities = opportunities.length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Framework Cross-Mapping
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Reuse evidence across frameworks and eliminate duplicate compliance
          work
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Mappings',
            value: totalMappings,
            icon: GitMerge,
            color: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Control Groups',
            value: totalGroups,
            icon: Layers,
            color: 'text-purple-600 dark:text-purple-400',
          },
          {
            label: 'Dedup Opportunities',
            value: totalOpportunities,
            icon: Zap,
            color: 'text-green-600 dark:text-green-400',
          },
          {
            label: 'Frameworks Mapped',
            value: frameworks.length,
            icon: Shield,
            color: 'text-orange-600 dark:text-orange-400',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Matrix */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Cross-Map Matrix
        </h2>
        <CrossMapMatrix
          frameworks={frameworks}
          mappings={(mappings || []).map((m) => ({
            sourceFramework: m.source_framework,
            sourceControlId: m.source_control_id,
            targetFramework: m.target_framework,
            targetControlId: m.target_control_id,
            strength: m.mapping_strength,
          }))}
        />
      </div>

      {/* Deduplication Opportunities */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Deduplication Opportunities
        </h2>
        <DeduplicationOpportunities opportunities={opportunities as any} />
      </div>
    </div>
  );
}
