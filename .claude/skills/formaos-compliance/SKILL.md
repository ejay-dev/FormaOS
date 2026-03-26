---
name: formaos-compliance
description: Build, extend, and debug compliance framework features in FormaOS. Use when working with compliance controls, framework packs (SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS, CIS, NIST CSF), compliance scoring, posture dashboards, control evaluations, or the compliance graph (node-wire architecture). Also use when adding new frameworks, modifying compliance logic, or fixing compliance-related bugs.
---

# FormaOS Compliance Engineering

## Architecture Overview

FormaOS uses a **Compliance Graph** with a Node-Wire architecture:
- **7 Node Types:** organization, role, policy, task, evidence, audit, entity
- **5 Wire Types:** organization_user, user_role, policy_task, task_evidence, evidence_audit
- Graph is auto-initialized on org creation

## Key Files & Directories

| Area | Path |
|------|------|
| Compliance logic & graph | `lib/compliance/` |
| Controls management | `lib/controls/` |
| Framework packs | `lib/frameworks/` (SOC 2, ISO, GDPR, HIPAA, PCI-DSS, CIS, NIST) |
| Compliance scoring & analytics | `lib/analytics.ts` |
| Compliance UI pages | `app/app/compliance/` |
| Control evaluation UI | `app/app/controls/` |
| Evidence management | `app/app/evidence/`, `lib/evidence/` |
| Compliance graph visualization | `components/compliance-system/` |
| Compliance API routes | `app/api/v1/compliance/`, `app/api/v1/controls/`, `app/api/v1/frameworks/` |
| Compliance cron job | `app/api/cron/` (runs daily at 6 AM UTC) |
| Compliance tests | `e2e/compliance-export.spec.ts`, `__tests__/lib/compliance/` |
| Compliance CI checks | `.github/workflows/compliance-testing.yml` |

## Workflow

### Adding a New Compliance Framework
1. Create framework pack in `lib/frameworks/` following existing patterns (SOC 2, ISO 27001)
2. Define controls, control families, and mappings
3. Add framework to the compliance graph initialization logic in `lib/compliance/`
4. Create UI for framework selection in `app/app/compliance/`
5. Add scoring logic in `lib/analytics.ts`
6. Write tests: unit in `__tests__/lib/compliance/`, E2E in `e2e/`
7. Run `npm run test:compliance:all` to validate

### Modifying Compliance Scoring
1. Read `lib/analytics.ts` for current scoring algorithms
2. Check `lib/compliance/` for graph traversal logic
3. Verify scoring feeds into dashboard at `app/app/dashboard/`
4. Update compliance posture calculations
5. Run compliance tests to verify

### Working with Controls
1. Controls are defined per-framework in `lib/frameworks/`
2. Control evaluations live in `lib/controls/`
3. Controls map to evidence via the compliance graph wires
4. API: `app/api/v1/controls/`

## Rules

- **Always preserve multi-tenant isolation** — compliance data is org-scoped via RLS
- **Never bypass RLS** when querying compliance data
- **Framework packs are additive** — never remove existing framework support
- **Compliance scoring must be deterministic** — same inputs = same score
- **Evidence linkage is auditable** — all changes to evidence-control mappings must be logged via `lib/audit-trail.ts`
- **Run `npm run test:compliance:all`** after any compliance changes
- **Check the compliance graph** — changes to node/wire types can cascade across the entire system
