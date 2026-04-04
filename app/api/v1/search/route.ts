import { NextResponse } from 'next/server';
import {
  authenticateV1Request,
  createEnvelope,
  jsonWithContext,
  logV1Access,
} from '@/lib/api-keys/middleware';
import { buildIlikePattern } from '@/lib/api/v1-helpers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const auth = await authenticateV1Request(request, {
      requiredScopes: ['search:read'],
    });

    if (!auth.ok) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    if (!q) {
      const response = jsonWithContext(
        auth.context,
        { error: 'q is required' },
        { status: 400 },
      );
      await logV1Access(auth.context, 400, 'search:read');
      return response;
    }

    const pattern = buildIlikePattern(q);
    const [tasks, evidence, controls, members] = await Promise.all([
      auth.context.db
        .from('org_tasks')
        .select('id, title, status, priority, due_date')
        .eq('organization_id', auth.context.orgId)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .limit(10),
      auth.context.db
        .from('org_evidence')
        .select('id, file_name, task_id, created_at')
        .eq('organization_id', auth.context.orgId)
        .or(`file_name.ilike.${pattern},title.ilike.${pattern}`)
        .limit(10),
      auth.context.db
        .from('compliance_controls')
        .select('id, code, title, category')
        .or(`title.ilike.${pattern},code.ilike.${pattern}`)
        .limit(10),
      auth.context.db
        .from('org_members')
        .select('id, user_id, role, department, compliance_status, created_at')
        .eq('organization_id', auth.context.orgId)
        .or(`role.ilike.${pattern},department.ilike.${pattern}`)
        .limit(10),
    ]);

    await logV1Access(auth.context, 200, 'search:read');
    return jsonWithContext(
      auth.context,
      createEnvelope({
        query: q,
        tasks: tasks.data ?? [],
        evidence: evidence.data ?? [],
        controls: controls.data ?? [],
        members: members.data ?? [],
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
