# FormaOS Release Discipline Checklist

## Before Shipping

1. Confirm the change category using `ENGINEERING_CHANGE_MATRIX.md`.
2. Run `npx tsc -p tsconfig.json --noEmit`.
3. Run the domain-specific checks for the surface changed.
4. Confirm migration assumptions and route assumptions still match.
5. Review user-facing copy for unsupported enterprise claims.

## If The Change Touches Admin Or Control Plane

1. Verify privileged routes still enforce permission, CSRF, reason, and audit.
2. Verify delegated-admin approval semantics for high-risk actions.
3. Verify admin nav still points at valid routes.

## If The Change Touches Billing Or Trials

1. Verify blocked, pending, trialing, active, and past_due behavior.
2. Verify restore logic for org lifecycle and access controls.
3. Verify entitlements remain aligned to the selected plan.

## If The Change Touches Enterprise Trust Surfaces

1. Re-read the affected copy as if you are a security reviewer.
2. Remove claims that are roadmap-only.
3. Make sure the trust packet, procurement pages, and security review flow still align.

## Release Owner Sign-Off

- What changed:
- What validation ran:
- What was intentionally not validated:
- What rollback path exists:
- Any migration dependencies:
