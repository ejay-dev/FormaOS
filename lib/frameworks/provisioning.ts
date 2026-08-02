import { randomUUID } from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  ensureFrameworkPacksInstalled,
  getFrameworkCodeForSlug,
  syncComplianceFramework,
} from './framework-installer';
import { getEvidenceSuggestions } from './evidence-suggestions';
import type { FrameworkControlRow } from './types';
import { getServerSideFeatureFlags } from '@/lib/feature-flags';
import { apiLogger } from '@/lib/observability/structured-logger';
import {
  detectComplianceControlsSchema,
  riskLevelFromWeight,
} from './compliance-controls-schema';

// Rows per statement. Provisioning runs on the onboarding path, where a
// round-trip per control blows the serverless function budget.
const PROVISION_BATCH_SIZE = 100;

function chunkRows<T>(rows: T[], size = PROVISION_BATCH_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

const DEFAULT_TASK_PRIORITY_BY_RISK: Record<string, string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'high',
};

function riskKey(value?: string | null) {
  const normalized = (value ?? 'medium').toLowerCase();
  if (normalized === 'critical') return 'critical';
  if (normalized === 'high') return 'high';
  if (normalized === 'low') return 'low';
  return 'medium';
}

function defaultDueDate(riskLevel?: string | null) {
  const level = riskKey(riskLevel);
  const now = new Date();
  if (level === 'critical') now.setDate(now.getDate() + 14);
  else if (level === 'high') now.setDate(now.getDate() + 30);
  else if (level === 'low') now.setDate(now.getDate() + 90);
  else now.setDate(now.getDate() + 60);
  return now.toISOString();
}

type FrameworkProvisionOptions = {
  force?: boolean;
  client?: ReturnType<typeof createSupabaseAdminClient>;
};

