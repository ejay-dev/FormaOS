"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requirePermission } from "@/app/app/actions/rbac";

export async function getEntityRiskRollups() {
  const supabase = await createSupabaseServerClient();
  const permissionCtx = await requirePermission("VIEW_CONTROLS");

  const { data: entities } = await supabase
    .from("org_entities")
    .select("id, name, entity_type")
    .eq("organization_id", permissionCtx.orgId);

  const { data: evaluations } = await supabase
    .from("org_control_evaluations")
    .select("entity_id, status")
    .eq("organization_id", permissionCtx.orgId)
    .eq("control_type", "framework_control");

  const { data: blocks } = await supabase
    .from("org_compliance_blocks")
    .select("entity_id")
    .eq("organization_id", permissionCtx.orgId)
    .is("resolved_at", null);

  const rollups = new Map<string, { total: number; compliant: number; atRisk: number; nonCompliant: number }>();
  for (const evaluation of evaluations ?? []) {
    if (!evaluation.entity_id) continue;
    if (!rollups.has(evaluation.entity_id)) {
      rollups.set(evaluation.entity_id, { total: 0, compliant: 0, atRisk: 0, nonCompliant: 0 });
    }
    const target = rollups.get(evaluation.entity_id)!;
    target.total += 1;
    if (evaluation.status === "compliant") target.compliant += 1;
    if (evaluation.status === "at_risk") target.atRisk += 1;
    if (evaluation.status === "non_compliant") target.nonCompliant += 1;
  }

  const blockCountByEntity = new Map<string, number>();
  for (const block of blocks ?? []) {
    if (!block.entity_id) continue;
    blockCountByEntity.set(block.entity_id, (blockCountByEntity.get(block.entity_id) || 0) + 1);
  }

  const result = (entities ?? []).map((entity: any) => {
    const stats = rollups.get(entity.id) || { total: 0, compliant: 0, atRisk: 0, nonCompliant: 0 };
    const score = stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0;
    const unresolvedBlocks = blockCountByEntity.get(entity.id) || 0;
    return {
      entityId: entity.id,
      name: entity.name,
      entityType: entity.entity_type,
      score,
      atRisk: stats.atRisk,
      nonCompliant: stats.nonCompliant,
      totalControls: stats.total,
      unresolvedBlocks,
    };
  });

  const weakestEntity = [...result].sort((a, b) => a.score - b.score)[0] || null;
  const highestRisk = [...result].sort((a, b) => b.nonCompliant - a.nonCompliant)[0] || null;

  return {
    entities: result,
    weakestEntity,
    highestRisk,
  };
}
