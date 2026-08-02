import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { queryParamToStep } from '@/lib/onboarding/employee-journey';
import { EmployeeOnboardingWizard } from '@/components/onboarding/employee/EmployeeOnboardingWizard';
import {
  saveEmployeeProfile,
  completeEmployeeOnboarding,
  skipEmployeeOnboarding,
} from './actions';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: Promise<{
    step?: string;
    error?: string;
  }>;
};

export default async function EmployeeOnboardingPage({
  searchParams,
}: PageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin?next=/onboarding/employee');
  }

  // If already completed (fast path via user_metadata)
  const alreadyOnboarded = user.user_metadata?.employee_onboarded === true;

  // Fetch org membership + industry
  const { data: membership } = await supabase
    .from('org_members')
    .select(
      'organization_id, role, employee_onboarded_at, organizations(name, industry)',
    )
    .eq('user_id', user.id)
    .maybeSingle();

  type OrgShape = { name?: string | null; industry?: string | null };
  const org = (
    Array.isArray(membership?.organizations)
      ? membership?.organizations?.[0]
      : membership?.organizations
  ) as OrgShape | null | undefined;

  const orgName = org?.name ?? 'your organisation';
  const industry = org?.industry ?? null;

  // If this is an owner/admin they shouldn't be here — send to main onboarding
  const role = (membership?.role as string | null) ?? 'member';
  if (role === 'owner' || role === 'admin') {
    redirect('/onboarding');
  }

  // If already completed, go to app (unless explicitly re-visiting)
  const dbCompleted = Boolean(membership?.employee_onboarded_at);
  if (alreadyOnboarded || dbCompleted) {
    redirect('/app');
  }

  const resolvedParams = await searchParams;
  const currentStep = queryParamToStep(resolvedParams?.step);
  const errorCode = resolvedParams?.error ?? null;

  // Fetch user's display name from user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, phone')
    .eq('user_id', user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    '';

  const firstName =
    displayName.split(' ')[0] || user.email?.split('@')[0] || 'there';

  return (
    <EmployeeOnboardingWizard
      firstName={firstName}
      displayName={displayName}
      phone={profile?.phone ?? ''}
      userEmail={user.email ?? ''}
      orgName={orgName}
      industry={industry}
      userRole={role}
      initialStep={currentStep}
      errorCode={errorCode}
      saveProfileAction={saveEmployeeProfile}
      completeAction={completeEmployeeOnboarding}
      skipAction={skipEmployeeOnboarding}
    />
  );
}
