import { NextResponse } from 'next/server';
import {
  authenticateV1Request,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const auth = await authenticateV1Request(request, {
      requiredScopes: ['frameworks:read'],
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { limit, offset } = getPagination(request, 25, 100);
    const [
      { data: orgFrameworks },
      { data: frameworks },
      { data: evaluations },
    ] = await Promise.all([
      auth.context.db
        .from('org_frameworks')
        .select('*', { count: 'exact' })
        .eq('organization_id', auth.context.orgId)
        .order('enabled_at', { ascending: false })
        .range(offset, offset + limit - 1),
      auth.context.db.from('frameworks').select('*'),
      auth.context.db
        .from('org_control_evaluations')
        .select(
          'framework_id, compliance_score, total_controls, satisfied_controls, missing_controls, evaluated_at, last_evaluated_at',
        )
        .eq('organization_id', auth.context.orgId),
    ]);

    const evaluationByFramework = new Map<string, Record<string, unknown>>();
    for (const evaluation of evaluations ?? []) {
      const frameworkId = evaluation.framework_id as string | null;
      if (frameworkId && !evaluationByFramework.has(frameworkId)) {
        evaluationByFramework.set(frameworkId, evaluation);
      }
    }

    const data = ((orgFrameworks ?? []) as Array<Record<string, unknown>>).map(
      (installed) => {
        const framework = (
          (frameworks ?? []) as Array<Record<string, unknown>>
        ).find(
          (item) =>
            item.slug === installed.framework_slug ||
            item.id === installed.framework_slug,
        );
        const evaluation = ((framework?.id &&
          evaluationByFramework.get(framework.id as string)) ??
          null) as Record<string, unknown> | null;

        return {
          ...installed,
          framework,
          coverage: evaluation
            ? {
                compliance_score: evaluation.compliance_score,
                total_controls: evaluation.total_controls,
                satisfied_controls: evaluation.satisfied_controls,
                missing_controls: evaluation.missing_controls,
                evaluated_at:
                  evaluation.evaluated_at ?? evaluation.last_evaluated_at,
              }
            : null,
        };
      },
    );

    await logV1Access(auth.context, 200, 'frameworks:read');
    return jsonWithContext(
      auth.context,
      paginatedEnvelope(data, { offset, limit, total: data.length + offset }),
    );
  } catch (error) {
    console.error('[V1 API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
