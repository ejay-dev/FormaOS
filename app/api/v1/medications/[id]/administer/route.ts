import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const log = routeLog('/api/v1/medications/[id]/administer');
const VALID_STATUSES = new Set([
  'given',
  'withheld',
  'refused',
  'self_administered',
]);

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    const orgId = membership?.organization_id as string | undefined;
    if (!orgId)
      return NextResponse.json({ error: 'No organization' }, { status: 400 });

    const { id: medicationId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      participant_id?: string;
      dose_given?: string;
      status?: string;
      notes?: string;
      witness_id?: string;
    };

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

    const status = VALID_STATUSES.has(body.status || '')
      ? body.status
      : 'given';

    const { data, error } = await supabase
      .from('org_medication_administrations')
      .insert({
        medication_id: medicationId,
        org_id: orgId,
        participant_id: body.participant_id || med.participant_id,
        administered_by: user.id,
        administered_at: new Date().toISOString(),
        dose_given: body.dose_given || null,
        status,
        notes: body.notes || null,
        witness_id: body.witness_id || null,
      })
      .select()
      .single();

    if (error) {
      log.error({ err: error }, 'failed to record administration');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ administration: data });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
