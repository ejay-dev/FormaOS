import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import {
  formatZodError,
  uuidSchema,
  validateBody,
} from '@/lib/security/api-validation';

const log = routeLog('/api/v1/medications/[id]/administer');

const administerSchema = z.object({
  participant_id: uuidSchema.optional(),
  dose_given: z.string().trim().max(200).optional(),
  status: z
    .enum(['given', 'withheld', 'refused', 'self_administered'])
    .default('given'),
  notes: z.string().trim().max(2000).optional(),
  witness_id: uuidSchema.optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) return ctx.response;
    const { userId, orgId } = ctx;

    const { id: medicationId } = await params;
    const validation = await validateBody(request, administerSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const body = validation.data;

    const { data: med } = await supabase
      .from('org_medications')
      .select('id, participant_id')
      .eq('id', medicationId)
      .eq('org_id', orgId)
      .maybeSingle();
    if (!med)
      return NextResponse.json(
        { error: 'Medication not found' },
        { status: 404 },
      );

    // Audit isolation-005 (2026-05-22): the route previously accepted
    // body.participant_id and body.witness_id without verifying either
    // belongs to the caller's org. Anyone could record an administration
    // event tagged to a victim org's participant. Verify both before
    // accepting.
    const participantIdToUse = body.participant_id || med.participant_id;
    if (participantIdToUse && participantIdToUse !== med.participant_id) {
      const { data: participant } = await supabase
        .from('org_patients')
        .select('id')
        .eq('id', participantIdToUse)
        .eq('organization_id', orgId)
        .maybeSingle();
      if (!participant) {
        return NextResponse.json(
          { error: 'participant_id does not belong to your organization' },
          { status: 403 },
        );
      }
    }
    if (body.witness_id) {
      const { data: witness } = await supabase
        .from('org_members')
        .select('user_id')
        .eq('user_id', body.witness_id)
        .eq('organization_id', orgId)
        .maybeSingle();
      if (!witness) {
        return NextResponse.json(
          { error: 'witness_id is not a member of your organization' },
          { status: 403 },
        );
      }
    }

    const { data, error } = await supabase
      .from('org_medication_administrations')
      .insert({
        medication_id: medicationId,
        org_id: orgId,
        participant_id: participantIdToUse,
        administered_by: userId,
        administered_at: new Date().toISOString(),
        dose_given: body.dose_given ?? null,
        status: body.status,
        notes: body.notes ?? null,
        witness_id: body.witness_id ?? null,
      })
      .select()
      .single();

    if (error) {
      log.error({ err: error }, 'failed to record administration');
      return NextResponse.json(
        { error: 'Failed to record administration' },
        { status: 500 },
      );
    }
    return NextResponse.json({ administration: data });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