export async function enableFrameworkForOrg(
  orgId: string,
  frameworkSlug: string,
  options: FrameworkProvisionOptions = {},
) {
  const flags = getServerSideFeatureFlags();
  if (!flags.enableFrameworkEngine && !options.force) return;

  await ensureFrameworkPacksInstalled();
  const admin = options.client ?? createSupabaseAdminClient();

  await admin.from('org_frameworks').upsert(
    {
      organization_id: orgId,
      framework_slug: frameworkSlug,
      enabled_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,framework_slug' },
  );

  await provisionFrameworkControls(orgId, frameworkSlug, options);
}

export async function provisionFrameworkControls(
  orgId: string,
  frameworkSlug: string,
  options: FrameworkProvisionOptions = {},
) {
  const flags = getServerSideFeatureFlags();
  if (!flags.enableFrameworkEngine && !options.force) return;

  await ensureFrameworkPacksInstalled();
  const admin = options.client ?? createSupabaseAdminClient();
  await syncComplianceFramework(frameworkSlug, admin);

  await admin.from('org_frameworks').upsert(
    {
      organization_id: orgId,
      framework_slug: frameworkSlug,
      enabled_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,framework_slug' },
  );
  const frameworkCode = getFrameworkCodeForSlug(frameworkSlug);

  const { data: complianceFramework } = await admin
    .from('compliance_frameworks')
    .select('id, code')
    .eq('code', frameworkCode)
    .maybeSingle();

  if (!complianceFramework?.id) return;

  const schema = await detectComplianceControlsSchema(admin);
  let complianceControls: ComplianceControlRow[] | null = null;

  if (schema === 'legacy') {
    const { data } = await admin
      .from('compliance_controls')
      .select('id, code, title, description, risk_weight, framework_control_id')
      .eq('framework_id', complianceFramework.id);
     
    complianceControls = (data ?? []).map(
      (control: {
        risk_weight?: number;
        id: string;
        code?: string;
        title?: string;
        description?: string;
        framework_control_id?: string;
      }) => ({
        ...control,
        risk_level: riskLevelFromWeight(control.risk_weight),
      }),
    ) as ComplianceControlRow[];
  } else {
    const { data } = await admin
      .from('compliance_controls')
      .select('id, code, title, description, risk_level, framework_control_id')
      .eq('framework_id', complianceFramework.id);
    complianceControls = data ?? [];
  }

  if (!complianceControls?.length) return;

  const controlIds = complianceControls.map(
    (control: ComplianceControlRow) => control.id,
  );

  const { data: existingLinks } = await admin
    .from('control_tasks')
    .select('control_id')
    .eq('organization_id', orgId)
    .in('control_id', controlIds);

  const existingControlIds = new Set(
    (existingLinks ?? []).map((row: { control_id?: string }) => row.control_id),
  );

  const frameworkControlIds = complianceControls
    .map((control: ComplianceControlRow) => control.framework_control_id)
    .filter(Boolean);

  const { data: frameworkControls } = frameworkControlIds.length
    ? await admin
        .from('framework_controls')
        .select(
          'id, control_code, title, summary_description, default_risk_level, review_frequency_days, suggested_evidence_types, suggested_automation_triggers, suggested_task_templates',
        )
        .in('id', frameworkControlIds)
    : { data: [] };

   
  const frameworkControlById = new Map(
    (frameworkControls ?? []).map(
      (control: { id: string; [key: string]: unknown }) => [
        control.id as string,
        control,
      ],
    ),
  );

  const evaluations: Array<Record<string, unknown>> = [];

  type ComplianceControlRow = {
    id: string;
    code?: string;
    title?: string;
    description?: string;
    risk_level?: string;
    framework_control_id?: string;
  };

  type PendingProvision = {
    task: Record<string, unknown>;
    link: Record<string, unknown>;
    evaluation: Record<string, unknown>;
  };

  const pendingProvisions: PendingProvision[] = [];
  const linkedEvaluationsByKey = new Map<string, Record<string, unknown>>();

  for (const control of complianceControls as ComplianceControlRow[]) {
    const frameworkControl = control.framework_control_id
      ? (frameworkControlById.get(control.framework_control_id) as
          | FrameworkControlRow
          | undefined)
      : undefined;

    const suggestions = frameworkControl
      ? getEvidenceSuggestions(frameworkControl)
      : {
          evidenceTypes: [],
          automationTriggers: [],
          reviewCadenceDays: 90,
          taskTemplates: [
            {
              title: `Implement ${control.title}`,
              description:
                control.description ??
                'Define and implement required control activities.',
              priority: 'medium',
            },
          ],
        };

    const template = suggestions.taskTemplates[0];
    const priority =
      template.priority ??
      DEFAULT_TASK_PRIORITY_BY_RISK[riskKey(control.risk_level)];

    const evaluation = {
      organization_id: orgId,
      control_type: 'framework_control',
      control_key: `control:${control.id}`,
      required: true,
      status: 'at_risk',
      last_evaluated_at: new Date().toISOString(),
      framework_id: complianceFramework.id,
      details: {
        framework_code: complianceFramework.code,
        control_code: control.code,
        control_title: control.title,
        required_evidence_count: 1,
        approved_evidence_count: 0,
        evidence_types: suggestions.evidenceTypes,
        automation_triggers: suggestions.automationTriggers,
      },
    };

    if (existingControlIds.has(control.id)) {
      // Task already provisioned by an earlier run. Keep the baseline aside —
      // it is written only if that run died before reaching the evaluation
      // upsert, so a real evaluation status is never reset to 'at_risk'.
      linkedEvaluationsByKey.set(evaluation.control_key, evaluation);
      continue;
    }

    // Task ids are generated here so the control_tasks rows can be batched
    // alongside the tasks instead of waiting on a per-row RETURNING id.
    const taskId = randomUUID();

    pendingProvisions.push({
      task: {
        id: taskId,
        organization_id: orgId,
        title: template.title,
        description: template.description ?? control.description ?? null,
        status: 'pending',
        priority,
        due_date: defaultDueDate(
          control.risk_level ?? frameworkControl?.default_risk_level,
        ),
      },
      link: {
        organization_id: orgId,
        control_id: control.id,
        task_id: taskId,
      },
      evaluation,
    });
  }

  for (const batch of chunkRows(pendingProvisions)) {
    const { error: taskError } = await admin
      .from('org_tasks')
      .insert(batch.map((pending) => pending.task));

    if (taskError) {
      apiLogger.error('framework_provisioning_task_insert_failed', taskError, {
        orgId,
        frameworkSlug,
        batchSize: batch.length,
      });
      continue;
    }

    const { error: linkError } = await admin
      .from('control_tasks')
      .insert(batch.map((pending) => pending.link));

    if (linkError) {
      apiLogger.error('framework_provisioning_link_insert_failed', linkError, {
        orgId,
        frameworkSlug,
        batchSize: batch.length,
      });
      continue;
    }

    for (const pending of batch) {
      evaluations.push(pending.evaluation);
    }
  }

  if (linkedEvaluationsByKey.size) {
    const linkedKeys = [...linkedEvaluationsByKey.keys()];
    for (const batch of chunkRows(linkedKeys)) {
      const { data: existingEvaluations, error: existingError } = await admin
        .from('org_control_evaluations')
        .select('control_key')
        .eq('organization_id', orgId)
        .eq('control_type', 'framework_control')
        .in('control_key', batch);

      if (existingError) {
        apiLogger.error(
          'framework_provisioning_evaluation_read_failed',
          existingError,
          { orgId, frameworkSlug },
        );
        continue;
      }

      const evaluated = new Set(
        (existingEvaluations ?? []).map(
          (row: { control_key?: string }) => row.control_key,
        ),
      );

      for (const key of batch) {
        if (evaluated.has(key)) continue;
        const evaluation = linkedEvaluationsByKey.get(key);
        if (evaluation) evaluations.push(evaluation);
      }
    }
  }

  for (const batch of chunkRows(evaluations)) {
    const { error: evaluationError } = await admin
      .from('org_control_evaluations')
      .upsert(batch, {
        onConflict: 'organization_id,control_type,control_key',
      });

    if (evaluationError) {
      apiLogger.error(
        'framework_provisioning_evaluation_upsert_failed',
        evaluationError,
        { orgId, frameworkSlug, batchSize: batch.length },
      );
    }
  }
}
