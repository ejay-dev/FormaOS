import path from 'path';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { applyLegacyControlMapping } from '@/lib/compliance/legacy-control-mapping';
import { loadFrameworkPack } from './loadFrameworkPack';
import {
  detectComplianceControlsSchema,
  riskWeightFromLevel,
} from './compliance-controls-schema';

const PACK_REGISTRY = [
  { slug: 'nist-csf', file: 'nist-csf.json', code: 'NIST_CSF' },
  { slug: 'cis-controls', file: 'cis-controls.json', code: 'CIS_CONTROLS' },
  { slug: 'soc2', file: 'soc2.json', code: 'SOC2' },
  { slug: 'iso27001', file: 'iso27001.json', code: 'ISO27001' },
  { slug: 'soc2-tsc', file: 'soc2-tsc.json', code: 'SOC2_TSC' },
  { slug: 'iso27001-2022', file: 'iso27001-2022.json', code: 'ISO27001_2022' },
  { slug: 'gdpr', file: 'gdpr.json', code: 'GDPR' },
  { slug: 'hipaa', file: 'hipaa.json', code: 'HIPAA' },
  { slug: 'pci-dss', file: 'pci-dss.json', code: 'PCIDSS' },
];

export const PACK_SLUGS = PACK_REGISTRY.map((pack) => pack.slug);

let installPromise: Promise<void> | null = null;

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

export async function syncComplianceFramework(
  slug: string,
  adminClient?: ReturnType<typeof createSupabaseAdminClient>,
) {
  const admin = adminClient ?? createSupabaseAdminClient();
  const { data: framework } = await admin
    .from('frameworks')
    .select('id, name, description, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!framework?.id) return;

  const frameworkCode = getFrameworkCodeForSlug(slug);
  const { data: complianceFramework } = await admin
    .from('compliance_frameworks')
    .upsert(
      {
        code: frameworkCode,
        name: framework.name,
        version:
          ((framework as Record<string, unknown>).version as string) ?? null,
        description: framework.description ?? null,
      },
      { onConflict: 'code' },
    )
    .select('id, code')
    .maybeSingle();

  if (!complianceFramework?.id) return;

  const { data: domains } = await admin
    .from('framework_domains')
    .select('id, name')
    .eq('framework_id', framework.id);

  const domainNameById = new Map(
    (domains ?? []).map((domain: { id: string; name: string }) => [
      domain.id as string,
      domain.name as string,
    ]),
  );

  const { data: controls } = await admin
    .from('framework_controls')
    .select(
      'id, domain_id, control_code, title, summary_description, default_risk_level',
    )
    .eq('framework_id', framework.id);

  if (!controls?.length) return;

  const schema = await detectComplianceControlsSchema(admin);
  const rows =
    schema === 'legacy'
      ? controls.map(
          (control: {
            id?: string;
            control_code: string;
            title: string;
            summary_description?: string;
            domain_id?: string;
            default_risk_level?: string;
          }) => ({
            framework_id: complianceFramework.id,
            code: control.control_code,
            title: control.title,
            description: control.summary_description ?? null,
            domain: domainNameById.get(control.domain_id ?? '') ?? 'General',
            risk_weight: riskWeightFromLevel(control.default_risk_level),
            expected_evidence_count: 1,
            evaluation_mode: 'semi_auto',
            is_mandatory: true,
            framework_control_id: control.id,
          }),
        )
      : controls.map(
          (control: {
            id?: string;
            control_code: string;
            title: string;
            summary_description?: string;
            domain_id?: string;
            default_risk_level?: string;
          }) => ({
            framework_id: complianceFramework.id,
            code: control.control_code,
            title: control.title,
            description: control.summary_description ?? null,
            category: domainNameById.get(control.domain_id ?? '') ?? 'General',
            risk_level: control.default_risk_level ?? 'medium',
            weight: 1,
            required_evidence_count: 1,
            is_mandatory: true,
            framework_control_id: control.id,
          }),
        );

  await admin.from('compliance_controls').upsert(rows, {
    onConflict: 'framework_id,code',
  });
}

export async function ensureFrameworkPacksInstalled() {
  if (installPromise) return installPromise;

  installPromise = (async () => {
    try {
      const admin = createSupabaseAdminClient();

      for (const pack of PACK_REGISTRY) {
        const filePath = path.join(process.cwd(), 'framework-packs', pack.file);
        await loadFrameworkPack({ path: filePath }, { adminClient: admin });
        await syncComplianceFramework(pack.slug, admin);
      }

      const result = await applyLegacyControlMapping(admin);
      if (!result.ok) {
        for (const err of result.errors) {
          console.warn('[framework-installer] legacy mapping:', err);
        }
      }
    } catch (error) {
      console.error('[framework-installer] Failed to install packs:', error);
    }
  })();

  return installPromise;
}

export async function installFrameworkPack(slug: string) {
  const filePath = getPackFileForSlug(slug);
  if (!filePath) {
    throw new Error(`Unknown framework pack: ${slug}`);
  }

  const admin = createSupabaseAdminClient();
  await loadFrameworkPack({ path: filePath }, { adminClient: admin });
  await syncComplianceFramework(slug, admin);
}
