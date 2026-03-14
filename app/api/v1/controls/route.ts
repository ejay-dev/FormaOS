import { authenticateV1Request, jsonWithContext, logV1Access } from '@/lib/api-keys/middleware';
import { getPagination, paginatedEnvelope } from '@/lib/api/v1';
import { buildIlikePattern, getStringParam } from '@/lib/api/v1-helpers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const auth = await authenticateV1Request(request, {
    requiredScopes: ['controls:read'],
  });

  if (!auth.ok) {
    return auth.response;
  }

  const { limit, offset, searchParams } = getPagination(request, 25, 100);
  const frameworkId = getStringParam(searchParams, 'frameworkId');
  const q = getStringParam(searchParams, 'q');

  let controlsQuery = auth.context.db
    .from('compliance_controls')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (frameworkId) {
    controlsQuery = controlsQuery.eq('framework_id', frameworkId);
  }

  if (q) {
    const pattern = buildIlikePattern(q);
    controlsQuery = controlsQuery.or(`title.ilike.${pattern},code.ilike.${pattern}`);
  }

  const [{ data: controls, count }, { data: evidence }, { data: evaluations }] = await Promise.all([
    controlsQuery,
    auth.context.db
      .from('control_evidence')
      .select('control_id, status')
      .eq('organization_id', auth.context.orgId),
    auth.context.db
      .from('org_control_evaluations')
      .select('control_key, status, compliance_score, evaluated_at, last_evaluated_at')
      .eq('organization_id', auth.context.orgId),
  ]);

  const evidenceByControl = new Map<string, { approved: number; pending: number; rejected: number }>();
  for (const row of (evidence ?? []) as Array<{ control_id: string; status: string }>) {
    const current = evidenceByControl.get(row.control_id) ?? { approved: 0, pending: 0, rejected: 0 };
    const key: 'approved' | 'pending' | 'rejected' =
      row.status === 'approved' || row.status === 'rejected' ? row.status : 'pending';
    current[key] += 1;
    evidenceByControl.set(row.control_id, current);
  }

  const evalByKey = new Map<string, Record<string, unknown>>();
  for (const evaluation of evaluations ?? []) {
    if (!evalByKey.has(evaluation.control_key)) {
      evalByKey.set(evaluation.control_key, evaluation);
    }
  }

  const data = ((controls ?? []) as Array<Record<string, unknown>>).map((control) => ({
    ...control,
    evidence_status:
      evidenceByControl.get(control.id as string) ?? { approved: 0, pending: 0, rejected: 0 },
    evaluation: evalByKey.get(control.code as string) ?? null,
  }));

  await logV1Access(auth.context, 200, 'controls:read');
  return jsonWithContext(
    auth.context,
    paginatedEnvelope(data, { offset, limit, total: count ?? data.length }),
  );
}
