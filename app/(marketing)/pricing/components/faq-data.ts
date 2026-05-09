export const PRICING_FAQS = [
  {
    question: 'Which plan is right for an NDIS provider?',
    answer:
      'Most registered NDIS providers with 10–25 staff start on Growth ($797/mo). It includes 4 compliance frameworks, up to 3 sites, full workflow enforcement, pre-built NDIS Practice Standards, and worker-screening alerts — everything you need to be audit-ready for the Commission. Foundation ($297/mo) suits very small providers (sole-trader and micro-providers, single site, fewer than 10 staff) just moving off spreadsheets. Scale ($1,800/mo) is for multi-site NDIS networks running compliance across many teams.',
  },
  {
    question: 'Which plan is right for multi-site aged care or disability networks?',
    answer:
      'Scale ($1,800/mo). It includes unlimited sites, unlimited compliance frameworks, a multi-site governance dashboard, workflow automation across teams, and SLA-backed support. If you also need SSO/SAML, directory sync, executive rollup reporting, custom frameworks, or procurement and security review packs, you need Enterprise — book a call and we will tailor the contract.',
  },
  {
    question: 'Do I need to talk to sales to get started?',
    answer:
      "No. Foundation, Growth, and Scale all use self-serve checkout — sign up, verify your email, complete the guided organisation setup, and you are taken directly into Stripe Checkout. No sales call, no waiting. Enterprise is the only plan that requires a conversation, because it involves custom contracts, procurement review, security questionnaires, and invoice billing.",
  },
  {
    question: 'Can I upgrade later?',
    answer:
      'Yes — upgrades are one click from inside FormaOS and are pro-rated automatically by Stripe. Your data, evidence trail, frameworks, and audit log are preserved when you change plans. You can move from Foundation → Growth → Scale at any time. To move to Enterprise, contact us so we can scope SSO, directory sync, custom frameworks, and any procurement requirements.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'No. Foundation, Growth, and Scale require Stripe Checkout immediately on signup — you pay before you can use the platform. Enterprise evaluations include a guided product walkthrough, a security review pack, and a sandbox tenant for the procurement team, arranged through sales.',
  },
  {
    question: 'What happens if I do not complete checkout?',
    answer:
      'Your account stays in a "pending checkout" state and the app routes you back to billing. You cannot reach feature pages until your card is charged and the subscription becomes active. Your data, evidence, and audit log are preserved, so you can complete payment later and resume.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. FormaOS is hosted on Supabase (Postgres) with row-level security per organisation, encrypted at rest and in transit, with immutable audit logging. Australian customer data stays in Australian / approved regions. We can share our security review pack — covering data handling, access controls, backup, and incident response — under NDA. Enterprise customers get a guided procurement and security walkthrough.',
  },
  {
    question: 'What compliance frameworks are included?',
    answer:
      "All plans include the NDIS Practice Standards and Aged Care Quality Standards as industry-specific roadmaps. Foundation includes 2 frameworks of your choice from the library; Growth includes 4. Scale unlocks the full pre-built library — SOC 2, ISO 27001, NIST CSF, CIS Controls, HIPAA, GDPR, PCI-DSS, and Australian Financial Services compliance. Enterprise adds custom frameworks built to your contractual or sector-specific requirements.",
  },
  {
    question: 'How should we think about the price?',
    answer:
      'FormaOS is priced against the operational work it removes: audit preparation, evidence chasing, missed compliance steps, and rework after findings. For NDIS and aged care providers, a single Commission finding or accreditation gap costs more than a year of FormaOS — in remediation, fines, and disruption. Foundation at $297/mo is designed to be a clear no-brainer for any small registered provider.',
  },
  {
    question: 'How does FormaOS compare to other tools we already use?',
    answer:
      "Care management platforms like Brevity and CareMaster handle rostering, billing, and NDIS claims — they are operations tools, not compliance systems. Enterprise GRC platforms like Ideagen Policy Logic (formerly CompliSpace) cost $15,000–50,000+/year and are built for large enterprises. FormaOS sits in the gap: purpose-built compliance infrastructure for Australian NDIS, aged care, and healthcare providers, at a price that works whether you are a sole-trader or a multi-site network.",
  },
  {
    question: 'What happens during an audit or Commission review?',
    answer:
      'You can export evidence trails, workflow completion history, control status, approver context, and the full audit log directly from FormaOS. The goal is to show what happened, who approved it, when it happened, and why the evidence is trustworthy — exactly what the NDIS Commission, the Aged Care Quality and Safety Commission, and accreditation bodies require.',
  },
  {
    question: 'Do we still need internal compliance staff?',
    answer:
      "Yes. FormaOS doesn't replace accountable people. It gives them an enforced operating system so policies, reviews, incidents, credentials, and evidence are executed consistently — instead of being remembered manually. Our customers find their compliance team spends less time chasing and more time on the work that actually reduces risk.",
  },
] as const;
