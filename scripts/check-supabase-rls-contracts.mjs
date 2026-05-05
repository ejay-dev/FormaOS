#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

config({ path: '.env.local' });

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const reportPath = path.join(process.cwd(), 'artifacts', 'qa', 'supabase-rls-contracts.json');
const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const serviceRoleKey = clean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
);

const failures = [];
const warnings = [];
const liveResults = [];

function clean(value) {
  return (value || '').trim().replace(/^['"]|['"]$/g, '');
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`WARN ${message}`);
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function readMigrations() {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      file,
      sql: readFileSync(path.join(migrationsDir, file), 'utf8'),
    }));
}

function normalizeTableName(raw) {
  return raw
    .replace(/^if\s+not\s+exists\s+/i, '')
    .replace(/^public\./i, '')
    .replace(/[";]/g, '')
    .trim();
}

function extractCreatedTables(migrations) {
  const tableFiles = new Map();
  const createTable = /create\s+table\s+(?:if\s+not\s+exists\s+)?((?:public\.)?["\w]+)/gi;

  for (const migration of migrations) {
    for (const match of migration.sql.matchAll(createTable)) {
      const table = normalizeTableName(match[1]);
      if (!tableFiles.has(table)) tableFiles.set(table, new Set());
      tableFiles.get(table).add(migration.file);
    }
  }

  return tableFiles;
}

function hasOrgScope(sql, table) {
  const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tableBlock = new RegExp(
    `create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(?:public\\.)?"?${escaped}"?\\s*\\((?<body>[\\s\\S]*?)\\);`,
    'i',
  );
  const match = sql.match(tableBlock);
  return Boolean(
    match?.groups?.body.match(/\b(org_id|organization_id|parent_org_id)\b/i),
  );
}

function isTenantOrSensitiveTable(table, files, migrations) {
  if (
    table.startsWith('org_') &&
    !['org_form_templates', 'org_ndis_price_guide'].includes(table)
  ) {
    return true;
  }

  if (/(audit|export|webhook|subscription|member|evidence|task|policy)/i.test(table)) {
    return true;
  }

  return [...files].some((file) => {
    const migration = migrations.find((item) => item.file === file);
    return migration ? hasOrgScope(migration.sql, table) : false;
  });
}

function assertStaticRlsContracts(migrations) {
  const allSql = migrations.map((migration) => migration.sql).join('\n');
  const createdTables = extractCreatedTables(migrations);
  const ignoredTables = new Set([
    'schema_migrations',
    'supabase_migrations',
    'spatial_ref_sys',
  ]);

  for (const [table, files] of createdTables.entries()) {
    if (ignoredTables.has(table)) continue;
    const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rlsEnabled = new RegExp(
      `alter\\s+table\\s+(?:if\\s+exists\\s+)?(?:public\\.)?"?${escaped}"?\\s+enable\\s+row\\s+level\\s+security`,
      'i',
    ).test(allSql);
    const policyExists = new RegExp(
      `create\\s+policy[\\s\\S]+?on\\s+(?:public\\.)?"?${escaped}"?`,
      'i',
    ).test(allSql);
    const orgScoped = [...files].some((file) => {
      const migration = migrations.find((item) => item.file === file);
      return migration ? hasOrgScope(migration.sql, table) : false;
    });
    const shouldEnforceRls = isTenantOrSensitiveTable(table, files, migrations);

    if (!rlsEnabled && shouldEnforceRls) {
      fail(`${table} is created but no RLS enable statement was found`);
    } else if (!rlsEnabled) {
      warn(`${table} is created without RLS; treated as shared/reference data`);
    }
    if (!policyExists) warn(`${table} has no CREATE POLICY statement in migrations`);
    if (!orgScoped && shouldEnforceRls && table.startsWith('org_')) {
      fail(`${table} appears tenant-scoped but has no org_id/organization_id column`);
    }
  }

  pass(`Static RLS scan covered ${createdTables.size} created tables`);
}

async function assertLiveRlsCatalog() {
  if (!supabaseUrl || !serviceRoleKey) {
    warn('Skipping live RLS catalog checks because Supabase service credentials are not set');
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.rpc('exec_sql', {
    sql: `
      select c.relname as table_name, c.relrowsecurity as rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relkind = 'r'
      order by c.relname
    `,
  });

  if (error) {
    warn(`Skipping live RLS catalog checks: ${error.message}`);
    return;
  }

  for (const row of data || []) {
    liveResults.push(row);
    if (!row.rls_enabled) fail(`Live table ${row.table_name} does not have RLS enabled`);
  }
  pass(`Live RLS catalog checked ${(data || []).length} public tables`);
}

const migrations = readMigrations();
assertStaticRlsContracts(migrations);
await assertLiveRlsCatalog();

mkdirSync(path.dirname(reportPath), { recursive: true });
writeFileSync(
  reportPath,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      failures,
      warnings,
      liveResults,
    },
    null,
    2,
  )}\n`,
);

if (failures.length > 0) {
  console.error(`Supabase RLS contract checks failed with ${failures.length} failure(s)`);
  process.exit(1);
}

console.log(`Supabase RLS contract checks passed. Report written to ${reportPath}`);
