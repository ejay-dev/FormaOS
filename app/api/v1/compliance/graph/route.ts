import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import { getComplianceGraph } from '@/lib/compliance-graph';

const log = routeLog('/api/v1/compliance/graph');

export async function GET(request: Request) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rate.resetAt },
        { status: 429 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) {
      if (ctx.response.status === 401 || ctx.response.status === 409) {
        return ctx.response;
      }
      return NextResponse.json({ nodes: [], wires: [] });
    }
    const { orgId } = ctx;

    // READ path: getComplianceGraph uses the member-facing session client
    // (no service-role exposure); the org-membership SELECT RLS policy on
    // graph_nodes/graph_wires gates row visibility.
    const { nodes, wires } = await getComplianceGraph(orgId);

    return NextResponse.json({
      nodes,
      wires,
      nodeCount: nodes.length,
      wireCount: wires.length,
    });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
