import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';

/**
 * Validate the search index against source tables.
 * Returns coverage stats and orphan counts.
 */
export async function validateIndex(orgId: string) {
  const supabase = createSupabaseOrgClient(orgId);

  // The org-scoped client appends the org filter automatically from the
  // TENANT_TABLE_SCOPES registry; no explicit `.eq('org_id', orgId)`
  // needed per query.
  const entityChecks: Array<{ type: string; table: string }> = [
    { type: 'task', table: 'org_tasks' },
    { type: 'evidence', table: 'org_evidence' },
    { type: 'control', table: 'org_controls' },
    { type: 'policy', table: 'org_policies' },
    { type: 'form', table: 'org_forms' },
    { type: 'participant', table: 'org_participants' },
    { type: 'incident', table: 'org_incidents' },
    { type: 'care_plan', table: 'org_care_plans' },
  ];

  const results: Array<{
    type: string;
    sourceCount: number;
    indexedCount: number;
    coverage: number;
  }> = [];

  for (const check of entityChecks) {
    const { count: sourceCount } = await supabase
      .from(check.table)
      .select('id', { count: 'exact', head: true });

    const { count: indexedCount } = await supabase
      .from('search_index')
      .select('id', { count: 'exact', head: true })
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
  const supabase = createSupabaseOrgClient(orgId);

  // Get all indexed entries for this org (.eq('org_id', orgId) appended
  // by the org-scoped client).
  const { data: indexed } = await supabase
    .from('search_index')
    .select('id, entity_type, entity_id');

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
  for (const entry of indexed as Array<{ id: string; entity_type: string; entity_id: string }>) {
    const group = grouped.get(entry.entity_type) ?? [];
    group.push(entry);
    grouped.set(entry.entity_type, group);
  }

  for (const [entityType, entries] of grouped) {
    const table = tableMap[entityType];
    if (!table) continue;

    const entityIds = entries.map((e: { entity_id: string }) => e.entity_id);
    // Source table is org-scoped — wrapper appends the org filter.
    const { data: existing } = await supabase
      .from(table)
      .select('id')
      .in('id', entityIds);

    const existingIds = new Set(
      ((existing ?? []) as Array<{ id: string }>).map((e) => e.id),
    );
    for (const entry of entries as Array<{ id: string; entity_id: string }>) {
      if (!existingIds.has(entry.entity_id)) {
        orphanIds.push(entry.id);
      }
    }
  }

  if (orphanIds.length > 0) {
    await supabase.from('search_index').delete().in('id', orphanIds);
  }

  return { pruned: orphanIds.length };
}

/**
 * Get overall index health metrics.
 */
export async function getIndexHealth(orgId: string) {
  const coverage = await validateIndex(orgId);

  const supabase = createSupabaseOrgClient(orgId);
  const { data: latest } = await supabase
    .from('search_index')
    .select('last_indexed_at')
    .order('last_indexed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const totalSource = coverage.reduce((s, c) => s + c.sourceCount, 0);
  const totalIndexed = coverage.reduce((s, c) => s + c.indexedCount, 0);

  return {
    overallCoverage:
      totalSource > 0 ? Math.round((totalIndexed / totalSource) * 100) : 100,
    lastIndexedAt:
      (latest as { last_indexed_at?: string } | null)?.last_indexed_at ?? null,
    entityCoverage: coverage,
    totalEntities: totalSource,
    totalIndexed,
  };
}
