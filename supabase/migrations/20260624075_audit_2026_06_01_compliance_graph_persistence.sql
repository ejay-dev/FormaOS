-- Audit 2026-06-01 — persistent, queryable compliance graph.
--
-- Background: lib/compliance-graph.ts derived a GraphNode[]/GraphWire[]
-- node-wire structure entirely in memory on every auth-callback, logged
-- the counts, and discarded the result. There was NO graph table, so the
-- "compliance graph" could never be queried, rendered, or audited after
-- the request that built it.
--
-- This migration adds the two backing tables. Derivation stays in
-- TypeScript (lib/compliance-graph.ts → rebuildOrgGraph); WRITES go
-- through the service-role admin client (which bypasses RLS), so the
-- append-only RESTRICTIVE policies below close off direct mutation by
-- `authenticated` session callers while still letting org members SELECT
-- their own graph. READS go through the member-facing session client and
-- are gated by the org-membership SELECT policy.
--
-- No current_setting('app.*') anywhere — membership is checked via
-- auth.uid() + an EXISTS over org_members (matches the convention in
-- 20260624069_audit_2026_05_27_compliance_health_snapshots.sql).

-- ---------------------------------------------------------------------------
-- graph_nodes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  node_type text NOT NULL CHECK (
    node_type IN ('organization', 'role', 'policy', 'task', 'evidence', 'audit', 'entity')
  ),
  source_id uuid NOT NULL,
  label text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, node_type, source_id)
);

CREATE INDEX IF NOT EXISTS graph_nodes_org_type_idx
  ON public.graph_nodes (organization_id, node_type);
CREATE INDEX IF NOT EXISTS graph_nodes_org_source_idx
  ON public.graph_nodes (organization_id, source_id);

-- ---------------------------------------------------------------------------
-- graph_wires
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.graph_wires (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_node_id uuid NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES public.graph_nodes(id) ON DELETE CASCADE,
  wire_type text NOT NULL CHECK (
    wire_type IN ('organization_user', 'user_role', 'policy_task', 'task_evidence', 'evidence_audit')
  ),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, wire_type, from_node_id, to_node_id)
);

CREATE INDEX IF NOT EXISTS graph_wires_org_from_idx
  ON public.graph_wires (organization_id, from_node_id);
CREATE INDEX IF NOT EXISTS graph_wires_org_to_idx
  ON public.graph_wires (organization_id, to_node_id);

-- ---------------------------------------------------------------------------
-- RLS — ENABLE + FORCE on both, member SELECT, append-only for authenticated
-- ---------------------------------------------------------------------------
ALTER TABLE public.graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_nodes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.graph_wires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_wires FORCE ROW LEVEL SECURITY;

-- Drop-if-exists so the migration is safe to re-run (CREATE POLICY is not
-- idempotent; the rest of this file already uses IF NOT EXISTS).
DROP POLICY IF EXISTS graph_nodes_select_org_members ON public.graph_nodes;
DROP POLICY IF EXISTS graph_nodes_no_insert ON public.graph_nodes;
DROP POLICY IF EXISTS graph_nodes_no_update ON public.graph_nodes;
DROP POLICY IF EXISTS graph_nodes_no_delete ON public.graph_nodes;
DROP POLICY IF EXISTS graph_wires_select_org_members ON public.graph_wires;
DROP POLICY IF EXISTS graph_wires_no_insert ON public.graph_wires;
DROP POLICY IF EXISTS graph_wires_no_update ON public.graph_wires;
DROP POLICY IF EXISTS graph_wires_no_delete ON public.graph_wires;

-- Org members may SELECT their own graph. Writes are service-role-only
-- (rebuildOrgGraph via the admin client), so the table is append-only
-- from the application's authenticated point of view.
CREATE POLICY graph_nodes_select_org_members
  ON public.graph_nodes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = graph_nodes.organization_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY graph_nodes_no_insert
  ON public.graph_nodes
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY graph_nodes_no_update
  ON public.graph_nodes
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY graph_nodes_no_delete
  ON public.graph_nodes
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);

CREATE POLICY graph_wires_select_org_members
  ON public.graph_wires
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.organization_id = graph_wires.organization_id
        AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY graph_wires_no_insert
  ON public.graph_wires
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY graph_wires_no_update
  ON public.graph_wires
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY graph_wires_no_delete
  ON public.graph_wires
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);

COMMENT ON TABLE public.graph_nodes IS
  'Audit 2026-06-01: persisted compliance-graph nodes (organization|role|policy|task|evidence|audit|entity). Derived in TypeScript by lib/compliance-graph.ts rebuildOrgGraph and UPSERTed via the service-role admin client; org members read via RLS. Append-only for authenticated.';
COMMENT ON TABLE public.graph_wires IS
  'Audit 2026-06-01: persisted compliance-graph wires (organization_user|user_role|policy_task|task_evidence|evidence_audit) connecting graph_nodes. Service-role writes via rebuildOrgGraph; org members read via RLS. Append-only for authenticated.';
