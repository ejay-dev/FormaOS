import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

const log = routeLog('/api/v1/tasks/[id]/status');

const UI_TO_DB_STATUS: Record<string, string> = {
  overdue: 'pending',
  due_today: 'pending',
  due_soon: 'pending',
  in_progress: 'in_progress',
  pending: 'pending',
  completed: 'completed',
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rate.resetAt },
        { status: 429 },
      );
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const incoming = String(body?.status || '');
    const dbStatus = UI_TO_DB_STATUS[incoming];
    if (!dbStatus) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) {
      if (ctx.response.status === 401 || ctx.response.status === 409) {
        return ctx.response;
      }
      return NextResponse.json({ error: 'No organization' }, { status: 400 });
    }
    const { orgId } = ctx;

    const { error } = await supabase
      .from('org_tasks')
      .update({ status: dbStatus })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) {
      log.error({ err: error, taskId: id }, 'failed to update task status');
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    revalidateTag('onboarding-checklist', 'default');
    revalidatePath('/app');
    revalidatePath('/app/tasks');

    return NextResponse.json({ ok: true, status: dbStatus });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
