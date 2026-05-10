import type { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type LegacyControlMapping = {
  legacyCode: string;
  newFrameworkSlug: string;
  newCodes: string[];
  rationale: string;
  deprecated?: boolean;
};

export const SOC2_LEGACY_CODE_PREFIX = 'SOC2-';
export const ISO_LEGACY_CODE_PREFIX = 'ISO-';

export const LEGACY_SOC2_MAPPINGS: ReadonlyArray<LegacyControlMapping> = [
  {
    legacyCode: 'SOC2-S1',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['CC1.2', 'CC3.2'],
    rationale:
      'Legacy "Security governance and risk oversight" splits into board oversight (CC1.2) and risk identification (CC3.2).',
  },
  {
    legacyCode: 'SOC2-S2',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['CC6.1', 'CC6.2', 'CC6.3'],
    rationale:
      'Legacy "Identity and access management" splits across logical access (CC6.1), authorising access (CC6.2), and removing access (CC6.3).',
  },
  {
    legacyCode: 'SOC2-S3',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['CC7.2', 'CC7.3'],
    rationale:
      'Legacy "Security monitoring and detection" splits into anomaly monitoring (CC7.2) and event evaluation (CC7.3).',
  },
  {
    legacyCode: 'SOC2-A1',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['A1.1'],
    rationale:
      'Legacy "Availability planning" maps directly to A1.1 (maintain availability commitments).',
  },
  {
    legacyCode: 'SOC2-A2',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['A1.2', 'A1.3'],
    rationale:
      'Legacy "Resilience and recovery" splits into recovery infrastructure (A1.2) and recovery testing (A1.3).',
  },
  {
    legacyCode: 'SOC2-C1',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['C1.1'],
    rationale:
      'Legacy "Confidential data classification" maps directly to C1.1 (identify confidential information).',
  },
  {
    legacyCode: 'SOC2-C2',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['CC6.7'],
    rationale:
      'SOC 2 TSC has no dedicated cryptography control; CC6.7 (restricting information movement) is the closest analogue and the canonical place for encryption-at-transit / DLP evidence.',
  },
  {
    legacyCode: 'SOC2-PI1',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['CC8.1'],
    rationale:
      'Legacy "Change management" maps directly to CC8.1 (the SOC 2 change-management criterion).',
  },
  {
    legacyCode: 'SOC2-PI2',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['PI1.2', 'PI1.3'],
    rationale:
      'Legacy "Data processing quality" splits into inputs processing (PI1.2) and outputs processing (PI1.3).',
  },
  {
    legacyCode: 'SOC2-P1',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['P1.1', 'P2.1'],
    rationale:
      'Legacy "Privacy notice and consent" splits into privacy notice (P1.1) and choice/consent (P2.1).',
  },
  {
    legacyCode: 'SOC2-P2',
    newFrameworkSlug: 'soc2-tsc',
    newCodes: ['P5.1', 'P4.2', 'P4.3'],
    rationale:
      'Legacy "Data subject rights and retention" splits into access rights (P5.1), retention (P4.2), and disposal (P4.3).',
  },
];

export const LEGACY_ISO_MAPPINGS: ReadonlyArray<LegacyControlMapping> = [
  {
    legacyCode: 'ISO-A.5.1',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: ['A.5.1'],
    rationale:
      'Legacy "Information security policy set" maps directly to ISO 27001:2022 A.5.1 (Policies for information security).',
  },
  {
    legacyCode: 'ISO-A.6.1',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: [],
    deprecated: true,
    rationale:
      'Legacy "Risk management process" has no Annex A 2022 equivalent — risk management lives in ISO 27001 Clause 6 (ISMS requirements), not Annex A. Existing evidence stays for reference but the control needs re-onboarding under the new clause-aligned model.',
  },
  {
    legacyCode: 'ISO-A.8.1',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: ['A.5.9'],
    rationale:
      'Legacy "Asset inventory" (2013 A.8.1.1/1.2) consolidates into ISO 27001:2022 A.5.9 (Inventory of information and other associated assets).',
  },
  {
    legacyCode: 'ISO-A.9.1',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: ['A.5.15'],
    rationale:
      'Legacy "Access control policy" consolidates into A.5.15 (Access control) in the 2022 reorganisation.',
  },
  {
    legacyCode: 'ISO-A.9.2',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: ['A.5.16', 'A.5.18', 'A.5.17'],
    rationale:
      'Legacy "User lifecycle management" splits into identity management (A.5.16), access rights (A.5.18), and authentication information (A.5.17).',
  },
  {
    legacyCode: 'ISO-A.12.1',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: ['A.5.37'],
    rationale:
      'Legacy "Operational procedures" maps to A.5.37 (Documented operating procedures) in the 2022 reorganisation.',
  },
  {
    legacyCode: 'ISO-A.12.4',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: ['A.8.15', 'A.8.16'],
    rationale:
      'Legacy "Logging and monitoring" splits into logging (A.8.15) and monitoring activities (A.8.16).',
  },
  {
    legacyCode: 'ISO-A.16.1',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: ['A.5.24', 'A.5.26', 'A.5.27'],
    rationale:
      'Legacy "Incident management" splits into IR planning (A.5.24), IR response (A.5.26), and IR learning (A.5.27).',
  },
  {
    legacyCode: 'ISO-A.17.1',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: ['A.5.29', 'A.5.30'],
    rationale:
      'Legacy "Business continuity" splits into information security during disruption (A.5.29) and ICT readiness for business continuity (A.5.30).',
  },
  {
    legacyCode: 'ISO-A.18.1',
    newFrameworkSlug: 'iso27001-2022',
    newCodes: ['A.5.31', 'A.5.36'],
    rationale:
      'Legacy "Compliance obligations" splits into legal/statutory/regulatory obligations (A.5.31) and compliance with policies (A.5.36).',
  },
];

export const ALL_LEGACY_MAPPINGS: ReadonlyArray<LegacyControlMapping> = [
  ...LEGACY_SOC2_MAPPINGS,
  ...LEGACY_ISO_MAPPINGS,
];

const mappingByLegacyCode: Map<string, LegacyControlMapping> = new Map(
  ALL_LEGACY_MAPPINGS.map((m) => [m.legacyCode, m]),
);

export function getMappingForLegacyCode(
  legacyCode: string,
): LegacyControlMapping | null {
  return mappingByLegacyCode.get(legacyCode) ?? null;
}

export function isLegacyControlCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return (
    code.startsWith(SOC2_LEGACY_CODE_PREFIX) ||
    code.startsWith(ISO_LEGACY_CODE_PREFIX)
  );
}

