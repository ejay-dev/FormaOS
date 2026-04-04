import { NextResponse } from 'next/server';
import {
  authenticateV1Request,
  createEnvelope,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';

type RouteContext = { params: Promise<{ controlId: string }> };

export const runtime = 'nodejs';

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await authenticateV1Request(request, {
      requiredScopes: ['controls:read'],
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { controlId } = await context.params;
    const [{ data: control }, { data: linkedEvidence }, { data: evaluations }] =
      await Promise.all([
        auth.context.db
          .from('compliance_controls')
          .select('*')
          .eq('id', controlId)
          .maybeSingle(),
        auth.context.db
          .from('control_evidence')
          .select('id, evidence_id, status, created_at')
          .eq('organization_id', auth.context.orgId)
          .eq('control_id', controlId),
        auth.context.db
          .from('org_control_evaluations')
          .select('*')
          .eq('organization_id', auth.context.orgId),
      ]);

    if (!control) {
      const response = jsonWithContext(
        auth.context,
        { error: 'Control not found' },
        { status: 404 },
      );
      await logV1Access(auth.context, 404, 'controls:read');
      return response;
    }

    const evidenceIds = (linkedEvidence ?? [])
      .map((item: Record<string, unknown>) => item.evidence_id as string | null)
      .filter((value: string | null): value is string => Boolean(value));
    const { data: evidence } = evidenceIds.length
      ? await auth.context.db
          .from('org_evidence')
          .select('*')
          .eq('organization_id', auth.context.orgId)
          .in('id', evidenceIds)
      : { data: [] };

    const evaluation =
      (evaluations ?? []).find(
        (item: Record<string, unknown>) =>
          item.control_key === control.code || item.control_key === control.id,
      ) ?? null;

    await logV1Access(auth.context, 200, 'controls:read');
    return jsonWithContext(
      auth.context,
      createEnvelope({
        ...control,
        evaluation,
        evidence_links: linkedEvidence ?? [],
        evidence: evidence ?? [],
      }),
    );
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
