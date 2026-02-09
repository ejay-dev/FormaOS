import { requireFounderAccess } from '@/app/app/admin/access';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/features — Real feature usage from org_entitlements
 *
 * Returns: feature keys with counts of how many orgs have each enabled.
 * No random usage — all from live DB.
 */

const FEATURE_META: Record<string, { name: string; description: string }> = {
  audit_export: {
    name: 'Audit Export',
    description: 'Export audit logs as CSV for external compliance',
  },
  certifications: {
    name: 'Certifications',
    description: 'Display security certifications and compliance badges',
  },
  framework_evaluations: {
    name: 'Framework Evaluations',
    description: 'Enable framework evaluation workflows',
  },
  reports: {
    name: 'Reports',
    description: 'Generate and download custom reports',
  },
  team_limit: {
    name: 'Team Limit',
    description: 'Maximum team members per organization',
  },
};

export async function GET() {
  try {
    await requireFounderAccess();
    const admin = createSupabaseAdminClient();

    /* ── Fetch all entitlements ─────────────────────────── */
    const { data: entitlements, error } = await admin
      .from('org_entitlements')
      .select('feature_key, enabled, value_limit, organization_id');

    if (error) {
      console.error('/api/admin/features query error:', error);
    }

    /* ── Aggregate by feature key ──────────────────────── */
    const featureStats: Record<
      string,
      {
        enabled_count: number;
        disabled_count: number;
        total_orgs: number;
        max_limit: number | null;
      }
    > = {};

    (entitlements ?? []).forEach((e: any) => {
      const key = e.feature_key;
      if (!featureStats[key]) {
        featureStats[key] = {
          enabled_count: 0,
          disabled_count: 0,
          total_orgs: 0,
          max_limit: null,
        };
      }
      featureStats[key].total_orgs += 1;
      if (e.enabled) featureStats[key].enabled_count += 1;
      else featureStats[key].disabled_count += 1;
      if (e.value_limit != null) {
        featureStats[key].max_limit = Math.max(
          featureStats[key].max_limit ?? 0,
          e.value_limit,
        );
      }
    });

    /* ── Build response ────────────────────────────────── */
    const features = Object.entries(featureStats).map(([key, stats]) => ({
      key,
      name: FEATURE_META[key]?.name ?? key,
      description: FEATURE_META[key]?.description ?? '',
      enabled_count: stats.enabled_count,
      disabled_count: stats.disabled_count,
      total_orgs: stats.total_orgs,
      global_limit: stats.max_limit,
    }));

    // Sort: most-used first
    features.sort((a, b) => b.enabled_count - a.enabled_count);

    return NextResponse.json({ features });
  } catch (error) {
    console.error('/api/admin/features error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 },
    );
  }
}