export type LegacyMigrationSummary = {
  framework: string;
  ranAt: string;
  evaluationsUpdated: number;
  evaluationsInsertedForSplits: number;
  evaluationsDeprecated: number;
  evaluationsSkippedNoTarget: number;
};

export type LegacyMigrationResult = {
  ok: boolean;
  summaries: LegacyMigrationSummary[];
  errors: string[];
};

type EvaluationRow = {
  id: string;
  organization_id: string;
  control_type: string;
  control_key: string;
  required: boolean | null;
  status: string;
  last_evaluated_at: string | null;
  details: Record<string, unknown> | null;
  framework_id: string | null;
};

/**
 * Apply the legacy control-code mapping to org_control_evaluations.
 *
 * Idempotent: rows already keyed by standard codes are untouched. Rows that
 * already carry status='deprecated' with a legacy reason are not re-marked.
 *
 * Required preconditions: the new framework rows ('soc2-tsc' and
 * 'iso27001-2022') must have been loaded into the `frameworks` table. This
 * is satisfied by `ensureFrameworkPacksInstalled` running before this is
 * invoked.
 */
export async function applyLegacyControlMapping(
  admin: ReturnType<typeof createSupabaseAdminClient>,
): Promise<LegacyMigrationResult> {
  const summaries: LegacyMigrationSummary[] = [];
  const errors: string[] = [];

  const { data: frameworks, error: fwErr } = await admin
    .from('frameworks')
    .select('id, slug')
    .in('slug', ['soc2-tsc', 'iso27001-2022']);

  if (fwErr) {
    return {
      ok: false,
      summaries,
      errors: [`Failed to look up new frameworks: ${fwErr.message}`],
    };
  }

  const frameworkIdBySlug = new Map<string, string>(
    (frameworks ?? []).map((f: { id: string; slug: string }) => [
      f.slug,
      f.id,
    ]),
  );

  for (const slug of ['soc2-tsc', 'iso27001-2022'] as const) {
    if (!frameworkIdBySlug.has(slug)) {
      errors.push(
        `Skipping ${slug}: new framework row missing — has ensureFrameworkPacksInstalled run?`,
      );
    }
  }

  for (const slug of ['soc2-tsc', 'iso27001-2022'] as const) {
    const newFrameworkId = frameworkIdBySlug.get(slug) ?? null;
    if (!newFrameworkId) continue;

    const legacyCodes =
      slug === 'soc2-tsc'
        ? LEGACY_SOC2_MAPPINGS.map((m) => m.legacyCode)
        : LEGACY_ISO_MAPPINGS.map((m) => m.legacyCode);

    const { data: rows, error: rowErr } = await admin
      .from('org_control_evaluations')
      .select(
        'id, organization_id, control_type, control_key, required, status, last_evaluated_at, details, framework_id',
      )
      .in('control_key', legacyCodes);

    if (rowErr) {
      errors.push(
        `Failed to read org_control_evaluations for ${slug}: ${rowErr.message}`,
      );
      continue;
    }

    const summary: LegacyMigrationSummary = {
      framework: slug,
      ranAt: new Date().toISOString(),
      evaluationsUpdated: 0,
      evaluationsInsertedForSplits: 0,
      evaluationsDeprecated: 0,
      evaluationsSkippedNoTarget: 0,
    };

    for (const row of (rows ?? []) as EvaluationRow[]) {
      const mapping = getMappingForLegacyCode(row.control_key);
      if (!mapping) continue;

      if (mapping.deprecated || mapping.newCodes.length === 0) {
        const { error } = await admin
          .from('org_control_evaluations')
          .update({
            status: 'deprecated',
            details: {
              ...(row.details ?? {}),
              legacy_migration: {
                appliedAt: new Date().toISOString(),
                rationale: mapping.rationale,
                deprecated: true,
              },
            },
          })
          .eq('id', row.id);
        if (error) {
          errors.push(
            `Failed to deprecate ${row.control_key} for org ${row.organization_id}: ${error.message}`,
          );
        } else {
          summary.evaluationsDeprecated += 1;
        }
        continue;
      }

      if (mapping.newCodes.length === 1) {
        const newCode = mapping.newCodes[0];
        const { error } = await admin
          .from('org_control_evaluations')
          .update({
            control_key: newCode,
            framework_id: newFrameworkId,
            details: {
              ...(row.details ?? {}),
              legacy_migration: {
                appliedAt: new Date().toISOString(),
                fromCode: row.control_key,
                rationale: mapping.rationale,
              },
            },
          })
          .eq('id', row.id);
        if (error) {
          errors.push(
            `Failed to update ${row.control_key} → ${newCode} for org ${row.organization_id}: ${error.message}`,
          );
        } else {
          summary.evaluationsUpdated += 1;
        }
        continue;
      }

      const [primaryCode, ...additionalCodes] = mapping.newCodes;
      const { error: updErr } = await admin
        .from('org_control_evaluations')
        .update({
          control_key: primaryCode,
          framework_id: newFrameworkId,
          details: {
            ...(row.details ?? {}),
            legacy_migration: {
              appliedAt: new Date().toISOString(),
              fromCode: row.control_key,
              splitInto: mapping.newCodes,
              rationale: mapping.rationale,
            },
          },
        })
        .eq('id', row.id);
      if (updErr) {
        errors.push(
          `Failed to update split-primary ${row.control_key} → ${primaryCode} for org ${row.organization_id}: ${updErr.message}`,
        );
        continue;
      }
      summary.evaluationsUpdated += 1;

      for (const extraCode of additionalCodes) {
        const { error: insErr } = await admin
          .from('org_control_evaluations')
          .insert({
            organization_id: row.organization_id,
            control_type: row.control_type,
            control_key: extraCode,
            required: row.required ?? true,
            status: row.status,
            last_evaluated_at: row.last_evaluated_at ?? new Date().toISOString(),
            details: {
              ...(row.details ?? {}),
              legacy_migration: {
                appliedAt: new Date().toISOString(),
                fromCode: row.control_key,
                splitInto: mapping.newCodes,
                rationale: mapping.rationale,
                isSplitClone: true,
              },
            },
            framework_id: newFrameworkId,
          });
        if (insErr) {
          if (
            !insErr.message.includes('duplicate key') &&
            !insErr.message.includes('unique')
          ) {
            errors.push(
              `Failed to insert split ${extraCode} for org ${row.organization_id}: ${insErr.message}`,
            );
          }
        } else {
          summary.evaluationsInsertedForSplits += 1;
        }
      }
    }

    summaries.push(summary);
  }

  return { ok: errors.length === 0, summaries, errors };
}
