import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Compare: Secureframe',
  description:
    'FormaOS vs Secureframe: compliance program setup plus operational execution with evidence verification and audit-ready governance.',
  alternates: {
    canonical: `${siteUrl}/compare/secureframe`,
  },
  openGraph: {
    title: 'FormaOS | Compare: Secureframe',
    description:
      'FormaOS vs Secureframe: compliance program setup plus operational execution with evidence verification and audit-ready governance.',
    type: 'website',
    url: `${siteUrl}/compare/secureframe`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs Secureframe — Compare Compliance Platforms',
    description:
      'FormaOS vs Secureframe: compliance program setup plus operational execution with evidence verification and audit-ready governance.',
  },
};

const points = [
  {
    title: 'Compliance as an operating model',
    detail:
      'FormaOS connects governance structure to the work that proves compliance: policies, tasks, evidence, and audit history in one chain — not just a program setup and monitoring tool.',
  },
  {
    title: 'Verification layer for evidence',
    detail:
      'FormaOS emphasizes verification status, segregation, and immutable audit history so evidence is defensible under regulator scrutiny — not just stored and organized.',
  },
  {
    title: 'Execution visibility for leadership',
    detail:
      'FormaOS communicates readiness as operational truth: named owners, live deadlines, control gaps, and posture snapshots — real-time and always current for board and executive reporting.',
  },
  {
    title: 'Non-security regulated industries',
    detail:
      'FormaOS covers operational compliance for healthcare, NDIS, aged care, and financial services — not limited to security frameworks like SOC 2 and ISO 27001.',
  },
  {
    title: 'Workflow enforcement, not just documentation',
    detail:
      'Controls in FormaOS block non-compliant work from proceeding. Accountability is structural, not cultural — the system enforces it, not a spreadsheet or a reminder email.',
  },
  {
    title: 'Audit-ready posture — always',
    detail:
      'FormaOS maintains continuous compliance posture with real-time control drift alerts. No more "sprint to audit" — evidence is generated as teams operate, every day.',
  },
] as const;

const idealIf = [
  'Your audits depend on operations — not only security policy and technical controls',
  'You need verified evidence and approval history — not just evidence storage and collection',
  'You want a single control execution view across teams with named ownership at every level',
  'Your organization needs healthcare, NDIS, or operational compliance beyond security frameworks',
  'Continuous posture matters — not just periodic compliance snapshots assembled before audits',
  'Enterprise procurement needs DPA, SAML SSO, and data residency documentation upfront',
] as const;

const procurementChecks = [
  {
    title: 'Operational compliance proof',
    detail:
      'Export compliance posture snapshots, control coverage reports, and framework alignment summaries without spreadsheet reconstruction — on demand.',
  },
  {
    title: 'Vendor assurance and DPA',
    detail:
      'Data processing agreement, vendor assurance questionnaire, and SLA documentation ready for legal, risk, and procurement sign-off — no delays.',
  },
  {
    title: 'Framework coverage documentation',
    detail:
      'Multi-framework coverage (ISO 27001, SOC 2, HIPAA, GDPR, NDIS Practice Standards) mapped and evidenced — ready for your next compliance or procurement review.',
  },
] as const;

export default function CompareSecureframePage() {
  return (
    <ComparePageTemplate
      competitor="Secureframe"
      heroDescription="Secureframe helps teams organize and automate compliance programs. FormaOS is built to operationalize compliance as a governed execution system — with workflow enforcement, continuous posture, named accountability, and audit-ready evidence for every regulated sector."
      points={points}
      idealIf={idealIf}
      procurementChecks={procurementChecks}
      source="compare_secureframe"
    />
  );
}
