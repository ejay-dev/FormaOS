/**
 * Vertical Launch Feature Flags — Care Providers
 *
 * Single source of truth for the "care provider" vertical launch mode.
 * All flags are driven by env vars so they can be toggled without a code change.
 *
 * HOW TO TOGGLE IN PRODUCTION (Vercel):
 *   NEXT_PUBLIC_VERTICAL_LAUNCH=care            → enable care-provider mode
 *   NEXT_PUBLIC_VERTICAL_LAUNCH=                → revert to generic mode
 *   NEXT_PUBLIC_VERTICAL_ALLOWED_INDUSTRIES=["ndis","healthcare","aged_care","childcare"]
 *   NEXT_PUBLIC_VERTICAL_HIDE_ENTERPRISE=1      → suppress enterprise marketing surfaces
 *
 * All changes are REVERSIBLE. Removing / clearing these env vars restores
 * the original generic/enterprise behaviour without any code changes.
 */

/** The active vertical (e.g. "care"). Empty / undefined = generic mode. */
const VERTICAL = process.env.NEXT_PUBLIC_VERTICAL_LAUNCH ?? '';

/**
 * JSON-encoded list of industry slugs that are visible in care-launch mode.
 * Uses the canonical DB format (underscore) matching INDUSTRY_OPTIONS in validators/organization.ts.
 * Falls back to a sensible default so the app works even without the var set.
 */
const ALLOWED_INDUSTRIES_RAW =
  process.env.NEXT_PUBLIC_VERTICAL_ALLOWED_INDUSTRIES ??
  '["ndis","healthcare","aged_care","childcare"]';

let _allowedIndustries: string[] = [];
try {
  _allowedIndustries = JSON.parse(ALLOWED_INDUSTRIES_RAW);
} catch {
  _allowedIndustries = ['ndis', 'healthcare', 'aged_care', 'childcare'];
}

/** Hide enterprise-centric marketing copy / surfaces in care-launch mode. */
const HIDE_ENTERPRISE =
  process.env.NEXT_PUBLIC_VERTICAL_HIDE_ENTERPRISE === '1' ||
  VERTICAL === 'care';

// ---------------------------------------------------------------------------
// Public helper functions (safe to import in both server and client code)
// ---------------------------------------------------------------------------

/** Returns true when the care-provider vertical launch mode is active. */
export function isCareLaunchMode(): boolean {
  return VERTICAL === 'care';
}

/**
 * Returns true when `industry` is in the allowed list for the current vertical.
 * In generic mode every industry is allowed.
 */
export function isIndustryAllowed(industry: string): boolean {
  if (!isCareLaunchMode()) return true;
  return _allowedIndustries.includes(industry);
}

/**
 * Returns true when generic enterprise marketing surfaces (e.g. "SOC2
 * automation", "Enterprise OS") should be shown.
 * In care-launch mode these are hidden to avoid diluting the care focus.
 */
export function shouldShowEnterpriseMarketing(): boolean {
  return !HIDE_ENTERPRISE;
}

/**
 * Returns true when generic compliance-framework language
 * (e.g. "ISO / SOC2 / PCI") should appear as primary messaging.
 * In care-launch mode NDIS/Aged Care/Healthcare language takes priority.
 */
export function shouldShowGenericComplianceLanguage(): boolean {
  return !isCareLaunchMode();
}

/** Convenience: the list of allowed industry slugs. */
export const ALLOWED_INDUSTRIES: readonly string[] = _allowedIndustries;

/**
 * Care-specific industry slugs in canonical DB format (matches INDUSTRY_OPTIONS
 * in lib/validators/organization.ts).
 */
export const CARE_INDUSTRY_IDS: readonly string[] = [
  'ndis',
  'healthcare',
  'aged_care',
  'childcare',
];
