import { requireFounderAccess } from '@/app/app/admin/access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { handleAdminError } from '@/app/api/admin/_helpers';

export async function GET() {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();

    const { data: subscriptions, error } = await admin
      .from('org_subscriptions')
      .select('id, organization_id, trial_expires_at')
      .not('trial_expires_at', 'is', null);

    if (error) throw error;

    // Get org names
    const orgIds = (subscriptions ?? []).map((s: any) => s.organization_id);
    const { data: orgs } = await admin
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);

    const orgMap = new Map((orgs ?? []).map((o: any) => [o.id, o.name]));

    // Get owner emails
    const { data: ownerships } = await admin
      .from('org_members')
      .select('organization_id, user_id')
      .eq('role', 'owner');

    const userIds = (ownerships ?? []).map((o: any) => o.user_id);
    const { data: users } = await admin
      .from('auth.users')
      .select('id, email')
      .in('id', userIds);

    const userMap = new Map((users ?? []).map((u: any) => [u.id, u.email]));
    const orgOwnerMap = new Map(
      (ownerships ?? []).map((o: any) => [
        o.organization_id,
        userMap.get(o.user_id),
      ]),
    );

    const trials = (subscriptions ?? []).map((sub: any) => ({
      id: sub.id,
      organization_id: sub.organization_id,
      organization_name: orgMap.get(sub.organization_id) || 'Unnamed Org',
      trial_ends_at: sub.trial_expires_at,
      owner_email: orgOwnerMap.get(sub.organization_id) || 'N/A',
    }));

    return NextResponse.json({ trials });
  } catch (error) {
    return handleAdminError(error, '/api/admin/trials');
  }
}
