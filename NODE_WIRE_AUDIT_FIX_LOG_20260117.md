# Node & Wire Audit Fix Log (2026-01-17)

## Fixes Applied

1) Role-based guard activation
- File: `middleware.ts`
- Change: fixed `!isFounder` to `!isUserFounder` so staff/trial gating executes.
- Impacted wires: `/app/*` role restrictions + subscription/trial gating.

2) Accept-invite route alignment
- Files: `app/(dashboard)/accept-invite/[token]/page.tsx`
- Change: moved route to dynamic segment and corrected params type.
- Impacted wires: invitation email `/accept-invite/:token` now resolves.

3) Add auth signout endpoint
- File: `app/auth/signout/route.ts`
- Change: added GET/POST signout and redirect to `/auth/signin`.
- Impacted wires: accept-invite error/mismatch signout links now resolve.

4) Command palette route fixes
- File: `components/command-palette.tsx`
- Change: `/app/forms` -> `/app/workflows`, `/app/analytics` -> `/app/reports`, updated labels.
- Impacted wires: command palette navigation entries.

5) Docs article anchors
- File: `app/(marketing)/docs/DocsPageContent.tsx`
- Change: `href="#"` -> `href="#${section.id}"`.
- Impacted wires: docs article cards no longer dead-end.
