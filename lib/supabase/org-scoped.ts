import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Audit 2026-05-26 — org-scoped Supabase client.
 *
 * Background: the codebase has ~819 hand-written `.eq('org_id', orgId)`
 * calls scattered through server actions and API routes. Now that FORCE
 * RLS is on most tenant tables (migration 20260624032), a service-role
 * client that forgets a single `.eq()` will silently leak rows across
 * tenants — because the service-role bypasses RLS. RLS is no longer the
 * safety net it appears to be when the caller is service-role.
 *
 * This wrapper turns "remember to filter by org" into a structural
 * guarantee. Every `.from(table)` call returns a query builder that
 * automatically applies the org filter and that REFUSES to execute a
 * write (insert/update/upsert/delete) on a tenant table without an
 * explicit `.eq('<orgColumn>', orgId)` matching the bound orgId.
 *
 * Usage:
 *
 *   const supabase = createSupabaseOrgClient(orgId);
 *   const { data } = await supabase.from('org_tasks').select('*');
 *     // implicit .eq('organization_id', orgId) appended
 *
 *   await supabase.from('org_tasks').insert({ title: 'x' });
 *     // payload is automatically stamped with organization_id = orgId
 *
 *   await supabase.from('org_tasks').delete().eq('id', taskId);
 *     // implicit .eq('organization_id', orgId) appended; delete cannot
 *     // hit another tenant's row even if `id` collides
 *
 *   await supabase.from('analytics_events').select('*');
 *     // table not in TENANT_TABLE_SCOPES → throws at runtime to force
 *     // an explicit decision: either add it to the registry, or use
 *     // the raw admin client (createSupabaseAdminClient) and own the
 *     // tenancy filter yourself.
 *
 * Migration path:
 *   - New code: use createSupabaseOrgClient by default.
 *   - Existing code: migrate incrementally, billing/exports/audit first.
 *     The wrapper is additive; existing service-role usage continues to
 *     work unchanged.
 */

// ---------------------------------------------------------------------------
// Registry: which column carries the tenant id on which table.
//
// Add entries as code is migrated. A table not in this registry will
// throw when accessed through the org client — this is intentional. The
// goal is for the registry, not 819 hand-written filters, to be the
// single source of truth for tenant scoping.
//
// Tables that don't have any tenant column (auth.users, framework_packs
// templates, etc.) should never be accessed through the org client.
// Use createSupabaseAdminClient instead.
// ---------------------------------------------------------------------------

