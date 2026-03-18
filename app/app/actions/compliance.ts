// app/app/actions/compliance.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { evaluateFrameworkControls } from "@/app/app/actions/compliance-engine";
import { requirePermission } from "@/app/app/actions/rbac";

export interface GapAnalysisResult {
  score: number;
  missing: number;
  total: number;
  missingCodes: string[];
  partialCodes: string[];
}

export async function runGapAnalysis(frameworkCode: string): Promise<GapAnalysisResult | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const membership = await requirePermission("EDIT_CONTROLS");
  const orgId = membership.orgId as string;

  const result = await evaluateFrameworkControls(orgId, frameworkCode);
  if (!result) return null;

  return {
    score: result.score,
    missing: result.missingMandatoryCodes.length,
    total: result.totalControls,
    missingCodes: result.missingMandatoryCodes,
    partialCodes: result.partialCodes,
  };
}
