import { promises as fs } from 'fs';
import path from 'path';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { logIdentityEvent } from '@/lib/identity/audit';

const TENANT_TABLES = [
  { table: 'org_members', orgColumn: 'organization_id' },
  { table: 'org_tasks', orgColumn: 'organization_id' },
  { table: 'org_evidence', orgColumn: 'organization_id' },
  { table: 'org_policies', orgColumn: 'organization_id' },
  { table: 'org_assets', orgColumn: 'organization_id' },
  { table: 'org_risks', orgColumn: 'organization_id' },
  { table: 'notifications', orgColumn: 'org_id' },
  { table: 'activity_feed', orgColumn: 'org_id' },
  { table: 'identity_audit_events', orgColumn: 'org_id' },
];

async function readMigrationEvidence(table: string) {
  try {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = await fs.readdir(migrationsDir);
    const matching = files.filter((file) => file.endsWith('.sql'));
    const contents = await Promise.all(
      matching.map(async (file) => ({
        file,
        content: await fs.readFile(path.join(migrationsDir, file), 'utf8'),
      })),
    );

    return contents.some(
      ({ content }) =>
        content.toLowerCase().includes(table.toLowerCase()) &&
        content.toLowerCase().includes('policy'),
    );
  } catch {
    return false;
  }
}

export async function verifyIsolation(orgId: string) {
  const admin = createSupabaseAdminClient();
  const checks = [];

  for (const definition of TENANT_TABLES) {
    let crossOrgRows = 0;
    let hasOrgColumn = true;

    try {
      const { count, error } = await admin
        .from(definition.table)
        .select('id', { count: 'exact', head: true })
        .neq(definition.orgColumn, orgId);

      if (error) {
        hasOrgColumn = false;
      } else {
        crossOrgRows = count ?? 0;
      }
    } catch {
      hasOrgColumn = false;
    }

    const migrationEvidence = await readMigrationEvidence(definition.table);
    const status = hasOrgColumn && migrationEvidence ? 'pass' : 'warn';

    checks.push({
      table: definition.table,
      orgColumn: definition.orgColumn,
      hasOrgColumn,
      migrationEvidence,
      crossOrgRows,
      status,
      notes:
        status === 'pass'
          ? 'Tenant-scoped table appears to be covered by migration policy evidence.'
          : 'Heuristic verification found a schema or migration gap. Review RLS manually.',
    });
  }

  const summary = {
    passed: checks.filter((item) => item.status === 'pass').length,
    warnings: checks.filter((item) => item.status !== 'pass').length,
  };

  const { error } = await admin.from('isolation_verification_results').insert({
    org_id: orgId,
    checks,
    summary,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  await logIdentityEvent({
    eventType: 'governance.isolation.verified',
    actorType: 'system',
    orgId,
    result: summary.warnings > 0 ? 'failure' : 'success',
    metadata: summary,
  });

  return { checks, summary };
}

export async function generateIsolationReport(orgId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('isolation_verification_results')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return {
    generatedAt: new Date().toISOString(),
    results: data ?? [],
  };
}
