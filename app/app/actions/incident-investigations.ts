'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { actionError, isNextInternalError } from '@/lib/actions/safe';
import { logAuditEvent } from '@/app/app/actions/audit-events';

type AnalysisPayload = {
  rootCause?: string;
  contributingFactors?: string[];
  whys?: string[];
  fishbone?: Record<string, string[]>;
  timeline?: Array<{ time: string; event: string }>;
  barriers?: Array<{ barrier: string; status: string }>;
};

/**
 * Persist the structured root-cause-analysis produced by InvestigationForm.
 * root_cause and contributing_factors go to their own columns; the
 * methodology-specific payload (whys/fishbone/timeline/barriers) is stored in
 * the analysis_data JSONB column (added in migration 20260624073).
 */
export async function saveInvestigationAnalysis(
  incidentId: string,
  data: AnalysisPayload,
) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/auth/signin');

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const organizationId = membership?.organization_id as string | undefined;
    if (!organizationId) throw new Error('No organization found');

    const analysisData: Record<string, unknown> = {};
    if (data.whys) analysisData.whys = data.whys;
    if (data.fishbone) analysisData.fishbone = data.fishbone;
    if (data.timeline) analysisData.timeline = data.timeline;
    if (data.barriers) analysisData.barriers = data.barriers;

    const { error } = await supabase
      .from('org_investigations')
      .update({
        root_cause: data.rootCause ?? null,
        contributing_factors: data.contributingFactors ?? [],
        analysis_data: analysisData,
        updated_at: new Date().toISOString(),
      })
      .eq('incident_id', incidentId)
      .eq('organization_id', organizationId);

    if (error) throw new Error(error.message);

    await logAuditEvent(
      {
        organizationId,
        actorUserId: user.id,
        actorRole: null,
        entityType: 'incident',
        entityId: incidentId,
        actionType: 'INVESTIGATION_ANALYSIS_SAVED',
        afterState: {
          has_root_cause: Boolean(data.rootCause),
          contributing_factor_count: data.contributingFactors?.length ?? 0,
          methodologies: Object.keys(analysisData),
        },
        reason: 'investigation_rca_update',
      },
      { required: true },
    );

    revalidatePath(`/app/incidents/${incidentId}/investigation`);
    return { success: true } as const;
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    return actionError(error);
  }
}
