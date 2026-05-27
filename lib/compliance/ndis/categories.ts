/**
 * NDIS Practice Standard category taxonomy. Source of truth lives in the
 * org_policies_ndis_category_check constraint (migration 20260624067).
 *
 * Keep this in sync with that constraint — adding/removing a category here
 * without updating the migration (or vice versa) will surface as a Postgres
 * 23514 check_violation at INSERT/UPDATE time. The corresponding predicates
 * in lib/compliance/evaluators/ndis/_predicates.ts also reference these
 * exact strings.
 */
export const NDIS_CATEGORIES = [
  { value: 'privacy', label: 'Privacy (NDIS-1.3)' },
  { value: 'safeguarding', label: 'Safeguarding (NDIS-1.5)' },
  { value: 'governance', label: 'Governance (NDIS-2.1)' },
  { value: 'risk_management', label: 'Risk management (NDIS-2.2)' },
  { value: 'quality_management', label: 'Quality management (NDIS-2.3)' },
  { value: 'information_management', label: 'Information management (NDIS-2.4)' },
  { value: 'complaints', label: 'Complaints (NDIS-2.5)' },
  { value: 'incident_management', label: 'Incident management (NDIS-2.6)' },
  { value: 'hr_management', label: 'HR management (NDIS-2.7)' },
  { value: 'continuity', label: 'Business continuity (NDIS-2.8)' },
  { value: 'access', label: 'Access and intake (NDIS-3.1)' },
  { value: 'service_agreements', label: 'Service agreements (NDIS-3.3)' },
  { value: 'transitions', label: 'Transitions (NDIS-3.5)' },
  { value: 'safe_environment', label: 'Safe environment (NDIS-4.1)' },
  { value: 'financial_management', label: 'Financial management (NDIS-4.2)' },
  { value: 'medication', label: 'Medication (NDIS-M.1)' },
  { value: 'restrictive_practices', label: 'Restrictive practices (NDIS-V.2 / M.2)' },
  { value: 'worker_engagement', label: 'Worker engagement (NDIS-W.1)' },
] as const;

export type NdisCategoryValue = (typeof NDIS_CATEGORIES)[number]['value'];

const ALLOWED = new Set<string>(NDIS_CATEGORIES.map((c) => c.value));

export function isValidNdisCategory(value: unknown): value is NdisCategoryValue {
  return typeof value === 'string' && ALLOWED.has(value);
}

/**
 * Normalise a form-field value into either a valid category or null.
 * Empty strings / "none" / unknown values all collapse to null so the
 * column stays NULL (which predicates treat as "untagged").
 */
export function coerceNdisCategory(value: unknown): NdisCategoryValue | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'none') return null;
  return isValidNdisCategory(trimmed) ? trimmed : null;
}
