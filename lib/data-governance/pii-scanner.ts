import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { inferClassificationForField } from '@/lib/data-governance/classification';
import { logIdentityEvent } from '@/lib/identity/audit';

const PATTERNS = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  phone: /(?:\+?\d[\d\s().-]{7,}\d)/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  tfn: /\b\d{3}\s?\d{3}\s?\d{3}\b/,
  dob: /\b(19|20)\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b/,
  address: /\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(street|st|road|rd|avenue|ave|lane|ln|drive|dr|court|ct)\b/i,
  financial: /\b(?:\d[ -]*?){13,16}\b/,
};

function detectValueTypes(value: unknown) {
  const text = String(value ?? '');
  const matches: string[] = [];

  for (const [label, pattern] of Object.entries(PATTERNS)) {
    if (pattern.test(text)) {
      matches.push(label);
    }
  }

  return matches;
}

export function scanRecord(record: Record<string, unknown>) {
  return Object.entries(record).flatMap(([field, value]) => {
    const indicators = detectValueTypes(value);
    const inferred = inferClassificationForField(field);

    if (!indicators.length && inferred.level === 'public') {
      return [];
    }

    return [
      {
        field,
        indicators: indicators.length ? indicators : ['name_based_rule'],
        level: indicators.length ? 'confidential' : inferred.level,
        sample: typeof value === 'string' ? value.slice(0, 64) : JSON.stringify(value)?.slice(0, 64),
      },
    ];
  });
}

export async function scanTable(
  table: string,
  sampleSize = 25,
  orgId?: string,
) {
  const admin = createSupabaseAdminClient();
  let query = admin.from(table).select('*').limit(sampleSize);

  if (orgId) {
    if (['identity_audit_events', 'retention_policies', 'retention_executions'].includes(table)) {
      query = query.eq('org_id', orgId);
    } else {
      query = query.eq('organization_id', orgId);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const findings = ((data ?? []) as Array<Record<string, unknown>>).map((record) => ({
    id: String(record.id ?? ''),
    findings: scanRecord(record),
  }));

  return {
    table,
    sampleSize: findings.length,
    piiFindings: findings.filter((item) => item.findings.length > 0),
  };
}

export async function generatePIIReport(orgId: string) {
  const admin = createSupabaseAdminClient();
  const tables = [
    'org_members',
    'user_profiles',
    'org_evidence',
    'org_policies',
    'notifications',
    'identity_audit_events',
  ];

  const scans = [];
  for (const table of tables) {
    const scan = await scanTable(table, 25, orgId);
    scans.push(scan);

    await admin.from('pii_scan_results').insert({
      org_id: orgId,
      table_name: table,
      sample_size: scan.sampleSize,
      findings: scan.piiFindings,
      created_at: new Date().toISOString(),
    });
  }

  await logIdentityEvent({
    eventType: 'governance.pii.scan',
    actorType: 'system',
    orgId,
    result: 'success',
    metadata: {
      table_count: tables.length,
      flagged_tables: scans.filter((scan) => scan.piiFindings.length > 0).length,
    },
  });

  return {
    generatedAt: new Date().toISOString(),
    scans,
  };
}
