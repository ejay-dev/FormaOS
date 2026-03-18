# Platform Control Contracts

This file reduces hidden complexity by defining what each platform control stream means.

## 1. Admin Audit

Purpose:

- immutable or near-immutable record of privileged platform actions

Current read surface:

- `platform_admin_audit_feed`

Examples:

- org lock/unlock
- org suspend/restore
- user lock/unlock
- plan change
- trial reset/extend
- release updates
- control-plane mutations

## 2. User Activity

Purpose:

- end-user and session-adjacent action history useful for security and support

Current read surface:

- `user_activity`

Examples:

- route activity
- entity interaction
- session-linked behavior

## 3. Security Events And Alerts

Purpose:

- machine- or rule-generated security detections and their operator triage state

Current read surfaces:

- `security_events`
- `security_alerts`

Examples:

- suspicious activity
- correlated alert status
- assignment and resolution metadata

## 4. Customer Health

Purpose:

- activation, engagement, compliance trend, and rescue guidance for org-level success risk

Current sources:

- `org_health_scores`
- activation milestone derivation
- billing/trial risk signals

## 5. Lifecycle Status

Purpose:

- operator-controlled org access state distinct from normal billing state

Current source:

- `organizations.lifecycle_status`

States:

- `active`
- `suspended`
- `retired`

## Contract Rule

When adding a new platform action, decide first which stream owns it:

- admin audit
- user activity
- security event / alert
- customer health
- lifecycle state

Do not invent a new parallel stream unless the existing ones are clearly insufficient.
