/**
 * Release configuration and naming strategy
 * Single source of truth for product versioning metadata
 */

export const CURRENT_VERSION = '1.0.0';
export const CURRENT_RELEASE_NAME = 'Sovereign';
export const CURRENT_RELEASE_DISPLAY = `FormaOS ${CURRENT_RELEASE_NAME} — v${CURRENT_VERSION}`;
export const CURRENT_RELEASE_TAG = 'Enterprise Release';

/**
 * Release naming strategy: "FormaOS [Prestige Name]"
 *
 * Names evoke governance, authority, and institutional trust.
 * Each major version gets a unique prestige name.
 */
export const RELEASE_NAME_CANDIDATES = [
  'Sovereign',
  'Citadel',
  'Meridian',
  'Bastion',
  'Pinnacle',
  'Dominion',
  'Vanguard',
  'Sentinel',
  'Keystone',
  'Horizon',
] as const;

export type ReleaseStatus = 'draft' | 'stable' | 'deprecated' | 'archived';

export interface ProductRelease {
  id: string;
  version_code: string;
  release_name: string;
  release_status: ReleaseStatus;
  release_date: string | null;
  release_notes: string | null;
  feature_flags: Record<string, boolean>;
  schema_version: string | null;
  ui_version: string | null;
  compatibility_min_version: string | null;
  is_locked: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Suggest next release name based on major version number.
 * Falls back to "Release vX" if candidates exhausted.
 */
export function suggestReleaseName(majorVersion: number): string {
  const index = majorVersion - 1;
  if (index >= 0 && index < RELEASE_NAME_CANDIDATES.length) {
    return RELEASE_NAME_CANDIDATES[index];
  }
  return `Release v${majorVersion}`;
}

/**
 * Validate a version code string (semver-like: X.Y.Z)
 */
export function isValidVersionCode(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}
