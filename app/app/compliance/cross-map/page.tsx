import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  CrossMapMatrix,
  DeduplicationOpportunities,
} from '@/components/compliance/cross-map-matrix';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';

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

  const heroMetrics: PageHeroMetric[] = [
    { label: 'Mappings', value: totalMappings, sub: 'total' },
    { label: 'Groups', value: totalGroups, sub: 'control groups' },
    {
      label: 'Dedup',
      value: totalOpportunities,
      sub: totalOpportunities > 0 ? 'opportunities' : 'none found',
      tone: totalOpportunities > 0 ? 'success' : 'neutral',
    },
    {
      label: 'Frameworks',
      value: frameworks.length,
      sub: 'mapped',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHero
        eyebrow="Compliance · Cross-Map"
        title="Framework Cross-Mapping"
        subtitle="Reuse evidence across frameworks and eliminate duplicate compliance work."
        metrics={heroMetrics}
      />

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
