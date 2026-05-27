/**
 * NDIS-aware register taxonomy. Phase 3 evaluators look for org_registers
 * rows whose `type` column matches one of these strings (10 of them).
 * Customers can use other type values too — the column is free-form text —
 * but only the listed ones satisfy NDIS predicates.
 *
 * Source: lib/compliance/evaluators/ndis/_predicates.ts +
 * docs/compliance/ndis-framework-status.md.
 */
export const NDIS_REGISTER_TYPES = [
  { value: 'conflict_of_interest', label: 'Conflict of interest (NDIS-2.1)' },
  { value: 'complaint', label: 'Complaints (NDIS-2.5)' },
  { value: 'business_continuity_plan', label: 'Business continuity plan (NDIS-2.8)' },
  { value: 'intake', label: 'Intake (NDIS-3.1)' },
  { value: 'service_agreement', label: 'Service agreement (NDIS-3.3)' },
  { value: 'transition', label: 'Transition (NDIS-3.5)' },
  { value: 'environment_assessment', label: 'Environment assessment (NDIS-4.1)' },
  { value: 'financial_delegation', label: 'Financial delegation (NDIS-4.2)' },
  { value: 'restrictive_practice_use', label: 'Restrictive practice use (NDIS-V.2)' },
  { value: 'supervision', label: 'Supervision (NDIS-W.1)' },
] as const;

export type NdisRegisterTypeValue =
  (typeof NDIS_REGISTER_TYPES)[number]['value'];

const ALLOWED = new Set<string>(NDIS_REGISTER_TYPES.map((t) => t.value));

export function isNdisRegisterType(value: unknown): value is NdisRegisterTypeValue {
  return typeof value === 'string' && ALLOWED.has(value);
}
