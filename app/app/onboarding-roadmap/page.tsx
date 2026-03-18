import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { IndustryRoadmapEngine } from '@/components/onboarding/IndustryRoadmap';
import { getRoadmapForIndustry } from '@/lib/onboarding/industry-roadmaps';
import { getChecklistCountsForOrg } from '@/lib/onboarding/checklist-data';
import { getCompletedRoadmapSteps } from '@/lib/onboarding/industry-checklists';

export default async function OnboardingRoadmapPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, organizations(name, industry)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    redirect('/onboarding');
  }

  const orgs = membership.organizations as
    | { name?: string | null; industry?: string | null }
    | { name?: string | null; industry?: string | null }[]
    | null;

  const org = Array.isArray(orgs) ? orgs?.[0] : orgs;
  const industry = org?.industry || 'other';
  const orgName = org?.name || 'Your organization';

  const roadmap = getRoadmapForIndustry(industry);
  const counts = await getChecklistCountsForOrg(membership.organization_id);
  const completedSteps = getCompletedRoadmapSteps(roadmap, counts);

  return (
    <div className="space-y-6 pb-12" data-testid="onboarding-roadmap-page">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-slate-400">Roadmap</p>
        <h1 className="text-2xl font-bold text-slate-100">
          {roadmap.industryName} Roadmap
        </h1>
        <p className="text-sm text-slate-400">
          {orgName} · Track progress across your onboarding journey.
        </p>
      </div>

      <IndustryRoadmapEngine
        roadmap={roadmap}
        completedSteps={completedSteps}
        showEstimates={true}
      />
    </div>
  );
}
