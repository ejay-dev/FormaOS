import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Validate the search index against source tables.
 * Returns coverage stats and orphan counts.
 */
export async function validateIndex(orgId: string) {
  const db = createSupabaseAdminClient();

  const entityChecks: Array<{ type: string; table: string; orgCol: string }> = [
    { type: 'task', table: 'org_tasks', orgCol: 'organization_id' },
    { type: 'evidence', table: 'org_evidence', orgCol: 'organization_id' },
    { type: 'control', table: 'org_controls', orgCol: 'organization_id' },
    { type: 'policy', table: 'org_policies', orgCol: 'organization_id' },
    { type: 'form', table: 'org_forms', orgCol: 'org_id' },
    {
      type: 'participant',
      table: 'org_participants',
      orgCol: 'organization_id',
    },
    { type: 'incident', table: 'org_incidents', orgCol: 'organization_id' },
    { type: 'care_plan', table: 'org_care_plans', orgCol: 'organization_id' },
  ];

  const results: Array<{
    type: string;
    sourceCount: number;
    indexedCount: number;
    coverage: number;
  }> = [];

  for (const check of entityChecks) {
    const { count: sourceCount } = await db
      .from(check.table)
      .select('id', { count: 'exact', head: true })
      .eq(check.orgCol, orgId);

    const { count: indexedCount } = await db
      .from('search_index')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('entity_type', check.type);

    const src = sourceCount ?? 0;
    const idx = indexedCount ?? 0;
    results.push({
      type: check.type,
      sourceCount: src,
      indexedCount: idx,
      coverage: src > 0 ? Math.round((idx / src) * 100) : 100,
    });
  }

  return results;
}

/**
 * Remove orphaned search index entries where the source entity no longer exists.
 */
export async function pruneOrphans(orgId: string) {
  const db = createSupabaseAdminClient();

  // Get all indexed entries for this org
  const { data: indexed } = await db
    .from('search_index')
    .select('id, entity_type, entity_id')
    .eq('org_id', orgId);

  if (!indexed || indexed.length === 0) return { pruned: 0 };

  const tableMap: Record<string, string> = {
    task: 'org_tasks',
    evidence: 'org_evidence',
    control: 'org_controls',
    policy: 'org_policies',
    form: 'org_forms',
    participant: 'org_participants',
    incident: 'org_incidents',
    care_plan: 'org_care_plans',
  };

  const orphanIds: string[] = [];

  // Group by entity type and batch-check existence
  const grouped = new Map<string, typeof indexed>();
  for (const entry of indexed) {
    const group = grouped.get(entry.entity_type) ?? [];
    group.push(entry);
    grouped.set(entry.entity_type, group);
  }

  for (const [entityType, entries] of grouped) {
    const table = tableMap[entityType];
    if (!table) continue;

    const entityIds = entries.map((e) => e.entity_id);
    const { data: existing } = await db
      .from(table)
      .select('id')
      .in('id', entityIds);

    const existingIds = new Set((existing ?? []).map((e) => e.id));
    for (const entry of entries) {
      if (!existingIds.has(entry.entity_id)) {
        orphanIds.push(entry.id);
      }
    }
  }

  if (orphanIds.length > 0) {
    await db.from('search_index').delete().in('id', orphanIds);
  }

  return { pruned: orphanIds.length };
}

/**
 * Get overall index health metrics.
 */
export async function getIndexHealth(orgId: string) {
  const coverage = await validateIndex(orgId);

  const db = createSupabaseAdminClient();
  const { data: latest } = await db
    .from('search_index')
    .select('last_indexed_at')
    .eq('org_id', orgId)
    .order('last_indexed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const totalSource = coverage.reduce((s, c) => s + c.sourceCount, 0);
  const totalIndexed = coverage.reduce((s, c) => s + c.indexedCount, 0);

  return {
    overallCoverage:
      totalSource > 0 ? Math.round((totalIndexed / totalSource) * 100) : 100,
    lastIndexedAt: latest?.last_indexed_at ?? null,
    entityCoverage: coverage,
    totalEntities: totalSource,
    totalIndexed,
  };
}
