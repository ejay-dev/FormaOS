import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * v4-021: % score gain a single transitively-satisfied control
 * delivers depends on that control's framework total. Group the
 * unsatisfied controls by framework, fetch each framework's total
 * once, and return the summed 1/total * 100 weights.
 */
async function estimateImprovement(
  db: ReturnType<typeof createSupabaseAdminClient>,
  orgId: string,
  unsatisfied: { framework: string; controlId: string }[],
): Promise<number> {
  if (unsatisfied.length === 0) return 0;
  const byFramework = new Map<string, number>();
  for (const u of unsatisfied) {
    byFramework.set(u.framework, (byFramework.get(u.framework) ?? 0) + 1);
  }
  let total = 0;
  for (const [framework, count] of byFramework) {
    const { count: frameworkTotal } = await db
      .from('org_controls')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('framework', framework);
    if (!frameworkTotal || frameworkTotal === 0) continue;
    total += (count / frameworkTotal) * 100;
  }
  return Math.round(total);
}

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
        // v4-021: previously `unsatisfied.length * 2` — a flat 2%
        // guess per control regardless of framework size. The actual
        // % gain a single transitively-satisfied control delivers
        // depends on that control's framework total. Estimate by
        // weighting per-framework: 1/total * 100 per control,
        // summed across the unsatisfied members.
        potentialScoreImprovement: await estimateImprovement(db, orgId, unsatisfied),
      });
    }
  }

  return opportunities.sort(
    (a, b) => b.potentialScoreImprovement - a.potentialScoreImprovement,
  );
}

/**
 * v4-021: previously returned `crossMapped = isolated + 5` regardless
 * of any actual cross-mapping. Now computes real "transitively
 * satisfiable" controls by walking control_groups: a control is
 * transitively satisfiable when another control in the same group
 * (in any framework) is already satisfied — the same evidence can
 * be reused. crossMapped = (satisfied + transitivelySatisfied) /
 * total.
 */
export async function getCrossMapCoverage(orgId: string) {
  const db = createSupabaseAdminClient();

  const { data: orgControls } = await db
    .from('org_controls')
    .select('framework, control_id, status')
    .eq('organization_id', orgId);

  if (!orgControls?.length) return {};

  type FwCounts = {
    total: number;
    satisfied: number;
    transitivelySatisfied: Set<string>;
    unsatisfiedKeys: Set<string>;
  };
  const frameworks = new Map<string, FwCounts>();
  for (const c of orgControls) {
    const fw = frameworks.get(c.framework) ?? {
      total: 0,
      satisfied: 0,
      transitivelySatisfied: new Set<string>(),
      unsatisfiedKeys: new Set<string>(),
    };
    fw.total++;
    if (c.status === 'satisfied' || c.status === 'met') {
      fw.satisfied++;
    } else if (c.status !== 'not_applicable') {
      fw.unsatisfiedKeys.add(c.control_id);
    }
    frameworks.set(c.framework, fw);
  }

  // Walk control_groups: for each group, if any member is satisfied,
  // every other unsatisfied member in that group counts toward its
  // framework's cross-mapped boost (evidence reuse).
  const satisfiedKey = (fw: string, cid: string) =>
    orgControls.some(
      (c) =>
        c.framework === fw &&
        c.control_id === cid &&
        (c.status === 'satisfied' || c.status === 'met'),
    );

  const { data: groups } = await db.from('control_groups').select('id');
  for (const group of groups ?? []) {
    const { data: members } = await db
      .from('control_group_members')
      .select('framework, control_id')
      .eq('group_id', group.id);
    if (!members?.length) continue;

    const anySatisfied = members.some((m) =>
      satisfiedKey(m.framework, m.control_id),
    );
    if (!anySatisfied) continue;

    for (const m of members) {
      const fw = frameworks.get(m.framework);
      if (!fw) continue;
      if (
        fw.unsatisfiedKeys.has(m.control_id) &&
        !satisfiedKey(m.framework, m.control_id)
      ) {
        fw.transitivelySatisfied.add(m.control_id);
      }
    }
  }

  const result: Record<string, { isolated: number; crossMapped: number }> = {};
  for (const [fw, counts] of frameworks) {
    const isolated =
      counts.total > 0
        ? Math.round((counts.satisfied / counts.total) * 100)
        : 0;
    const crossMappedSatisfied =
      counts.satisfied + counts.transitivelySatisfied.size;
    const crossMapped =
      counts.total > 0
        ? Math.min(100, Math.round((crossMappedSatisfied / counts.total) * 100))
        : 0;
    result[fw] = { isolated, crossMapped };
  }

  return result;
}
