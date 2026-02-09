import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { handleAdminError } from '@/app/api/admin/_helpers';

type OrgRouteProps = {
  params: Promise<{ orgId: string }>;
};

export async function GET(request: Request, { params }: OrgRouteProps) {
  try {
    await requireFounderAccess();
    const { orgId } = await params;
    const admin = createSupabaseAdminClient();

    const [
      { data: organization },
      { data: subscription },
      { data: members },
      { data: notes },
    ] = await Promise.all([
      admin
        .from('organizations')
        .select('id, name, plan_key, onboarding_completed, created_at')
        .eq('id', orgId)
        .maybeSingle(),
      admin
        .from('org_subscriptions')
        .select(
          'status, plan_key, stripe_customer_id, stripe_subscription_id, current_period_end, trial_expires_at',
        )
        .eq('organization_id', orgId)
        .maybeSingle(),
      admin
        .from('org_members')
        .select('user_id, role, created_at')
        .eq('organization_id', orgId),
      admin
        .from('admin_notes')
        .select('id, note, created_by, created_at, org_id, user_id')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false }),
    ]);

    const memberRows = await Promise.all(
      (members ?? []).map(async (member: any) => {
        const { data } = await (admin as any).auth.admin.getUserById(
          member.user_id,
        );
        return {
          user_id: member.user_id,
          email: data?.user?.email ?? 'N/A',
          role: member.role ?? 'N/A',
          created_at: member.created_at ?? null,
          last_sign_in_at: data?.user?.last_sign_in_at ?? null,
        };
      }),
    );

    return NextResponse.json({
      organization,
      subscription,
      members: memberRows,
      notes: notes ?? [],
    });
  } catch (error) {
    return handleAdminError(error, '/api/admin/orgs/[orgId]');
  }
}
