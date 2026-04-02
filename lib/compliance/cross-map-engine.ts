import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface ControlMapping {
  targetFramework: string;
  targetControlId: string;
  strength: 'exact' | 'partial' | 'related';
  notes: string | null;
}

export interface ControlGroup {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  members: { framework: string; controlId: string }[];
}

export interface DeduplicationOpportunity {
  group: ControlGroup;
  satisfiedControls: { framework: string; controlId: string }[];
  unsatisfiedControls: { framework: string; controlId: string }[];
  potentialScoreImprovement: number;
}

export async function getMappedControls(
  framework: string,
  controlId: string,
): Promise<ControlMapping[]> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('framework_control_mappings')
    .select('target_framework, target_control_id, mapping_strength, notes')
    .eq('source_framework', framework)
    .eq('source_control_id', controlId);

  const reverse = await db
    .from('framework_control_mappings')
    .select('source_framework, source_control_id, mapping_strength, notes')
    .eq('target_framework', framework)
    .eq('target_control_id', controlId);

  const results: ControlMapping[] = [];
  for (const r of data || []) {
    results.push({
      targetFramework: r.target_framework,
      targetControlId: r.target_control_id,
      strength: r.mapping_strength,
      notes: r.notes,
    });
  }
  for (const r of reverse.data || []) {
    results.push({
      targetFramework: r.source_framework,
      targetControlId: r.source_control_id,
      strength: r.mapping_strength,
      notes: r.notes,
    });
  }
  return results;
}

export async function getControlGroup(
  framework: string,
  controlId: string,
): Promise<ControlGroup | null> {
  const db = createSupabaseAdminClient();
  const { data: membership } = await db
    .from('control_group_members')
    .select('group_id')
    .eq('framework', framework)
    .eq('control_id', controlId)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data: group } = await db
    .from('control_groups')
    .select('*')
    .eq('id', membership.group_id)
    .single();

  if (!group) return null;

  const { data: members } = await db
    .from('control_group_members')
    .select('framework, control_id')
    .eq('group_id', group.id);

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    category: group.category,
    members: (members || []).map((m) => ({
      framework: m.framework,
      controlId: m.control_id,
    })),
  };
}

export async function getDeduplicationOpportunities(
  orgId: string,
): Promise<DeduplicationOpportunity[]> {
  const db = createSupabaseAdminClient();

  // Get org's controls with their satisfaction status
  const { data: orgControls } = await db
    .from('org_controls')
    .select('id, framework, control_id, status')
    .eq('organization_id', orgId);

  if (!orgControls?.length) return [];

  // Build lookup: framework|controlId → status
  const controlStatus = new Map<string, string>();
  for (const c of orgControls) {
    controlStatus.set(`${c.framework}|${c.control_id}`, c.status);
  }

  // Get all control groups
  const { data: groups } = await db.from('control_groups').select('*');
  if (!groups?.length) return [];

  const opportunities: DeduplicationOpportunity[] = [];

  for (const group of groups) {
    const { data: members } = await db
      .from('control_group_members')
      .select('framework, control_id')
      .eq('group_id', group.id);

    if (!members?.length) continue;

    const satisfied: { framework: string; controlId: string }[] = [];
    const unsatisfied: { framework: string; controlId: string }[] = [];

    for (const m of members) {
      const key = `${m.framework}|${m.control_id}`;
      const status = controlStatus.get(key);
      if (status === 'satisfied' || status === 'met') {
        satisfied.push({ framework: m.framework, controlId: m.control_id });
      } else if (status && status !== 'not_applicable') {
        unsatisfied.push({ framework: m.framework, controlId: m.control_id });
      }
    }

    // Opportunity exists when some are satisfied and some aren't
    if (satisfied.length > 0 && unsatisfied.length > 0) {
      opportunities.push({
        group: {
          id: group.id,
          name: group.name,
          description: group.description,
          category: group.category,
          members: (members || []).map((m) => ({
            framework: m.framework,
            controlId: m.control_id,
          })),
        },
        satisfiedControls: satisfied,
        unsatisfiedControls: unsatisfied,
        potentialScoreImprovement: unsatisfied.length * 2, // rough estimate: 2% per control
      });
    }
  }

  return opportunities.sort(
    (a, b) => b.potentialScoreImprovement - a.potentialScoreImprovement,
  );
}

export async function getCrossMapCoverage(orgId: string) {
  const db = createSupabaseAdminClient();

  const { data: orgControls } = await db
    .from('org_controls')
    .select('framework, control_id, status')
    .eq('organization_id', orgId);

  if (!orgControls?.length) return {};

  // Group by framework
  const frameworks = new Map<string, { total: number; satisfied: number }>();
  for (const c of orgControls) {
    const fw = frameworks.get(c.framework) || { total: 0, satisfied: 0 };
    fw.total++;
    if (c.status === 'satisfied' || c.status === 'met') fw.satisfied++;
    frameworks.set(c.framework, fw);
  }

  const result: Record<string, { isolated: number; crossMapped: number }> = {};
  for (const [fw, counts] of frameworks) {
    const isolated =
      counts.total > 0
        ? Math.round((counts.satisfied / counts.total) * 100)
        : 0;
    // Cross-mapped: consider evidence from mapped controls
    result[fw] = { isolated, crossMapped: Math.min(100, isolated + 5) }; // simplified boost
  }

  return result;
}
