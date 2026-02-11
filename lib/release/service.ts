import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { ProductRelease } from '@/config/release';
import { CURRENT_VERSION, CURRENT_RELEASE_NAME } from '@/config/release';

/**
 * In-memory cache for the current release.
 * Prevents repeated DB hits on every page load.
 * Refreshes every 60 seconds.
 */
let cachedRelease: ProductRelease | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

function isCacheValid(): boolean {
  return cachedRelease !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

const FALLBACK_RELEASE: ProductRelease = {
  id: 'fallback',
  version_code: CURRENT_VERSION,
  release_name: CURRENT_RELEASE_NAME,
  release_status: 'stable',
  release_date: new Date().toISOString(),
  release_notes: null,
  feature_flags: {},
  schema_version: null,
  ui_version: CURRENT_VERSION,
  compatibility_min_version: CURRENT_VERSION,
  is_locked: true,
  created_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Get the current stable release.
 * Returns the latest release with status='stable', cached for 60s.
 * Falls back to hardcoded defaults if DB is unreachable.
 */
export async function getCurrentRelease(): Promise<ProductRelease> {
  if (isCacheValid()) return cachedRelease!;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('product_releases')
      .select('*')
      .eq('release_status', 'stable')
      .order('release_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return FALLBACK_RELEASE;
    }

    cachedRelease = data as ProductRelease;
    cacheTimestamp = Date.now();
    return cachedRelease;
  } catch {
    return FALLBACK_RELEASE;
  }
}

/**
 * Get release metadata for display purposes.
 */
export async function getReleaseMetadata(): Promise<{
  version: string;
  name: string;
  displayName: string;
  tag: string;
}> {
  const release = await getCurrentRelease();
  return {
    version: release.version_code,
    name: release.release_name,
    displayName: `FormaOS ${release.release_name} — v${release.version_code}`,
    tag: 'Enterprise Release',
  };
}

/**
 * Check if a release-level feature flag is enabled.
 * Returns true if the flag is not defined (permissive default).
 */
export async function isFeatureEnabled(flagKey: string): Promise<boolean> {
  const release = await getCurrentRelease();
  const flags = release.feature_flags;
  if (flags === null || typeof flags !== 'object') return true;
  if (!(flagKey in flags)) return true;
  return Boolean(flags[flagKey]);
}

/**
 * Invalidate the release cache.
 * Called after admin mutations.
 */
export function invalidateReleaseCache(): void {
  cachedRelease = null;
  cacheTimestamp = 0;
}
