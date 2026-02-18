import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ExecutiveDashboardClient } from './ExecutiveDashboardClient';
import { PageSkeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Executive Dashboard | FormaOS',
  description: 'C-level visibility into organization-wide compliance posture',
};

async function ExecutiveContent() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login?next=/app/executive');
  }

  // Get organization membership and verify role
  const { data: membership, error: membershipError } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError || !membership?.organization_id) {
    redirect('/app');
  }

  // Restrict to owner/admin
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    redirect('/app?error=executive_access_required');
  }

  // Get organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, industry')
    .eq('id', membership.organization_id)
    .single();

  return (
    <ExecutiveDashboardClient
      organizationName={org?.name || 'Organization'}
      industry={org?.industry || null}
    />
  );
}

export default function ExecutiveDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton title="Executive Dashboard" cards={4} tableRows={4} />}>
      <ExecutiveContent />
    </Suspense>
  );
}
