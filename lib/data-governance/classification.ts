import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type DataClassificationLevel =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted';

export interface DataClassificationRule {
  fieldPattern: RegExp;
  level: DataClassificationLevel;
  reason: string;
}

export const AUTO_CLASSIFICATION_RULES: DataClassificationRule[] = [
  { fieldPattern: /(email|phone|mobile|contact)/i, level: 'confidential', reason: 'Direct contact details' },
  { fieldPattern: /(ssn|tfn|tax|passport|license|drivers?_license)/i, level: 'restricted', reason: 'Government identifiers' },
  { fieldPattern: /(dob|date_of_birth|birth)/i, level: 'confidential', reason: 'Date of birth' },
  { fieldPattern: /(address|street|city|postcode|zip)/i, level: 'confidential', reason: 'Location information' },
  { fieldPattern: /(bank|account|iban|swift|card|payment)/i, level: 'restricted', reason: 'Financial data' },
  { fieldPattern: /(password|secret|token|private_key|access_key)/i, level: 'restricted', reason: 'Secrets or credentials' },
];

export function inferClassificationForField(fieldName: string): {
  level: DataClassificationLevel;
  reason: string;
} {
  for (const rule of AUTO_CLASSIFICATION_RULES) {
    if (rule.fieldPattern.test(fieldName)) {
      return { level: rule.level, reason: rule.reason };
    }
  }

  if (/(name|department|title|status)/i.test(fieldName)) {
    return { level: 'internal', reason: 'Operational business data' };
  }

  return { level: 'public', reason: 'No sensitive indicators detected' };
}

export async function listClassifications(orgId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('data_classifications')
    .select('*')
    .eq('org_id', orgId)
    .order('resource_type', { ascending: true })
    .order('field_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function upsertClassifications(
  orgId: string,
  entries: Array<{
    resource_type: string;
    field_name: string;
    level: DataClassificationLevel;
    source?: 'manual' | 'automatic';
    notes?: string | null;
  }>,
) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from('data_classifications').upsert(
    entries.map((entry) => ({
      org_id: orgId,
      resource_type: entry.resource_type,
      field_name: entry.field_name,
      level: entry.level,
      source: entry.source ?? 'manual',
      notes: entry.notes ?? null,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'org_id,resource_type,field_name' },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function generateClassificationReport(orgId: string) {
  const rows = await listClassifications(orgId);
  const breakdown = rows.reduce((acc: Record<string, number>, row: any) => {
    acc[row.level] = (acc[row.level] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    totalFields: rows.length,
    breakdown,
    classifications: rows,
  };
}