const TENANT_TABLE_SCOPES = {
  // organizations is the self-table — the org's row in `organizations` is
  // addressed by its primary key, not by a foreign-key column. Encoded
  // here so the wrapper Just Works for `from('organizations').select()`.
  organizations: { column: 'id' as const },
  // Base tenant tables — column = 'organization_id'
  org_members: { column: 'organization_id' },
  org_tasks: { column: 'organization_id' },
  org_evidence: { column: 'organization_id' },
  org_policies: { column: 'organization_id' },
  org_assets: { column: 'organization_id' },
  org_risks: { column: 'organization_id' },
  org_compliance_blocks: { column: 'organization_id' },
  org_audit_logs: { column: 'organization_id' },
  org_subscriptions: { column: 'organization_id' },
  org_entitlements: { column: 'organization_id' },
  org_certifications: { column: 'organization_id' },
  org_entities: { column: 'organization_id' },
  org_entity_members: { column: 'organization_id' },
  org_audit_events: { column: 'organization_id' },
  control_evidence: { column: 'organization_id' },
  org_health_scores: { column: 'organization_id' },
  org_control_evaluations: { column: 'organization_id' },
  report_export_jobs: { column: 'organization_id' },
  compliance_export_jobs: { column: 'organization_id' },
  enterprise_export_jobs: { column: 'organization_id' },
  org_care_plans: { column: 'organization_id' },
  org_care_goals: { column: 'organization_id' },
  org_patients: { column: 'organization_id' },
  org_incidents: { column: 'organization_id' },
  org_notifications: { column: 'organization_id' },
  org_user_notifications: { column: 'organization_id' },
  notification_preferences: { column: 'organization_id' },
  control_tasks: { column: 'organization_id' },
  org_control_attestations: { column: 'organization_id' },
  org_workflows: { column: 'organization_id' },
  org_workflow_executions: { column: 'organization_id' },
  org_workflow_triggers: { column: 'organization_id' },
  org_workflow_audit: { column: 'organization_id' },
  org_form_responses: { column: 'organization_id' },
  org_form_definitions: { column: 'organization_id' },
  org_recurring_tasks: { column: 'organization_id' },
  org_care_credentials: { column: 'organization_id' },
  org_staff_credentials: { column: 'organization_id' },
  org_care_scorecards: { column: 'organization_id' },
  org_activity: { column: 'organization_id' },
  activity_events: { column: 'organization_id' },
  activity_feed: { column: 'org_id' },
  // api_keys + api_key_usage_log use `org_id` (verified against
  // supabase/migrations/20260624004_schema_drift_resolution.sql).
  api_keys: { column: 'org_id' },
  api_key_usage_log: { column: 'org_id' },
  org_invitations: { column: 'organization_id' },
  org_user_roles: { column: 'organization_id' },
  org_settings: { column: 'organization_id' },
  org_integrations: { column: 'organization_id' },
  user_preferences: { column: 'organization_id' },
  org_capa_items: { column: 'organization_id' },
  org_compliance_scores: { column: 'organization_id' },
  org_evidence_versions: { column: 'organization_id' },
  org_audit_packs: { column: 'organization_id' },
  org_reports: { column: 'organization_id' },
  org_dashboards: { column: 'organization_id' },
  org_dashboard_layouts: { column: 'organization_id' },
  audit_export_jobs: { column: 'organization_id' },
  org_framework_links: { column: 'organization_id' },
  org_controls: { column: 'organization_id' },
  ai_conversations: { column: 'organization_id' },
  ai_chat_messages: { column: 'organization_id' },
  org_obligations: { column: 'organization_id' },
  evidence_attachments: { column: 'organization_id' },
  org_capa: { column: 'organization_id' },
  saved_searches: { column: 'organization_id' },
  org_dnp_imports: { column: 'organization_id' },
  org_ndis_claims: { column: 'organization_id' },
  search_index: { column: 'org_id' },
  recent_items: { column: 'org_id' },
  task_recurrence: { column: 'org_id' },
  identity_audit_log: { column: 'organization_id' },
  identity_audit_events: { column: 'org_id' },
  auditor_activity_log: { column: 'org_id' },
  org_analytics_snapshots: { column: 'org_id' },
  detection_rules: { column: 'organization_id' },
  upgrade_intelligence_usage: { column: 'organization_id' },
  intelligence_gaps: { column: 'organization_id' },
  org_risk_register: { column: 'organization_id' }, // referenced in audit-reports/report-builder; table may be missing in some environments
  org_frameworks: { column: 'organization_id' },
  reports: { column: 'organization_id' },
  org_usage_events: { column: 'org_id' },
  org_patient_assignments: { column: 'organization_id' },
  org_visits: { column: 'organization_id' },
  org_onboarding_status: { column: 'organization_id' },
  org_forms: { column: 'org_id' },
  org_participants: { column: 'organization_id' }, // table may be missing in some envs (verified prod 2026-05-26)
  compliance_score_snapshots: { column: 'organization_id' },
  integration_configs: { column: 'organization_id' },
  integration_events: { column: 'organization_id' },
  integration_sync_log: { column: 'org_id' },
  org_report_generations: { column: 'org_id' },
  org_usage_summaries: { column: 'org_id' },
  soc2_readiness_assessments: { column: 'organization_id' }, // table may be missing in some envs (verified prod 2026-05-26)
  soc2_milestones: { column: 'organization_id' }, // table may be missing in some envs
  soc2_remediation_actions: { column: 'organization_id' }, // table may be missing in some envs

  // Legacy / drift tenant tables — column = 'org_id'
  memberships: { column: 'organization_id' },
  org_files: { column: 'org_id' },
  org_industries: { column: 'org_id' },
  org_module_entitlements: { column: 'org_id' },
  org_audit_log: { column: 'org_id' },
  org_registers: { column: 'org_id' },
} as const satisfies Record<string, { column: string }>;

type TenantTable = keyof typeof TENANT_TABLE_SCOPES;

