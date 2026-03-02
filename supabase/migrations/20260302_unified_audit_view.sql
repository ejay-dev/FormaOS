-- Unified Audit Log View
-- Combines org_audit_logs, org_audit_events, admin_audit_log, and security_audit_log
-- into a single queryable view for compliance reporting and enterprise export.
--
-- Architecture:
--   org_audit_logs     — general org-level action log (simple action + target)
--   org_audit_events   — structured compliance events (before/after state)
--   admin_audit_log    — platform admin actions (no org scope)
--   security_audit_log — security events with IP/UA tracking
--
-- Each table retains its own insert path. This view unifies reads.

CREATE OR REPLACE VIEW public.unified_org_audit_log AS

SELECT
  id,
  organization_id,
  action,
  'audit_log' AS source_table,
  actor_email AS actor,
  target AS target_resource,
  entity_id,
  NULL::jsonb AS before_state,
  NULL::jsonb AS after_state,
  NULL::inet AS ip_address,
  created_at
FROM public.org_audit_logs

UNION ALL

SELECT
  id,
  organization_id,
  action_type AS action,
  'audit_event' AS source_table,
  actor_user_id::text AS actor,
  entity_type AS target_resource,
  entity_id,
  before_state,
  after_state,
  NULL::inet AS ip_address,
  created_at
FROM public.org_audit_events

UNION ALL

SELECT
  id,
  organization_id,
  event_type AS action,
  'security_log' AS source_table,
  user_id::text AS actor,
  event_type AS target_resource,
  NULL::uuid AS entity_id,
  NULL::jsonb AS before_state,
  metadata AS after_state,
  ip_address,
  created_at
FROM public.security_audit_log;

-- Note: admin_audit_log is excluded from this org-scoped view
-- because it has no organization_id column (platform-level events).

COMMENT ON VIEW public.unified_org_audit_log IS
  'Unified read view across org_audit_logs, org_audit_events, and security_audit_log for compliance reporting.';
