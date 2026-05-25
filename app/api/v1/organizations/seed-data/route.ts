import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { generateSeedData } from '@/lib/seed/seed-data';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { requireActiveOrgContext } from '@/lib/api/require-active-org';

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

    const body = await request.json();
    const industry =
      typeof body.industry === 'string' ? body.industry : 'other';
    const { orgId } = ctx;

    const admin = createSupabaseAdminClient();

    // Check if org already has real (non-demo) obligations
    const { count: realCount } = await admin
      .from('org_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .neq('title', '');
    // If we had is_demo column, we'd filter. For now check count.
    if (realCount && realCount > 5) {
      return NextResponse.json(
        { error: 'Organization already has data. Seed data skipped.' },
        { status: 409 },
      );
    }

    const seed = generateSeedData(industry);

    // Seed tasks
    if (seed.tasks.length > 0) {
      const tasks = seed.tasks.map((t) => ({
        organization_id: orgId,
        title: t.title,
        description: `[DEMO] ${t.title}`,
        status: t.status,
        due_date: t.due_date,
        assigned_to: user.id,
        is_demo: true,
      }));
      await admin.from('org_tasks').insert(tasks);
    }

    // Seed policies
    if (seed.policies.length > 0) {
      const policies = seed.policies.map((p) => ({
        organization_id: orgId,
        title: p.title,
        content: `[DEMO] ${p.title} content`,
        status: p.status,
        version: p.version,
        author: 'Demo System',
        is_demo: true,
      }));
      await admin.from('org_policies').insert(policies);
    }

    // Mark org as having demo data active
    await admin
      .from('organizations')
      .update({ demo_data_active: true })
      .eq('id', orgId);

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
    console.error('Seed data error:', error);
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

    const admin = createSupabaseAdminClient();
    const { orgId } = ctx;

    // Delete all demo records
    await Promise.all([
      admin
        .from('org_tasks')
        .delete()
        .eq('organization_id', orgId)
        .eq('is_demo', true),
      admin
        .from('org_policies')
        .delete()
        .eq('organization_id', orgId)
        .eq('is_demo', true),
    ]);

    // Mark demo data as inactive
    await admin
      .from('organizations')
      .update({ demo_data_active: false })
      .eq('id', orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clear demo data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
