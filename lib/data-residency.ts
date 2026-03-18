/**
 * =========================================================
 * Data Residency Configuration
 * =========================================================
 * Manages per-organization data residency preferences.
 * Currently supports AU (default). US and EU are infrastructure-ready
 * pending multi-region Supabase deployment.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type DataRegion = 'au' | 'us' | 'eu';

export interface DataResidencyConfig {
  region: DataRegion;
  label: string;
  description: string;
  available: boolean;
  supabaseUrl?: string;
}

const REGIONS: Record<DataRegion, DataResidencyConfig> = {
  au: {
    region: 'au',
    label: 'Australia (Sydney)',
    description:
      'Default region. Hosted on infrastructure in Sydney, Australia. Aligned with Privacy Act 1988 and Australian Privacy Principles.',
    available: true,
  },
  us: {
    region: 'us',
    label: 'United States (Virginia)',
    description:
      'US-East region for organizations with US regulatory requirements. HIPAA, SOC 2, and FedRAMP aligned infrastructure.',
    available: false, // Set to true when US Supabase instance is provisioned
  },
  eu: {
    region: 'eu',
    label: 'European Union (Frankfurt)',
    description:
      'EU region for GDPR-resident data processing. Standard Contractual Clauses and EU data protection compliance.',
    available: false, // Set to true when EU Supabase instance is provisioned
  },
};

/**
 * Get all supported regions with availability status
 */
export function getAvailableRegions(): DataResidencyConfig[] {
  return Object.values(REGIONS);
}

/**
 * Get the data residency region for an organization
 */
export async function getOrgDataRegion(orgId: string): Promise<DataRegion> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('organizations')
    .select('data_residency_region')
    .eq('id', orgId)
    .maybeSingle();

  return (data?.data_residency_region as DataRegion) ?? 'au';
}

/**
 * Set the data residency region for an organization (admin only)
 */
export async function setOrgDataRegion(
  orgId: string,
  region: DataRegion,
): Promise<{ ok: boolean; error?: string }> {
  const config = REGIONS[region];
  if (!config) {
    return { ok: false, error: `Unknown region: ${region}` };
  }

  if (!config.available) {
    return {
      ok: false,
      error: `Region ${region.toUpperCase()} is not yet available. Contact sales for early access.`,
    };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('organizations')
    .update({ data_residency_region: region })
    .eq('id', orgId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Get the Supabase configuration for a given region.
 * Used for future multi-region routing.
 */
export function getRegionConfig(region: DataRegion): {
  url: string;
  region: string;
} {
  // Currently all traffic goes to AU
  // When US/EU instances are provisioned, add their URLs here
  const regionUrls: Record<DataRegion, string> = {
    au: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    us:
      process.env.SUPABASE_US_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    eu:
      process.env.SUPABASE_EU_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  };

  return {
    url: regionUrls[region],
    region: region === 'au' ? 'syd1' : region === 'us' ? 'iad1' : 'fra1',
  };
}
