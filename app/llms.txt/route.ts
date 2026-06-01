import { brand } from '@/config/brand';

// llms.txt — concise site overview for AI crawlers (ChatGPT, Claude,
// Perplexity, Gemini). Spec: https://llmstxt.org/
//
// Serves a markdown document at /llms.txt. The full content export
// lives at /llms-full.txt for crawlers that want it without parsing
// individual pages.

const SITE = brand.seo.siteUrl.replace(/\/$/, '');

const BODY = `# FormaOS

> A compliance operating system for Australian regulated industries — NDIS providers, mental health services, aged care, healthcare, financial services, childcare, and construction. FormaOS turns regulatory obligations into enforced workflows with named owners, immutable evidence chains, and audit-ready posture every day.

FormaOS is built in Australia, hosted in Australia (Sydney region), and aligned with the regulators Australian operators actually answer to: NDIS Commission, AHPRA, ACECQA, ASIC, AUSTRAC, APRA, SafeWork, and the NSQHS Standards. Framework packs ship for ISO 27001, SOC 2 (in progress), GDPR, HIPAA, PCI DSS, NIST CSF, and CIS. SOC 2 attestation is currently in progress.

The full content export — every marketing and trust page concatenated as a single markdown document — is available at ${SITE}/llms-full.txt.

## Product

- [How FormaOS works](${SITE}/product): the compliance operating system platform — tasks, owners, evidence chains, audit posture.
- [Features](${SITE}/features): 25 features across framework packs, evidence verification, workflow automation, risk heatmaps, cross-mapping, integrations.
- [Framework coverage](${SITE}/frameworks): how obligations map into controls, evidence inheritance across frameworks, and the included packs.
- [Integrations](${SITE}/integrations): Jira, Slack, Microsoft Teams, GitHub, Zapier, AWS, Azure.
- [Pricing](${SITE}/pricing): Foundation, Growth, Scale, and Enterprise plans.
- [Compare FormaOS vs alternatives](${SITE}/compare): how FormaOS compares to CompliSpace, Riskware, 6clicks, HealthMetrics.

## Industries

- [NDIS providers](${SITE}/ndis-providers): all 8 Practice Standards modules, SIRS notifications, worker screening, unannounced audit prep.
- [Mental health services](${SITE}/mental-health-compliance): National Standards for Mental Health Services (NSMHS), restrictive-practice governance, reportable incidents, consumer rights, worker screening.
- [Healthcare](${SITE}/healthcare-compliance): AHPRA registrations, NSQHS Standards accreditation, CPD hours, adverse events.
- [Financial services](${SITE}/financial-services-compliance): ASIC, APRA, AUSTRAC alignment for AFS licensees and credit licensees.
- [Childcare](${SITE}/childcare-compliance): NQF, ACECQA, child safety obligations.
- [Construction](${SITE}/construction-compliance): SafeWork, SWMS, inductions, incidents.
- [Industries overview](${SITE}/industries): one OS, multiple regulatory frameworks.

## Trust and security

- [Trust Center](${SITE}/trust): transparent assurance documentation for procurement and security review.
- [Data handling](${SITE}/trust/data-handling): storage, encryption, retention, and deletion of customer data.
- [Data Processing Agreement (DPA)](${SITE}/trust/dpa): GDPR Article 28 and Australian Privacy Act-aligned terms.
- [Sub-processors](${SITE}/trust/subprocessors): third-party providers that process customer data.
- [Incident response](${SITE}/trust/incident-response): detection, containment, and disclosure.
- [Vendor assurance](${SITE}/trust/vendor-assurance): independent assessment plan and assurance artifacts.
- [Procurement FAQ](${SITE}/trust/procurement): architecture, hosting, identity, encryption, and audit posture for buyers.
- [Vendor trust packet](${SITE}/trust/packet): bundled review materials covering architecture and assurance.
- [Security & data protection](${SITE}/security): AU-hosted, SOC 2 in progress, row-level security, SAML SSO, MFA.
- [Security Review Packet](${SITE}/security-review): procurement-ready security review walkthrough.

## Company

- [About FormaOS](${SITE}/about): mission for regulated industries.
- [Our story](${SITE}/our-story): why FormaOS exists.
- [Enterprise](${SITE}/enterprise): SAML SSO, AU deployment, dedicated security review.
- [Customer stories](${SITE}/customer-stories): how regulated operators use FormaOS.
- [Changelog](${SITE}/changelog): product updates.
- [FAQ](${SITE}/faq): common questions about security, audit trails, immutable evidence, ISO/SOC support.

## Blog and resources

- [Blog](${SITE}/blog): expert insights on compliance management and regulatory technology.
- [What is a Compliance Operating System?](${SITE}/what-is-a-compliance-operating-system)
- [ISO compliance software](${SITE}/iso-compliance-software)
- [SOC 2 compliance automation](${SITE}/soc2-compliance-automation)
- [Audit evidence management](${SITE}/audit-evidence-management)
- [Documentation](${SITE}/documentation): platform documentation and knowledge base.

## Legal

- [Terms of service](${SITE}/legal/terms)
- [Privacy policy](${SITE}/legal/privacy)
- [Legal index](${SITE}/legal)

## Contact

- [Talk to sales / book demo / start compliance plan](${SITE}/contact)
- Sitemap: ${SITE}/sitemap.xml
- RSS: ${SITE}/blog/rss.xml
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

export const dynamic = 'force-static';
