import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/care-plans/[id]/goals');

const VALID_CATEGORIES = new Set([
  'daily_living', 'social', 'health', 'employment',
  'education', 'community', 'independence', 'safety',
]);
const VALID_STATUSES = new Set([
  'not_started', 'in_progress', 'achieved', 'partially_achieved', 'discontinued',
]);

async function requireCtx() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();
  const orgId = membership?.organization_id as string | undefined;
  if (!orgId) return { error: 'No organization', status: 400 as const };
  return { supabase, user, orgId };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    const ctx = await requireCtx();
    if ('error' in ctx) return NextResponse.json({ goals: [] }, { status: ctx.status });

    const { id } = await params;
    const { data, error } = await ctx.supabase
      .from('org_care_goals')
      .select('id, goal_text, category, status, target_date, progress_percentage, measurement_method, baseline_value, target_value, current_value, created_at, updated_at')
      .eq('org_id', ctx.orgId)
      .eq('care_plan_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      log.error({ err: error }, 'failed to list goals');
      return NextResponse.json({ goals: [] });
    }
    return NextResponse.json({ goals: data ?? [] });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ goals: [] });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    const ctx = await requireCtx();
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { id: carePlanId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      goal_text?: string;
      category?: string;
      target_date?: string;
      measurement_method?: string;
      baseline_value?: string;
      target_value?: string;
    };

    if (!body.goal_text?.trim()) {
      return NextResponse.json({ error: 'goal_text required' }, { status: 400 });
    }
    const category = VALID_CATEGORIES.has(body.category || '')
      ? body.category
      : 'independence';

    const { data: plan } = await ctx.supabase
      .from('org_care_plans')
      .select('id, patient_id')
      .eq('id', carePlanId)
      .eq('organization_id', ctx.orgId)
      .maybeSingle();
    if (!plan) return NextResponse.json({ error: 'Care plan not found' }, { status: 404 });

    const { data, error } = await ctx.supabase
      .from('org_care_goals')
      .insert({
        org_id: ctx.orgId,
        care_plan_id: carePlanId,
        participant_id: plan.patient_id ?? null,
        goal_text: body.goal_text.trim(),
        category,
        target_date: body.target_date || null,
        measurement_method: body.measurement_method || null,
        baseline_value: body.baseline_value || null,
        target_value: body.target_value || null,
        created_by: ctx.user.id,
      })
      .select()
      .single();

    if (error) {
      log.error({ err: error }, 'failed to insert goal');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ goal: data });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    const ctx = await requireCtx();
    if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

    const { id: goalId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
      progress_percentage?: number;
      current_value?: string;
      goal_text?: string;
      target_date?: string;
    };

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status && VALID_STATUSES.has(body.status)) updates.status = body.status;
    if (typeof body.progress_percentage === 'number') {
      updates.progress_percentage = Math.min(100, Math.max(0, body.progress_percentage));
    }
    if (body.current_value !== undefined) updates.current_value = body.current_value;
    if (body.goal_text?.trim()) updates.goal_text = body.goal_text.trim();
    if (body.target_date !== undefined) updates.target_date = body.target_date || null;

    const { data, error } = await ctx.supabase
      .from('org_care_goals')
      .update(updates)
      .eq('id', goalId)
      .eq('org_id', ctx.orgId)
      .select()
      .maybeSingle();

    if (error) {
      log.error({ err: error }, 'failed to update goal');
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    return NextResponse.json({ goal: data });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
