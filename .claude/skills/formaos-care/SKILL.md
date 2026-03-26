---
name: formaos-care
description: Build and extend FormaOS care operations features — care plans, patient/participant management, progress notes, care scorecards, and healthcare/social-care workflows. Use when working with care-specific UI, data models, NDIS/disability/aged-care compliance, or care industry integrations.
---

# FormaOS Care Operations Engineering

## Architecture Overview

FormaOS includes a **care operations module** designed for healthcare and social care providers (NDIS, aged care, disability services). This module provides:

- **Care Plans** — structured care planning with goals, interventions, reviews
- **Participants/Patients** — profile management, contact info, care history
- **Progress Notes** — clinical/care notes with timestamps and authorship
- **Care Scorecard** — outcome tracking and quality metrics
- **Care-specific workflows** — intake, assessment, review cycles

## Key Files & Directories

| Area | Path |
|------|------|
| Care plans UI | `app/app/care-plans/` |
| Participants UI | `app/app/participants/` |
| Patients UI | `app/app/patients/` |
| Care components | `components/care/` (if exists), otherwise within feature dirs |
| Care E2E tests | `e2e/care-industry-smoke.spec.ts` |
| Care-specific API | `app/api/v1/` (participant/patient endpoints) |

## Workflow

### Adding a Care Feature
1. Identify the care domain: plans, participants, notes, scorecard
2. Read existing care UI in `app/app/care-plans/` or `app/app/participants/`
3. Implement data model changes via Supabase migration (with RLS!)
4. Add API endpoint if needed (`app/api/v1/`)
5. Build UI components with accessibility in mind (healthcare compliance)
6. Write E2E tests — reference `e2e/care-industry-smoke.spec.ts`
7. Run: `npm run qa:smoke`

### Working with Progress Notes
1. Notes are timestamped, attributed to authenticated user
2. Notes are immutable once signed/locked (audit requirement)
3. Rich text support via TipTap editor
4. Notes are org-scoped and participant-linked

### Care Scorecard
1. Aggregates outcome metrics per participant/org
2. Feeds into compliance reporting
3. Dashboard visualization via Recharts

## Rules

- **Accessibility is mandatory** — care users include diverse abilities, use ARIA labels, keyboard navigation
- **Data sensitivity is high** — care data includes health information (HIPAA/privacy relevant)
- **Progress notes are audit-critical** — once signed, they cannot be modified (append-only corrections)
- **Participant data is org-scoped** — enforce RLS, never cross org boundaries
- **Care workflows must be mobile-friendly** — care workers use mobile devices in the field
- **Date/time handling must be timezone-aware** — care spans multiple timezones
- **Always test with `e2e/care-industry-smoke.spec.ts`** after care changes
- **Follow healthcare data handling best practices** — minimize PII exposure, encrypt at rest
