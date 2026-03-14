export const PRICING_FAQS = [
  {
    question: 'Can we run a security review before purchase?',
    answer:
      'Yes. Request the FormaOS security review packet - it includes our security posture summary, penetration test overview, vulnerability disclosure policy, and vendor assurance documentation. Guided walkthroughs for procurement and security teams are available on Enterprise engagements.',
  },
  {
    question: 'Do you support enterprise identity and access requirements?',
    answer:
      'Google OAuth and MFA enforcement are available on all plans. Enterprise plans include SAML 2.0 SSO with support for Okta, Azure AD, and Google Workspace. Session policy management, IP restrictions, and SCIM provisioning are available on Enterprise plans.',
  },
  {
    question: 'Where is data stored, and can we select our region?',
    answer:
      'FormaOS stores data on infrastructure based in Australia by default. US and EU data residency options are on our roadmap for Enterprise plans. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). A full Data Processing Agreement (DPA) is available on request.',
  },
  {
    question: 'What are your uptime and SLA commitments?',
    answer:
      'FormaOS targets 99.9% monthly uptime for production services. Enterprise plans include a formal SLA with defined incident response, escalation paths, and remediation credits. Our status page provides real-time availability and incident history.',
  },
  {
    question: 'How does procurement and billing work?',
    answer:
      'Starter and Professional plans are self-serve with monthly card billing. Enterprise can also be activated with self-serve monthly checkout, while invoice-based procurement, multi-year agreements, and purchase-order workflows remain available for larger deployments. All plans include the security and vendor assurance documentation required for enterprise procurement.',
  },
  {
    question: 'Can we pilot one team first and expand later?',
    answer:
      'Yes. Most enterprise teams start with a single operating unit, validate workflow fit during the trial, then expand to additional entities or sites. Your data, configurations, and audit history carry forward when you scale.',
  },
  {
    question: 'What happens to our data if we leave?',
    answer:
      'Your compliance data belongs to you. On exit, we provide a full data export (evidence, audit trails, control mappings) in portable formats (CSV, ZIP, PDF). Data is purged from our systems within 30 days of account termination, per our retention policy.',
  },
  {
    question: 'Do you provide onboarding and implementation support?',
    answer:
      'All plans include access to onboarding documentation and setup guides. Professional plans include priority support. Enterprise engagements include a dedicated implementation engineer, framework configuration, control mapping review, and staff enablement sessions.',
  },
] as const;
