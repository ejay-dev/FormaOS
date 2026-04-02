import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/** Create an org group (enterprise holding). */
export async function createOrgGroup(
  parentOrgId: string,
  name: string,
  memberOrgIds: string[],
  createdBy: string,
): Promise<string> {
  const db = createSupabaseAdminClient();

  const { data: group, error } = await db
    .from('org_groups')
    .insert({
      name,
      parent_org_id: parentOrgId,
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (error || !group) throw new Error('Failed to create org group');

  if (memberOrgIds.length) {
    await db.from('org_group_members').insert(
      memberOrgIds.map((orgId) => ({
        group_id: group.id,
        organization_id: orgId,
        added_by: createdBy,
      })),
    );
  }

  return group.id;
}

/** Get consolidated rollup across all group member orgs. */
export async function getGroupRollup(groupId: string) {
  const db = createSupabaseAdminClient();

  const { data: members } = await db
    .from('org_group_members')
    .select('organization_id, organizations(name)')
    .eq('group_id', groupId);

  if (!members?.length) return { orgs: [], combined: null };

  const orgScores: Array<{
    orgId: string;
    orgName: string;
    complianceScore: number;
    totalControls: number;
    satisfiedControls: number;
    evidenceCount: number;
    incidentCount: number;
  }> = [];

  for (const member of members) {
    const orgId = member.organization_id;
    const orgRaw = member.organizations as any;
    const orgName =
      (Array.isArray(orgRaw) ? orgRaw[0]?.name : orgRaw?.name) ?? orgId;

    const { data: controls } = await db
      .from('org_controls')
      .select('status')
      .eq('organization_id', orgId);

    const total = controls?.length ?? 0;
    const satisfied =
      controls?.filter((c) => c.status === 'satisfied').length ?? 0;

    const { count: evidenceCount } = await db
      .from('org_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    const { count: incidentCount } = await db
      .from('org_incidents')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte(
        'created_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      );

    orgScores.push({
      orgId,
      orgName,
      complianceScore: total > 0 ? Math.round((satisfied / total) * 100) : 0,
      totalControls: total,
      satisfiedControls: satisfied,
      evidenceCount: evidenceCount ?? 0,
      incidentCount: incidentCount ?? 0,
    });
  }

  // Combined metrics (equal weighting)
  const combined = {
    avgComplianceScore: Math.round(
      orgScores.reduce((s, o) => s + o.complianceScore, 0) / orgScores.length,
    ),
    totalControls: orgScores.reduce((s, o) => s + o.totalControls, 0),
    totalSatisfied: orgScores.reduce((s, o) => s + o.satisfiedControls, 0),
    totalEvidence: orgScores.reduce((s, o) => s + o.evidenceCount, 0),
    totalIncidents: orgScores.reduce((s, o) => s + o.incidentCount, 0),
  };

  return { orgs: orgScores, combined };
}

/** Side-by-side org comparison within a group. */
export async function getOrgComparison(groupId: string) {
  const rollup = await getGroupRollup(groupId);
  return rollup.orgs.sort((a, b) => b.complianceScore - a.complianceScore);
}
