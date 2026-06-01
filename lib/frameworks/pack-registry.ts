import path from 'path';

/**
 * Pure framework-pack registry + slug/code lookups.
 *
 * This module deliberately has **no** `server-only` / admin-client imports so
 * it can be consumed from any context (tests, edge, client-safe code) without
 * dragging in the Supabase admin client. `framework-installer.ts` re-exports
 * everything here for back-compat and adds the server-only install routines.
 *
 * (audit H6: importing PACK_SLUGS from framework-installer pulled in
 * `import 'server-only'` via the admin client and crashed Playwright test
 * collection — `playwright test --list` reported 0 tests.)
 */

// v4-031: legacy `iso27001` pack (10 controls, 0 wired evaluators) is
// kept as a deprecated alias of `iso27001-2022` (93 controls, full
// evaluator coverage). Requests for the legacy slug are transparently
// redirected; `ensureFrameworkPacksInstalled` no longer installs it.
// `soc2` is intentionally retained in PACK_REGISTRY — it has 9 wired
// evaluators and is the current/canonical SOC2 implementation for
// existing orgs; `soc2-tsc` is the explicit TSC-organised variant.
export const DEPRECATED_PACK_SLUGS: Record<string, string> = {
  iso27001: 'iso27001-2022',
};

export const PACK_REGISTRY = [
  { slug: 'nist-csf', file: 'nist-csf.json', code: 'NIST_CSF' },
  { slug: 'cis-controls', file: 'cis-controls.json', code: 'CIS_CONTROLS' },
  { slug: 'soc2', file: 'soc2.json', code: 'SOC2' },
  { slug: 'soc2-tsc', file: 'soc2-tsc.json', code: 'SOC2_TSC' },
  { slug: 'iso27001-2022', file: 'iso27001-2022.json', code: 'ISO27001_2022' },
  { slug: 'gdpr', file: 'gdpr.json', code: 'GDPR' },
  { slug: 'hipaa', file: 'hipaa.json', code: 'HIPAA' },
  { slug: 'pci-dss', file: 'pci-dss.json', code: 'PCIDSS' },
  // v4-021: framework-packs/financial-services.json shipped but
  // was never wired into the registry — orgs couldn't install it
  // and the marketing site advertised it as supported.
  {
    slug: 'financial-services-au',
    file: 'financial-services.json',
    code: 'FINANCIAL_SERVICES_AU',
  },
  // Audit 2026-05-27 (R10 Phase 1): NDIS Practice Standards Core Module —
  // 8 manual-attestation controls. Phase 2 requires NDIS-domain expert.
  { slug: 'ndis', file: 'ndis.json', code: 'NDIS' },
  // Mental Health Services vertical — National Standards for Mental
  // Health Services (NSMHS) 2010, 10 standards / 14 controls. 4 DB-signal
  // (org_incidents, org_registers, org_policies, org_risks), 10 manual.
  {
    slug: 'mental-health-au',
    file: 'mental-health-au.json',
    code: 'MENTAL_HEALTH_AU',
  },
];

export function getFrameworkCodeForSlug(slug: string) {
  const found = PACK_REGISTRY.find((pack) => pack.slug === slug);
  return found?.code ?? slug.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

/**
 * Inverse of {@link getFrameworkCodeForSlug}. Returns the canonical
 * pack slug (e.g. `soc2-tsc`) for a given DB framework code (e.g.
 * `SOC2_TSC`). Used by the compliance engine to look up registered
 * evaluators — registry keys are pack slugs, not DB codes.
 *
 * Audit compliance-004 (2026-05-22).
 */
export function getFrameworkSlugForCode(code: string): string | null {
  const found = PACK_REGISTRY.find((pack) => pack.code === code);
  return found?.slug ?? null;
}

export function getPackFileForSlug(slug: string) {
  const found = PACK_REGISTRY.find((pack) => pack.slug === slug);
  if (!found) return null;
  return path.join(process.cwd(), 'framework-packs', found.file);
}

export const PACK_SLUGS = PACK_REGISTRY.map((pack) => pack.slug);
