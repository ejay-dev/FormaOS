import path from 'path';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { applyLegacyControlMapping } from '@/lib/compliance/legacy-control-mapping';
import { loadFrameworkPack } from './loadFrameworkPack';
import { consoleShim } from '@/lib/monitoring/console-shim';
import {
  detectComplianceControlsSchema,
  riskWeightFromLevel,
} from './compliance-controls-schema';
import {
  DEPRECATED_PACK_SLUGS,
  PACK_REGISTRY,
  PACK_SLUGS,
  getFrameworkCodeForSlug,
  getFrameworkSlugForCode,
  getPackFileForSlug,
} from './pack-registry';

// The pure registry + slug lookups live in ./pack-registry (no server-only
// import) so non-server contexts can use them; re-exported here so existing
// `@/lib/frameworks/framework-installer` import sites keep working.
export {
  DEPRECATED_PACK_SLUGS,
  PACK_REGISTRY,
  PACK_SLUGS,
  getFrameworkCodeForSlug,
  getFrameworkSlugForCode,
  getPackFileForSlug,
};

let installPromise: Promise<void> | null = null;

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

  // Schema-tolerant insert — the table shape differs between
  // post-2026-03 deployments (`domain` / `risk_weight` / etc.) and the
  // legacy shape (`category` / `risk_level` / etc.). The runtime probe
  // `detectComplianceControlsSchema` resolves which to emit, but
  // TypeScript can only widen the union. Cast the heterogeneous array
  // through unknown so the supabase-js generic accepts it.
  await admin.from('compliance_controls').upsert(rows as unknown as never[], {
    onConflict: 'framework_id,code',
  });
}

export async function ensureFrameworkPacksInstalled() {
  if (installPromise) return installPromise;

  // Pack loading and syncComplianceFramework are upsert-only, so a retry
  // after a partial install is safe — and required, otherwise a single
  // failed run leaves this instance permanently believing the packs are
  // present. Only a run that completes may stay memoised.
  const attempt = (async () => {
    const admin = createSupabaseAdminClient();

    for (const pack of PACK_REGISTRY) {
      const filePath = path.join(process.cwd(), 'framework-packs', pack.file);
      await loadFrameworkPack({ path: filePath }, { adminClient: admin });
      await syncComplianceFramework(pack.slug, admin);
    }

    const result = await applyLegacyControlMapping(admin);
    if (!result.ok) {
      for (const err of result.errors) {
        consoleShim.warn('[framework-installer] legacy mapping:', err);
      }
    }
  })().catch((error: unknown) => {
    installPromise = null;
    consoleShim.error('[framework-installer] Failed to install packs:', error);
  });

  installPromise = attempt;
  return installPromise;
}

export async function installFrameworkPack(slug: string) {
  // v4-031: transparently redirect deprecated slug requests to the
  // current pack. Existing call sites that ask for `iso27001` or
  // `soc2` get the 2022 / TSC pack installed instead — without this
  // they would hit the "Unknown framework pack" error below since
  // PACK_REGISTRY no longer contains the legacy entries.
  const resolved = DEPRECATED_PACK_SLUGS[slug] ?? slug;
  if (resolved !== slug) {
    consoleShim.warn(
      `[framework-installer] legacy pack slug "${slug}" redirected to "${resolved}"`,
    );
  }
  const filePath = getPackFileForSlug(resolved);
  if (!filePath) {
    throw new Error(`Unknown framework pack: ${slug}`);
  }

  const admin = createSupabaseAdminClient();
  await loadFrameworkPack({ path: filePath }, { adminClient: admin });
  await syncComplianceFramework(resolved, admin);
}
