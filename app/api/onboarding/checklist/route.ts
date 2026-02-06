import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: membership } = await admin
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const orgId = membership?.organization_id;
  if (!orgId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const [tasks, evidence, members, compliance, reports] = await Promise.all([
    admin
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('evidence')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('org_control_evaluations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    admin
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
  ]);

  return NextResponse.json({
    tasks: tasks.count ?? 0,
    evidence: evidence.count ?? 0,
    members: members.count ?? 0,
    complianceChecks: compliance.count ?? 0,
    reports: reports.count ?? 0,
  });
}
