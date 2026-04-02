import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function getUnifiedComplianceScore(
  orgId: string,
): Promise<number> {
  const db = createSupabaseAdminClient();
  const { data: controls } = await db
    .from('org_controls')
    .select('status')
    .eq('organization_id', orgId);

  if (!controls?.length) return 0;
  const satisfied = controls.filter(
    (c) => c.status === 'satisfied' || c.status === 'met',
  ).length;
  return Math.round((satisfied / controls.length) * 100);
}

export async function getFrameworkScores(orgId: string) {
  const db = createSupabaseAdminClient();
  const { data: controls } = await db
    .from('org_controls')
    .select('framework, status')
    .eq('organization_id', orgId);

  if (!controls?.length) return [];

  const fwMap = new Map<string, { total: number; satisfied: number }>();
  for (const c of controls) {
    const fw = fwMap.get(c.framework) || { total: 0, satisfied: 0 };
    fw.total++;
    if (c.status === 'satisfied' || c.status === 'met') fw.satisfied++;
    fwMap.set(c.framework, fw);
  }

  return Array.from(fwMap.entries()).map(([framework, counts]) => ({
    framework,
    score:
      counts.total > 0
        ? Math.round((counts.satisfied / counts.total) * 100)
        : 0,
    total: counts.total,
    satisfied: counts.satisfied,
  }));
}

export async function getScoreImpact(orgId: string) {
  const scores = await getFrameworkScores(orgId);
  return scores.map((s) => ({
    framework: s.framework,
    isolatedScore: s.score,
    crossMappedScore: Math.min(100, s.score + 5),
    delta: Math.min(5, 100 - s.score),
  }));
}
