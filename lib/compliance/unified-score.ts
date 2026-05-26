import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { getCrossMapCoverage } from '@/lib/compliance/cross-map-engine';

export async function getUnifiedComplianceScore(
  orgId: string,
): Promise<number> {
  const supabase = createSupabaseOrgClient(orgId);
  // .eq('organization_id', orgId) appended automatically.
  const { data: controls } = await supabase
    .from('org_controls')
    .select('status');

  if (!controls?.length) return 0;
  const satisfied = (controls as Array<{ status: string }>).filter(
    (c) => c.status === 'compliant' || c.status === 'satisfied' || c.status === 'met',
  ).length;
  return Math.round((satisfied / controls.length) * 100);
}

export async function getFrameworkScores(orgId: string) {
  const supabase = createSupabaseOrgClient(orgId);
  const { data: controls } = await supabase
    .from('org_controls')
    .select('framework, status');

  if (!controls?.length) return [];

  const fwMap = new Map<string, { total: number; satisfied: number }>();
  for (const c of controls as Array<{ framework: string; status: string }>) {
    const fw = fwMap.get(c.framework) || { total: 0, satisfied: 0 };
    fw.total++;
    if (c.status === 'compliant' || c.status === 'satisfied' || c.status === 'met') fw.satisfied++;
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
  // v4-021: previously `crossMappedScore = isolated + 5` and
  // `delta = min(5, 100 - score)` — invented numbers shown to
  // customers as their cross-mapped posture. Now reuses the real
  // cross-map computation in getCrossMapCoverage (which walks
  // control_groups for transitively-satisfied controls), and
  // derives delta as the actual difference.
  const [scores, coverage] = await Promise.all([
    getFrameworkScores(orgId),
    getCrossMapCoverage(orgId),
  ]);
  return scores.map((s: { framework: string; score: number }) => {
    const crossMappedScore = coverage[s.framework]?.crossMapped ?? s.score;
    return {
      framework: s.framework,
      isolatedScore: s.score,
      crossMappedScore,
      delta: Math.max(0, crossMappedScore - s.score),
    };
  });
}
