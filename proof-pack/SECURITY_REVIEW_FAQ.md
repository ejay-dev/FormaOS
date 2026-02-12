# Security Review FAQ (Enterprise Procurement) | 25 Qs

This FAQ is written to reduce procurement back-and-forth and prevent over-claims.

---

## Identity & Access

1. **Do you support SSO (SAML) and SCIM?**  
SAML/SCIM availability depends on the current product tier and roadmap. If SSO is required for procurement approval, define requirements during evaluation and we will confirm availability and timelines in writing.

2. **Do you support MFA?**  
Yes, MFA is supported for user authentication. Enterprise customers may require MFA for privileged roles as part of policy.

3. **What role-based access controls exist?**  
Access is governed by roles and permissions designed around least privilege. Sensitive actions (exports, approvals, org-level settings) are restricted to privileged roles.

4. **Can customers enforce least privilege?**  
Yes. Customers can assign roles based on job function and restrict sensitive actions to a smaller set of authorized users.

5. **How are admin/founder-level permissions controlled?**  
Founder/admin access is restricted and should be governed by internal controls. Enterprise agreements can include additional requirements for privileged access governance.

---

## Data Security

6. **Is data encrypted in transit?**  
Yes. Industry-standard TLS is used for data in transit.

7. **Is data encrypted at rest?**  
Yes. Data at rest encryption is provided through managed infrastructure (database/storage encryption).

8. **Is end-to-end encryption (E2E) supported?**  
No special “application-level E2E encryption” should be assumed unless explicitly stated and validated. Encryption at rest/in transit is provided via the infrastructure baseline.

9. **How is customer data isolated?**  
Customer data is logically isolated by organization boundaries, with database-level access control patterns designed to prevent cross-tenant access.

10. **Do you support data residency requirements?**  
Data residency depends on infrastructure configuration and plan. If you require AU-only residency, specify this requirement during procurement and we will provide a written data residency statement.

---

## Auditability & Compliance

11. **Do you maintain audit logs?**  
Yes. Governance actions are recorded in audit logs to support defensible review and external audits.

12. **Are audit logs immutable?**  
The audit logging approach is designed to support immutability expectations for regulated environments. If formal immutability assurances are required, confirm via the security packet and contract terms.

13. **Are you SOC 2 Type II certified?**  
Do not assume vendor SOC 2 certification unless a SOC 2 report is provided. FormaOS can operate SOC 2-aligned workflows, and infrastructure providers may have their own reports.

14. **Are you ISO 27001 certified?**  
Do not assume vendor ISO certification unless a certificate is provided. FormaOS supports ISO-aligned governance and evidence workflows.

15. **Do you support HIPAA/GDPR/NDIS/aged care workflows?**  
FormaOS supports aligned governance workflows and evidence structures. Regulatory obligations remain customer-specific; confirm your required controls and reporting outputs during evaluation.

---

## Incident Response & Availability

16. **Do you have an incident response process?**  
Yes. Incidents are triaged, severity-scored, contained, and followed by corrective actions. Material incidents can include a written post-incident summary.

17. **What is your customer notification commitment?**  
For confirmed incidents impacting customer data, customers will be notified without undue delay. Enterprise contracts can specify timing and communication requirements.

18. **What is your uptime target / SLA?**  
A standard uptime target may be stated for the service, and enterprise plans can include SLA-backed commitments with service credits.

19. **Do you have a status page?**  
If a status page is required for procurement, request the status link and incident history process as part of evaluation.

---

## Application Security

20. **How do you protect against brute force and abuse?**  
Rate limiting and abuse controls are used to reduce brute-force and automated abuse risk.

21. **Do you run vulnerability scanning and dependency monitoring?**  
Yes. Standard practices include dependency monitoring and security scanning in CI/CD. Enterprise buyers can request a summary of the security program.

22. **Do you perform penetration tests?**  
Pen testing scope and frequency depend on plan and maturity stage. If pen test evidence is required, request the latest summary (or commit to a timeline in the contract).

23. **How do you handle security patches?**  
Security patches are prioritized and deployed through a controlled CI/CD process. For critical vulnerabilities, expedited patch timelines can be defined.

---

## Privacy & Legal

24. **Do you provide a DPA?**  
Yes. A standard DPA can be provided, and enterprise customers can request a countersigned copy.

25. **How do you handle data deletion on termination?**  
Data retention and deletion terms are defined contractually. If deletion certificates are required, include this requirement in procurement and we will confirm the process.

