import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import soc2Pack from '@/framework-packs/soc2.json';
import type { Soc2ControlResult, Soc2RemediationAction } from './types';

// ---------------------------------------------------------------------------
// Types for the SOC 2 framework pack JSON
// ---------------------------------------------------------------------------

interface Soc2PackControl {
  control_code: string;
  title: string;
  default_risk_level: string;
  suggested_evidence_types: string[];
  suggested_task_templates: { title: string; description: string; priority: string }[];
}

// ---------------------------------------------------------------------------
// Priority mapping based on risk level
// ---------------------------------------------------------------------------

function riskToPriority(riskLevel: string): 'critical' | 'high' | 'medium' | 'low' {
  switch (riskLevel) {
    case 'high':
      return 'critical';
    case 'medium':
      return 'high';
    case 'low':
      return 'medium';
    default:
      return 'medium';
  }
}

// ---------------------------------------------------------------------------
// Main gap analysis
// ---------------------------------------------------------------------------

export async function analyzeSoc2Gaps(
  orgId: string,
  controlResults: Soc2ControlResult[],
): Promise<Soc2RemediationAction[]> {
  const supabase = createSupabaseAdminClient();
  const packControls = soc2Pack.controls as Soc2PackControl[];

  // Build a lookup from control code to pack data
  const packMap = new Map<string, Soc2PackControl>();
  for (const pc of packControls) {
    packMap.set(pc.control_code, pc);
  }

  // Filter to controls that need remediation
  const gapControls = controlResults.filter(
    (c) => c.status === 'missing' || c.status === 'partial',
  );

  if (gapControls.length === 0) {
    return [];
  }

  // Load existing remediation actions to avoid duplicates
  const { data: existingActions } = await supabase
    .from('soc2_remediation_actions')
    .select('control_code, action_type, status')
    .eq('organization_id', orgId);

  const existingSet = new Set(
    ((existingActions ?? []) as Record<string, unknown>[]).map(
      (a) => `${a.control_code}::${a.action_type}`,
    ),
  );

  const newActions: Soc2RemediationAction[] = [];
  const rowsToInsert: Record<string, unknown>[] = [];

  for (const control of gapControls) {
    const pack = packMap.get(control.controlCode);
    if (!pack) continue;

    const priority = riskToPriority(control.riskLevel);

    // Generate evidence-related remediation actions
    for (const evidenceType of pack.suggested_evidence_types) {
      const actionType = 'collect_evidence';
      const key = `${control.controlCode}::${actionType}::${evidenceType}`;

      if (existingSet.has(`${control.controlCode}::${actionType}`)) continue;

      const title = `Collect evidence: ${evidenceType}`;
      const description = `Upload "${evidenceType}" as evidence for control ${control.controlCode} (${control.title}).`;

      rowsToInsert.push({
        organization_id: orgId,
        control_code: control.controlCode,
        action_type: actionType,
        title,
        description,
        priority,
        status: 'pending',
      });

      // Mark as seen to avoid duplicate inserts within this run
      existingSet.add(`${control.controlCode}::${actionType}`);
    }

    // Generate task-related remediation actions
    for (const template of pack.suggested_task_templates) {
      const actionType = 'complete_task';
      if (existingSet.has(`${control.controlCode}::${actionType}`)) continue;

      rowsToInsert.push({
        organization_id: orgId,
        control_code: control.controlCode,
        action_type: actionType,
        title: template.title,
        description: template.description,
        priority,
        status: 'pending',
      });

      existingSet.add(`${control.controlCode}::${actionType}`);
    }
  }

  // Upsert all new actions
  if (rowsToInsert.length > 0) {
    const { data: inserted } = await supabase
      .from('soc2_remediation_actions')
      .insert(rowsToInsert)
      .select('*')
      .limit(1000);

    for (const row of (inserted ?? []) as Record<string, unknown>[]) {
      newActions.push({
        id: row.id as string,
        controlCode: row.control_code as string,
        actionType: row.action_type as string,
        title: row.title as string,
        description: (row.description as string | null) ?? null,
        status: row.status as Soc2RemediationAction['status'],
        linkedTaskId: (row.linked_task_id as string | null) ?? null,
        linkedEvidenceId: (row.linked_evidence_id as string | null) ?? null,
        priority: row.priority as Soc2RemediationAction['priority'],
        createdAt: row.created_at as string,
        completedAt: (row.completed_at as string | null) ?? null,
      });
    }
  }

  return newActions;
}
