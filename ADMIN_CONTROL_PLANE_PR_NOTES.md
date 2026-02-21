## How To Use (Admin Control Plane)

1. Open ` /admin/control-plane ` (founder-only).
2. Feature flags:
- Create `marketing_new_hero` as `global` with `enabled=true`, `rollout=25`, variants `{"control":50,"v2":50}`.
- Add org override with `scopeType=organization`, `scopeId=<org-id>` to force enable for one tenant.
- Use `kill-switch` to instantly disable the flag globally.
3. Marketing controls:
- Update `home.hero.headline_primary` / `headline_accent` / CTA labels and links.
- Toggle `home.runtime.expensive_effects_enabled` to disable heavy motion/3D.
- Change `home.runtime.active_showcase_module` to `interactive_demo`, `evidence_showcase`, or `task_showcase`.
- Toggle `home.runtime.section_visibility` keys to hide/show homepage sections.
4. Integrations:
- Toggle `google_drive`, `google_calendar`, `google_gmail` enabled state.
- Toggle individual scopes under each integration.
- Click `Retry` to record a retry request and move status to `syncing`.
5. Ops & security:
- Toggle `maintenance_mode`, `read_only_mode`, `emergency_lockdown`.
- Update `rate_limit_mode.multiplier` for global throttle scaling.
6. Automation jobs:
- Run `Run cleanup`, `Rebuild search index`, `Recompute scores`, `Regenerate trust packet`, `Flush cache`, `Warm CDN`.
- Track progress/status/logs in the live job list.
7. Audit:
- All mutations append immutable entries to `public.audit_log` and stream live in the Audit panel.

Live updates are delivered via SSE endpoints:
- Admin stream: `/api/admin/control-plane/stream`
- Runtime stream (app + marketing): `/api/runtime/control-plane/stream`

Validation checklist and replay steps:
- See `ADMIN_CONTROL_PLANE_VALIDATION.md`
