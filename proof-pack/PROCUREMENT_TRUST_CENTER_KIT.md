# Procurement Proof (Trust Packet) | Trust Center Content Kit

This kit is written to be copied into a Trust Center, security packet, or procurement response doc. It is designed to be **accurate**, **non-inflated**, and **procurement-friendly**.

---

## 1) Security Posture Overview (Buyer Copy)

### Summary

FormaOS is designed for regulated organizations where **audit defensibility** and **data isolation** matter. The platform is built on a modern SaaS security baseline:

- Encryption in transit (TLS) and at rest (managed database/storage encryption)
- Strong access control model (role-based permissions)
- Organization data isolation (row-level security patterns)
- Immutable audit logging patterns for governance events
- Rate limiting and abuse controls
- Security monitoring and incident response practices

### Security Principles

- **Least privilege:** users only see data and actions required for their role.
- **Defense in depth:** application checks are combined with database isolation policies.
- **Auditability by default:** governance events are recorded with durable timestamps for defensible review.

---

## 2) Data Handling Summary (Buyer Copy)

### Data Categories Processed

Depending on customer configuration, the platform may process:
- Organization metadata (users, roles, sites/entities)
- Compliance artifacts (policies, evidence documents, registers)
- Operational governance events (tasks, incident follow-ups, approvals)
- Industry-specific operational records (where applicable)

### Data Residency (Template)

**Primary data region:** [ENTER REGION]  
**Backups/replication:** [ENTER APPROACH]  

If your organization requires a specific data residency posture, request the data residency statement and subprocessor list.

---

## 3) Subprocessors List (Template)

Maintain as a table with the fields procurement teams actually request.

| Subprocessor | Purpose | Data categories | Region(s) | Security artifacts | DPA |
|---|---|---|---|---|---|
| [Name] | [Hosting/Auth/Email/Billing/Analytics] | [PII, audit logs, documents] | [AU/US/EU] | [SOC 2/ISO statement or link] | [Link / on request] |

**Operational practice:** notify customers of material subprocessor changes with advance notice where practical.

---

## 4) Incident Response Template (Customer-Facing)

### Incident Handling Commitments (Template)

- **Detection & triage:** incidents are triaged and severity-scored upon identification.
- **Customer notification:** for confirmed security incidents impacting customer data, FormaOS will notify affected customers **without undue delay**, with an initial notice including:
  - incident summary
  - affected systems (known at the time)
  - containment actions taken
  - next update timeframe
- **Post-incident report:** for material incidents, FormaOS will provide a written post-incident summary including root cause and corrective actions.

> Note: Notification timeframes may be contractually agreed for enterprise plans.

---

## 5) Uptime / SLA Template (Customer-Facing)

### Uptime Statement (Template)

- **Service target:** 99.9% monthly uptime target.
- **Maintenance:** scheduled maintenance windows will be communicated in advance where practical.
- **SLA:** SLA-backed uptime and service credits may be provided under an enterprise agreement.

---

## 6) Access Controls & RBAC (Procurement Explanation)

FormaOS uses a role-based access model designed for regulated governance:

- **Role-based access control:** permissions restrict sensitive actions (exports, approvals, org administration).
- **Separation of duties (governance intent):** workflows can require review/approval steps for artifacts before they are treated as “audit-ready”.
- **Org isolation:** users only access data within their organization context.

**Enterprise identity:** if a customer requires SSO/SAML or SCIM, define requirements during procurement. If not yet available, provide a roadmap commitment or contractual workaround (e.g., enforced MFA + strong joiner/mover/leaver process).

---

## 7) Audit Logging (Procurement Explanation)

Auditability is central for regulated buyers:

- Governance actions are recorded in an audit trail (who did what, when).
- Audit records are designed to support defensible review during audits, investigations, and regulator scrutiny.
- Customers can export activity history for internal review and external auditor evidence.

---

## 8) DPA Outline Template (High-Level)

This is an outline you can use as the structure for a formal DPA.

1. **Parties + roles:** controller/processor definitions
2. **Scope:** processing activities, duration, nature, purpose
3. **Data categories:** personal data types, special categories (if applicable)
4. **Security measures:** technical and organizational measures
5. **Subprocessors:** approvals, notices, flow-down obligations
6. **Data subject rights support:** assistance process
7. **Breach notification:** timing, contents, cooperation
8. **International transfers:** mechanisms (if applicable)
9. **Deletion/return:** data return and deletion on termination
10. **Audit rights:** reasonable audit terms
11. **Liability:** contractual caps and exclusions

---

## 9) “SOC 2 / ISO: Aligned vs Certified” (Safe Wording)

Use this wording to prevent procurement misunderstanding.

### A) SOC 2 (Aligned)

“FormaOS supports SOC 2 **control mapping and evidence workflows** to help customers operate a SOC 2-aligned program. FormaOS is **not currently SOC 2 Type II certified** as a vendor unless explicitly stated in the contract or provided as an attestation.”

### B) ISO 27001 (Aligned)

“FormaOS supports ISO/IEC 27001-aligned governance through **control mapping, evidence capture, and reporting**. FormaOS is **not currently ISO 27001 certified** as an organization unless explicitly stated in the contract or provided as a certification.”

### C) Infrastructure Provider Reports

“FormaOS uses established infrastructure providers that may provide their own SOC 2 / ISO reports. Those reports cover the infrastructure provider’s controls, not a blanket certification of FormaOS as a vendor.”

---

## 10) “Trust Packet” Shareable Bundle (Recommended Contents)

This is the minimum set procurement teams expect to accelerate review:

- Security overview (this doc section 1)
- Data handling summary (section 2)
- Subprocessors list (section 3)
- Access controls summary (section 6)
- Audit logging summary (section 7)
- DPA (or DPA outline + request process) (section 8)
- Clear “aligned vs certified” wording (section 9)

