# Security Policy

FormaOS handles compliance, audit, and personal data on behalf of regulated organisations. We take security defects seriously and welcome coordinated disclosure from researchers and customers.

## Supported Versions

FormaOS is a continuously deployed SaaS product; there is no concept of a "supported version" of the hosted service — only the currently deployed release at `app.formaos.com.au` is in scope. The `main` branch of this repository is the active codebase.

| Branch | Supported            |
| ------ | -------------------- |
| `main` | Yes — active release |
| Other branches and tags | No — research only |

Self-hosted distributions of FormaOS are not offered at this time.

## Reporting a Vulnerability

Please report suspected vulnerabilities by email to **security@formaos.com.au**.

Include:

- A clear description of the issue and its impact.
- Steps to reproduce, including any required test accounts or payloads.
- Whether the issue is currently being exploited in the wild, to your knowledge.
- Your name and how you would like to be credited (or "anonymous").

For sensitive reports you may request our PGP key in the first email; we will reply with a current key.

We will acknowledge receipt within **2 business days** and provide a substantive response (triage outcome, expected timeline) within **7 business days**.

## Out of Scope

- Reports generated entirely by automated scanners with no demonstration of impact.
- Issues in third-party services we depend on (Supabase, Stripe, Vercel, Resend) — please report those directly to the vendor.
- Self-XSS or social-engineering attacks against FormaOS staff.
- Missing security headers on marketing pages where no sensitive content is rendered.
- Rate-limiting bypass on unauthenticated public endpoints unless it enables material harm.

## Disclosure Policy

We follow coordinated disclosure with a **90-day default embargo** from the date of acknowledgement.

- Embargo may be shortened by mutual agreement, or unilaterally by us if we observe active exploitation in the wild.
- Embargo may be extended by mutual agreement if a fix requires customer-side action (for example, IdP reconfiguration).
- We will publish a CVE-style advisory once a fix has shipped and customers have had a reasonable opportunity to apply any required actions.
- We do not currently offer a paid bug bounty. We do credit reporters publicly in the Acknowledgements section below (with consent).

## Safe Harbour

We will not pursue legal action against researchers who:

- Make a good-faith effort to comply with this policy.
- Avoid privacy violations, destruction of data, and degradation of service.
- Do not access more data than necessary to demonstrate the issue, and delete any data accessed once the report is filed.
- Give us reasonable time to remediate before public disclosure.

## Acknowledgements

We thank the following researchers for responsible disclosure.

_(No disclosures to date.)_