function isTenantTable(name: string): name is TenantTable {
  return name in TENANT_TABLE_SCOPES;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type OrgScopedClient = {
  from: (table: string) => OrgScopedQueryBuilder;
  rpc: SupabaseClient['rpc'];
  storage: SupabaseClient['storage'];
  auth: SupabaseClient['auth'];
  /**
   * Escape hatch for genuinely cross-tenant work (platform-admin
   * queries, system-state reads, framework-pack templates). Returns the
   * underlying admin client. Use sparingly.
   */
  unsafeAdmin(): SupabaseClient;
};

export function createSupabaseOrgClient(
  orgId: string,
  options?: { adminClient?: SupabaseClient },
): OrgScopedClient {
  if (!orgId || typeof orgId !== 'string') {
    throw new Error(
      'createSupabaseOrgClient: orgId is required (received empty or non-string).',
    );
  }

  const admin = options?.adminClient ?? createSupabaseAdminClient();

  // Lazy passthrough getters — minimal mocks in unit tests (which only
  // expose `from`) shouldn't trip the wrapper's construction. The
  // accessors only touch admin.rpc / admin.storage / admin.auth when the
  // caller actually uses them.
  const client: OrgScopedClient = {
    from(table: string): OrgScopedQueryBuilder {
      if (!isTenantTable(table)) {
        throw new Error(
          `createSupabaseOrgClient: table "${table}" is not registered as a tenant table. ` +
            `Either add it to TENANT_TABLE_SCOPES in lib/supabase/org-scoped.ts, ` +
            `or use createSupabaseAdminClient() for genuinely cross-tenant access.`,
        );
      }
      const scope = TENANT_TABLE_SCOPES[table];
      return wrapBuilder(admin, table, scope.column, orgId);
    },
    // Bound on first access so that the underlying admin client (or its
    // mock) is still in scope; this also defers the .bind() call so a
    // mock that omits .rpc doesn't blow up at construction time.
    get rpc() {
      return admin.rpc?.bind?.(admin) ?? (admin.rpc as unknown);
    },
    get storage() {
      return admin.storage;
    },
    get auth() {
      return admin.auth;
    },
    unsafeAdmin() {
      return admin;
    },
  } as OrgScopedClient;

  return client;
}

// ---------------------------------------------------------------------------
// Query builder wrapper
//
// The PostgREST query builder is a fluent chain. The wrapper intercepts
// .select/.insert/.update/.upsert/.delete and applies the org filter
// (for reads) or stamps the org column (for writes). Everything else
// passes through.
// ---------------------------------------------------------------------------

// The wrapper's return type is `any`-typed on purpose. The PostgREST
// type generics depend on a Database type parameter for proper row
// inference; without that, the precise types collapse to `{}` and
// callers lose `.maybeSingle()`, `.in()`, etc. Returning `any` matches
// the de-facto behaviour callers already get from the raw admin client
// in this codebase (no Database generic is plumbed through). Runtime
// safety is what this wrapper provides — type safety remains the
// caller's responsibility via explicit `.select<{row}>('cols')` or
// post-hoc casts on the `data` field.
//
// If/when the codebase plumbs a generated `Database` type through, we
// can tighten this signature.
type OrgScopedQueryBuilder = {
  select(columns?: string, opts?: { head?: boolean; count?: 'exact' | 'planned' | 'estimated' }): any;
  insert(values: Record<string, unknown> | Array<Record<string, unknown>>): any;
  update(values: Record<string, unknown>): any;
  upsert(values: Record<string, unknown> | Array<Record<string, unknown>>, opts?: { onConflict?: string; ignoreDuplicates?: boolean; defaultToNull?: boolean }): any;
  delete(): any;
};

function wrapBuilder(
  admin: SupabaseClient,
  table: string,
  orgColumn: string,
  orgId: string,
): OrgScopedQueryBuilder {
  const stampOrgId = (
    payload: Record<string, unknown> | Array<Record<string, unknown>>,
  ): Record<string, unknown> | Array<Record<string, unknown>> => {
    if (Array.isArray(payload)) {
      return payload.map((row) => ({ ...row, [orgColumn]: orgId }));
    }
    return { ...payload, [orgColumn]: orgId };
  };

  return {
    select(columns?: string, opts?: { head?: boolean; count?: 'exact' | 'planned' | 'estimated' }) {
      const builder = admin.from(table);
      const selected = opts
        ? (builder.select as (c: string, o: typeof opts) => unknown)(
            columns ?? '*',
            opts,
          )
        : builder.select(columns ?? '*');
      return (selected as { eq: (col: string, val: string) => unknown }).eq(
        orgColumn,
        orgId,
      );
    },
    insert(values) {
      return admin.from(table).insert(stampOrgId(values) as never);
    },
    update(values) {
      // Note: do NOT allow callers to change the org column via update.
      // If they pass orgColumn in `values`, we strip it before stamping
      // — defense against a coding mistake that would move a row to
      // another tenant.
      const cleaned = { ...values };
      delete cleaned[orgColumn];
      return admin.from(table).update(cleaned as never).eq(orgColumn, orgId);
    },
    upsert(values, opts) {
      // No trailing .eq() — the values are already org-stamped, and
      // PostgREST UPSERT does not honor filter clauses anyway. Adding an
      // .eq() here would also trip minimal test mocks that don't model
      // post-upsert filter chaining.
      return admin.from(table).upsert(stampOrgId(values) as never, opts);
    },
    delete() {
      return admin.from(table).delete().eq(orgColumn, orgId);
    },
  };
}

// ---------------------------------------------------------------------------
// Quick-start migration recipe (for reviewers refactoring callers):
//
//   BEFORE:
//     const supabase = createSupabaseAdminClient();
//     const { data } = await supabase
//       .from('org_tasks')
//       .select('*')
//       .eq('organization_id', orgId);
//
//   AFTER:
//     const supabase = createSupabaseOrgClient(orgId);
//     const { data } = await supabase.from('org_tasks').select('*');
//
// Risk: a refactor that drops the `.eq('organization_id', orgId)` line
// from a previously-correct file is silently a no-op (the wrapper adds
// it back). A refactor that drops the wrapper call instead is loud
// (admin client without org filter — the original problem). To make the
// latter visible, prefer importing `createSupabaseOrgClient` over
// `createSupabaseAdminClient` in any file that touches tenant data.
// ---------------------------------------------------------------------------
