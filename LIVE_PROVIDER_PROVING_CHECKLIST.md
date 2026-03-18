# Live Provider Proving Checklist

Date created: 2026-03-15
Purpose: close the remaining manual verification gap for enterprise surfaces that are implemented in code but not yet proven against real external providers.

## Scope

This checklist covers the live-provider proving still called out in the V2 master prompt audit:

- SCIM provisioning
- SAML SSO
- Directory sync
- Webhook delivery
- Slack notifications
- Teams notifications

## Exit Criteria

Each area is only considered proven when all of the following are captured:

- Real provider or sandbox account used
- Environment and org used are recorded
- Request/response evidence captured
- FormaOS-side audit trail or persisted state verified
- Failure path tested, not just the happy path
- Result recorded as pass, fail, or blocked

## 1. SCIM Proving

- Create a real SCIM bearer token for a non-production org
- Connect a real IdP or SCIM-capable sandbox to FormaOS
- Create a user through SCIM and verify:
  - user exists in auth/users
  - org membership is created
  - mapped role is correct
  - SCIM audit entry exists
- Update the user through SCIM and verify:
  - name/email/role updates apply correctly
  - immutable or protected fields reject invalid writes
- Deactivate or delete the user through SCIM and verify:
  - expected disable/delete behavior matches policy
  - audit entry exists
- Create and update a SCIM group and verify:
  - group persists
  - membership sync is correct
  - role mapping works
- Run one negative test:
  - invalid token
  - expired token
  - unsupported filter or malformed PATCH

## 2. SAML SSO Proving

- Configure a real SAML app in an IdP sandbox
- Load FormaOS metadata from the live metadata endpoint
- Run SP-initiated login and verify:
  - assertion accepted
  - user lands in the correct org
  - JIT provisioning works for first login
- Run IdP-initiated login if supported by the provider
- Verify repeat login updates:
  - display name
  - email normalization
  - group-to-role mapping
- Verify one failure path:
  - invalid signature
  - wrong audience
  - expired assertion
- Confirm audit trail captures login/provisioning events

## 3. Directory Sync Proving

- Connect one supported provider:
  - Azure AD / Microsoft Graph
  - Okta
  - Google Workspace
- Run an initial sync and verify:
  - users imported
  - expected roles or group mappings applied
  - sync status and timestamps persist
- Modify source directory data and run a second sync
- Verify drift handling:
  - disabled user
  - renamed user
  - role/group membership change
- Capture one failure path:
  - revoked token
  - rate limit
  - partial provider outage

## 4. Webhook Delivery Proving

- Create a real webhook endpoint using a controllable sink
- Register a webhook in FormaOS
- Trigger at least one real event for each class:
  - member change
  - workflow event
  - notification or compliance event
- Verify:
  - payload shape
  - signature or auth headers
  - retry behavior on failure
  - delivery history persistence
- Force a failure response from the sink and confirm:
  - retries are queued
  - final status is persisted
  - dead-letter or failure state is visible

## 5. Slack Notification Proving

- Configure a real Slack app or webhook for a sandbox workspace
- Send at least one notification from FormaOS
- Verify:
  - channel routing is correct
  - formatting is readable
  - links point to the correct FormaOS route
- Trigger one high-priority and one routine event
- Disable the Slack channel and confirm fallback behavior

## 6. Teams Notification Proving

- Configure a real Teams incoming webhook or supported connector
- Send at least one notification from FormaOS
- Verify:
  - card formatting renders correctly
  - deep links work
  - event routing matches preferences
- Test one failure path:
  - invalid webhook
  - revoked webhook

## 7. Evidence To Capture

- Provider name and tenant/workspace used
- FormaOS org id used
- Timestamp of run
- Screenshots or webhook request captures
- Relevant audit rows or delivery records
- Outcome and follow-up action if failed

## 8. Sign-Off

- Engineering verification owner:
- Product owner:
- Date:
- Notes:
