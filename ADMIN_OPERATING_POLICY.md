# FormaOS Admin Operating Policy

This policy defines how FormaOS platform administration should be operated for enterprise-grade safety.

## 1. Access Model

- Founders retain full platform authority.
- Delegated platform admins are granted access through `platform_admin_assignments`.
- Delegated access must always have:
  - named user
  - role baseline
  - explicit reason
  - active/inactive state

## 2. Roles

- `platform_viewer`: read-only diagnostics and reporting
- `platform_support`: support, org, user, and billing intervention
- `platform_security`: security monitoring and security intervention
- `platform_release_manager`: release and change coordination
- `platform_operator`: cross-domain operational ownership
- `platform_super_admin`: broad delegated authority for trusted operators

## 3. Mandatory Controls For High-Risk Actions

The following require a written reason and delegated-admin approval when not executed by a founder:

- org suspension
- org lock
- user lock
- trial reset
- control-plane kill switch or high-risk ops change
- stable release promotion
- session revoke for another user

## 4. Required Operator Behavior

- Every mutation must include a reason that explains intent and business context.
- Operators must prefer restore/recovery before destructive changes.
- Security and lifecycle controls must be reviewed in the same operational thread as billing and activation when relevant.
- High-risk changes should be executed from the admin console, not ad hoc SQL.

## 5. Daily Operating Cadence

1. Review open security alerts.
2. Review activation-at-risk organizations.
3. Review failed payments and expiring trials.
4. Review failed exports and support backlog.
5. Review pending delegated-admin approvals.

## 6. Evidence Expectations

For enterprise buyers and internal review, FormaOS should be able to prove:

- who had admin power
- who approved elevated changes
- what changed
- why it changed
- when it changed
- what customer/org was affected

## 7. Immediate Next Controls

- add org retire workflow with export and retention checks
- add bulk operator actions with dry-run and blast-radius preview
- add support case ownership and SLA tracking
- add policy report for delegated-admin coverage and stale approvals
