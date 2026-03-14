# Integration Test Pack

This directory exists to close the remaining Prompt 1 structure gap from the V2 master prompt audit.

## Purpose

The repo already had meaningful integration-style coverage, but it was scattered across `tests/api`, `tests/admin`, `tests/provisioning`, and `tests/billing`. The V2 audit called out that the prompt explicitly asked for a recognizable integration pack under `tests/integration/`.

This folder is now the canonical entry point for that layer.

## Current Coverage

- `api/onboarding-checklist.integration.test.ts`
  - request-facing onboarding checklist data flow
- `admin/control-plane-access.integration.test.ts`
  - admin API permission and CSRF behavior
- `auth/workspace-recovery.integration.test.ts`
  - workspace recovery and onboarding-state inference
- `billing/invariants.integration.test.ts`
  - subscription and entitlement guardrails

## How To Extend It

When adding new integration coverage for Prompt 1 or adjacent enterprise surfaces, prefer this directory for:

- auth and provisioning flows
- billing and entitlement flows
- compliance workflow orchestration
- admin APIs
- v1 APIs

Keep low-level pure logic in `__tests__/lib/`. Put multi-module behavior here.
