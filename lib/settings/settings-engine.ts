import { createSupabaseServerClient } from '@/lib/supabase/server';

// ------------------------------------------------------------------
// Organization Settings Engine
// ------------------------------------------------------------------

const DEFAULT_FEATURES: Record<
  string,
  { label: string; description: string; default: boolean }
> = {
  ai_assistant: {
    label: 'AI Assistant',
    description: 'AI-powered compliance guidance and suggestions',
    default: true,
  },
  care_plans: {
    label: 'Care Plans',
    description: 'NDIS/disability care plan management',
    default: false,
  },
  incidents: {
    label: 'Incidents & CAPA',
    description: 'Incident reporting and corrective actions',
    default: true,
  },
  board_packs: {
    label: 'Board Packs',
    description: 'Automated governance reporting packages',
    default: false,
  },
  custom_forms: {
    label: 'Custom Forms',
    description: 'Form builder for assessments and audits',
    default: true,
  },
  audit_portal: {
    label: 'Auditor Portal',
    description: 'External auditor read-only access',
    default: false,
  },
  integrations: {
    label: 'Integrations',
    description: 'Third-party service connections',
    default: false,
  },
  mobile_offline: {
    label: 'Mobile Offline',
    description: 'Mobile app with offline data sync',
    default: false,
  },
  advanced_reports: {
    label: 'Advanced Reports',
    description: 'Custom report builder and scheduling',
    default: false,
  },
  task_management: {
    label: 'Task Management',
    description: 'Kanban boards, dependencies, and recurrence',
    default: true,
  },
};

export function getDefaultFeatures() {
  return DEFAULT_FEATURES;
}

export async function getFeatureToggles(orgId: string) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('org_feature_toggles')
    .select('*')
    .eq('org_id', orgId);

  // Merge with defaults
  const toggles: Record<string, boolean> = {};
  for (const [key, def] of Object.entries(DEFAULT_FEATURES)) {
    const saved = data?.find((d) => d.feature_key === key);
    toggles[key] = saved ? saved.enabled : def.default;
  }
  return toggles;
}

export async function updateFeatureToggle(
  orgId: string,
  featureKey: string,
  enabled: boolean,
) {
  const db = await createSupabaseServerClient();
  const { error } = await db
    .from('org_feature_toggles')
    .upsert(
      {
        org_id: orgId,
        feature_key: featureKey,
        enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id,feature_key' },
    );
  if (error) throw error;
}

export async function getBranding(orgId: string) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('org_branding')
    .select('*')
    .eq('org_id', orgId)
    .single();
  return data;
}

export async function updateBranding(
  orgId: string,
  branding: {
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
    loginMessage?: string;
    emailFooter?: string;
  },
) {
  const db = await createSupabaseServerClient();
  const { error } = await db.from('org_branding').upsert(
    {
      org_id: orgId,
      logo_url: branding.logoUrl,
      favicon_url: branding.faviconUrl,
      primary_color: branding.primaryColor,
      secondary_color: branding.secondaryColor,
      custom_domain: branding.customDomain,
      login_message: branding.loginMessage,
      email_footer: branding.emailFooter,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id' },
  );
  if (error) throw error;
}

export async function exportOrgData(orgId: string) {
  const db = await createSupabaseServerClient();

  // Gather all org data for export
  const [
    { data: controls },
    { data: evidence },
    { data: tasks },
    { data: policies },
    { data: members },
  ] = await Promise.all([
    db.from('org_controls').select('*').eq('org_id', orgId),
    db.from('org_evidence').select('*').eq('org_id', orgId),
    db.from('org_tasks').select('*').eq('org_id', orgId),
    db
      .from('policy_versions')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'published'),
    db
      .from('org_members')
      .select('user_id, role, display_name')
      .eq('org_id', orgId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    orgId,
    counts: {
      controls: controls?.length || 0,
      evidence: evidence?.length || 0,
      tasks: tasks?.length || 0,
      policies: policies?.length || 0,
      members: members?.length || 0,
    },
    data: { controls, evidence, tasks, policies, members },
  };
}
