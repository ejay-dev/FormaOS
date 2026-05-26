import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitApi } from '@/lib/security/rate-limiter';
import { routeLog } from '@/lib/monitoring/server-logger';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import { formatZodError, validateBody } from '@/lib/security/api-validation';

const log = routeLog('/api/v1/care-plans/[id]/goals');

const createGoalSchema = z.object({
  goal_text: z.string().trim().min(1, 'goal_text required').max(2000),
  category: z
    .enum([
      'daily_living',
      'social',
      'health',
      'employment',
      'education',
      'community',
      'independence',
      'safety',
    ])
    .default('independence'),
  target_date: z.string().trim().max(40).optional(),
  measurement_method: z.string().trim().max(500).optional(),
  baseline_value: z.string().trim().max(500).optional(),
  target_value: z.string().trim().max(500).optional(),
});

const updateGoalSchema = z.object({
  status: z
    .enum([
      'not_started',
      'in_progress',
      'achieved',
      'partially_achieved',
      'discontinued',
    ])
    .optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  current_value: z.string().trim().max(500).optional(),
  goal_text: z.string().trim().min(1).max(2000).optional(),
  target_date: z.string().trim().max(40).optional(),
});

type RouteCtx =
  | { response: NextResponse; supabase?: undefined }
  | {
      response?: undefined;
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
      userId: string;
      orgId: string;
    };

async function requireCtx(): Promise<RouteCtx> {
  const supabase = await createSupabaseServerClient();
  const ctx = await requireActiveOrgContext(supabase);
  if (!ctx.ok) return { response: ctx.response };
  return { supabase, userId: ctx.userId, orgId: ctx.orgId };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }
    const ctx = await requireCtx();
    if (ctx.response)
      return ctx.response.status === 401
        ? ctx.response
        : NextResponse.json({ goals: [] }, { status: ctx.response.status });

    const { id } = await params;
    const { data, error } = await ctx.supabase
      .from('org_care_goals')
      .select(
        'id, goal_text, category, status, target_date, progress_percentage, measurement_method, baseline_value, target_value, current_value, created_at, updated_at',
      )
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
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }
    const ctx = await requireCtx();
    if (ctx.response) return ctx.response;

    const { id: carePlanId } = await params;
    const validation = await validateBody(request, createGoalSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const body = validation.data;

    // org_care_plans.client_id holds the participant FK (legacy column name).
    const { data: plan } = await ctx.supabase
      .from('org_care_plans')
      .select('id, client_id')
      .eq('id', carePlanId)
      .eq('organization_id', ctx.orgId)
      .maybeSingle();
    if (!plan)
      return NextResponse.json(
        { error: 'Care plan not found' },
        { status: 404 },
      );

    const { data, error } = await ctx.supabase
      .from('org_care_goals')
      .insert({
        org_id: ctx.orgId,
        care_plan_id: carePlanId,
        participant_id: plan.client_id ?? null,
        goal_text: body.goal_text,
        category: body.category,
        target_date: body.target_date ?? null,
        measurement_method: body.measurement_method ?? null,
        baseline_value: body.baseline_value ?? null,
        target_value: body.target_value ?? null,
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (error) {
      log.error({ err: error }, 'failed to insert goal');
      return NextResponse.json(
        { error: 'Failed to create goal' },
        { status: 500 },
      );
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
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const rate = await rateLimitApi(request);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }
    const ctx = await requireCtx();
    if (ctx.response) return ctx.response;

    const { id: goalId } = await params;
    const validation = await validateBody(request, updateGoalSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const body = validation.data;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.status) updates.status = body.status;
    if (body.progress_percentage !== undefined)
      updates.progress_percentage = body.progress_percentage;
    if (body.current_value !== undefined)
      updates.current_value = body.current_value;
    if (body.goal_text) updates.goal_text = body.goal_text;
    if (body.target_date !== undefined)
      updates.target_date = body.target_date || null;

    const { data, error } = await ctx.supabase
      .from('org_care_goals')
      .update(updates)
      .eq('id', goalId)
      .eq('org_id', ctx.orgId)
      .select()
      .maybeSingle();

    if (error) {
      log.error({ err: error }, 'failed to update goal');
      return NextResponse.json(
        { error: 'Failed to update goal' },
        { status: 500 },
      );
    }
    if (!data)
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    return NextResponse.json({ goal: data });
  } catch (err) {
    log.error({ err }, 'unexpected error');
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
