export const PRICING_FAQS = [
  {
    question: 'Can we run a security review before purchase?',
    answer:
      'Yes. Request the FormaOS security review packet - it includes our security posture summary, penetration test overview, vulnerability disclosure policy, and vendor assurance documentation. Guided walkthroughs for procurement and security teams are available on Enterprise engagements.',
  },
  {
    question: 'Do you support enterprise identity and access requirements?',
    answer:
      'Google OAuth and MFA controls are available on current plans. Enterprise deployments can use SAML SSO with major identity providers, and additional identity-lifecycle requirements are reviewed during procurement so public pricing copy stays aligned with implemented controls.',
  },
  {
    question: 'Where is data stored, and can we select our region?',
    answer:
      'FormaOS stores data on infrastructure based in Australia by default. Additional residency and transfer requirements are reviewed during enterprise procurement. Data is encrypted at rest (AES-256) and in transit (TLS 1.3), and a Data Processing Agreement (DPA) is available on request.',
  },
  {
    question: 'What are your uptime and SLA commitments?',
    answer:
      'FormaOS publishes platform availability and incident history on the status page. Enterprise agreements can define service commitments, escalation expectations, and maintenance communication during contract review.',
  },
  {
    question: 'How does procurement and billing work?',
    answer:
      'Starter and Professional are self-serve monthly plans. Enterprise buyers can run a guided security review, procurement workflow, and invoiced rollout where required. Buyer-facing materials such as the security review packet, DPA summary, and trust resources are available early in the process.',
  },
  {
    question: 'Can we pilot one team first and expand later?',
    answer:
      'Yes. Most enterprise teams start with a single operating unit, validate workflow fit during the trial, then expand to additional entities or sites. Your data, configurations, and audit history carry forward when you scale.',
  },
  {
    question: 'What happens to our data if we leave?',
    answer:
      'Your compliance data belongs to you. On exit, we can provide data exports covering evidence, audit history, and control mappings in portable formats. Final retention and deletion handling follows the applicable agreement and documented policy.',
  },
  {
    question: 'Do you provide onboarding and implementation support?',
    answer:
      'All plans include access to onboarding documentation and setup guides. Professional plans include priority support. Enterprise engagements include a dedicated implementation engineer, framework configuration, control mapping review, and staff enablement sessions.',
  },
] as const;
