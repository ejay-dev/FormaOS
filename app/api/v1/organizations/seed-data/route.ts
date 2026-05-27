import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { generateSeedData } from '@/lib/seed/seed-data';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';
import { formatZodError, validateBody } from '@/lib/security/api-validation';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('/api/v1/organizations/seed-data');

const seedDataSchema = z.object({
  industry: z.string().trim().min(1).max(64).default('other'),
});

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const csrfError = validateCsrfOrigin(request);
    if (csrfError) return csrfError;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) return ctx.response;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (ctx.role !== 'owner' && ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const validation = await validateBody(request, seedDataSchema);
    if (!validation.success) {
      return NextResponse.json(formatZodError(validation.error), {
        status: 400,
      });
    }
    const { industry } = validation.data;
    const { orgId } = ctx;

    const orgScoped = createSupabaseOrgClient(orgId);

    // Check if org already has real (non-demo) obligations.
    // .eq('organization_id', orgId) appended automatically.
    const { count: realCount } = await orgScoped
      .from('org_tasks')
      .select('id', { count: 'exact', head: true })
      .neq('title', '');
    if (realCount && realCount > 5) {
      return NextResponse.json(
        { error: 'Organization already has data. Seed data skipped.' },
        { status: 409 },
      );
    }

    const seed = generateSeedData(industry);

    // Seed tasks (organization_id stamped automatically).
    if (seed.tasks.length > 0) {
      const tasks = seed.tasks.map((t) => ({
        title: t.title,
        description: `[DEMO] ${t.title}`,
        status: t.status,
        due_date: t.due_date,
        assigned_to: user.id,
        is_demo: true,
      }));
      await orgScoped.from('org_tasks').insert(tasks);
    }

    // Seed policies (organization_id stamped automatically).
    if (seed.policies.length > 0) {
      const policies = seed.policies.map((p) => ({
        title: p.title,
        content: `[DEMO] ${p.title} content`,
        status: p.status,
        version: p.version,
        author: 'Demo System',
        is_demo: true,
      }));
      await orgScoped.from('org_policies').insert(policies);
    }

    // Mark org as having demo data active (organizations self-table
    // keyed by id; wrapper appends .eq('id', orgId) from the registry).
    await orgScoped
      .from('organizations')
      .update({ demo_data_active: true });

    return NextResponse.json({
      success: true,
      seeded: {
        obligations: seed.obligations.length,
        incidents: seed.incidents.length,
        tasks: seed.tasks.length,
        policies: seed.policies.length,
        staff: seed.staff.length,
        participants: seed.participants.length,
      },
    });
  } catch (error) {
    log.error({ err: error }, 'Seed data error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createSupabaseServerClient();
    const ctx = await requireActiveOrgContext(supabase);
    if (!ctx.ok) return ctx.response;

    if (ctx.role !== 'owner' && ctx.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orgId } = ctx;
    const orgScoped = createSupabaseOrgClient(orgId);

    // Delete all demo records (org filter appended automatically).
    await Promise.all([
      orgScoped
        .from('org_tasks')
        .delete()
        .eq('is_demo', true),
      orgScoped
        .from('org_policies')
        .delete()
        .eq('is_demo', true),
    ]);

    // Mark demo data as inactive.
    await orgScoped
      .from('organizations')
      .update({ demo_data_active: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ err: error }, 'Clear demo data error:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
