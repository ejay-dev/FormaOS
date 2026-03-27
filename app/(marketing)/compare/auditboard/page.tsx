import type { Metadata } from 'next';
import { ComparePageTemplate } from '../components/ComparePageTemplate';
import {
  articleSchema,
  breadcrumbSchema,
  jsonLdScript,
  organizationSchema,
  siteUrl,
  softwareApplicationSchema,
} from '@/lib/seo';

export const metadata: Metadata = {
  title: 'FormaOS | Compare: AuditBoard',
  description:
    'FormaOS vs AuditBoard: accountable compliance execution with workflow ownership, evidence verification, and enterprise-ready export paths.',
  alternates: {
    canonical: `${siteUrl}/compare/auditboard`,
  },
  openGraph: {
    title: 'FormaOS | Compare: AuditBoard',
    description:
      'FormaOS vs AuditBoard: accountable compliance execution with workflow ownership, evidence verification, and enterprise-ready export paths.',
    type: 'website',
    url: `${siteUrl}/compare/auditboard`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS vs AuditBoard - Compare Compliance Platforms',
    description:
      'Compare AuditBoard and FormaOS across audit defensibility, operational accountability, and procurement readiness.',
  },
};

const points = [
  {
    title: 'Execution stays connected to controls',
    detail:
      'FormaOS turns controls into owned work with evidence checkpoints, rather than treating compliance as a separate audit-management surface.',
  },
  {
    title: 'Better fit for regulated operating teams',
    detail:
      'AuditBoard is strong for internal audit and risk organizations. FormaOS is built for operators who need frontline execution, reviewer sign-off, and evidence integrity in one system.',
  },
  {
    title: 'Proof survives procurement pressure',
    detail:
      'Security review, export packages, and buyer-facing trust flows are designed into the product path instead of relying on manual audit preparation.',
  },
  {
    title: 'Continuous posture, not periodic collection',
    detail:
      'Named ownership, overdue actions, and control drift are visible continuously so readiness does not depend on a quarterly reconstruction exercise.',
  },
] as const;

const idealIf = [
  'You need operational teams, compliance leads, and executives working from one control execution system',
  'Your evidence must show who approved what, when, and against which workflow step',
  'You want audit exports and buyer trust artifacts without a separate manual assembly process',
  'Your environment spans regulated service delivery, not just internal audit planning',
] as const;

const featureComparison = [
  { feature: 'Control execution with named owners', formaos: 'yes', competitor: 'partial' },
  { feature: 'Evidence verification with approval chain', formaos: 'yes', competitor: 'partial' },
  { feature: 'Operational task workflows', formaos: 'yes', competitor: 'partial' },
  { feature: 'Buyer-facing trust and procurement path', formaos: 'yes', competitor: 'partial' },
  { feature: 'Internal audit planning depth', formaos: 'partial', competitor: 'yes' },
  { feature: 'Regulated operator workflow coverage', formaos: 'yes', competitor: 'partial' },
  { feature: 'Incident and corrective-action chain', formaos: 'yes', competitor: 'partial' },
  { feature: 'Audit-ready export bundles', formaos: 'yes', competitor: 'yes' },
];

const competitorStrengths = [
  'You are primarily an internal-audit-led organization standardizing audit programs, issues management, and board reporting',
  'Your team needs deeper audit committee workflows and enterprise risk-management packaging than day-to-day frontline execution',
  'You already have operations systems in place and want a dedicated audit platform on top',
] as const;

const procurementChecks = [
  {
    title: 'Execution proof',
    detail:
      'Check whether the system proves real control performance, not only audit planning or evidence inventory.',
  },
  {
    title: 'Ownership trail',
    detail:
      'Validate that every control, exception, and remediation item resolves to a named owner with review history.',
  },
  {
    title: 'Buyer readiness',
    detail:
      'Confirm the platform can satisfy security review, procurement, and export requests without creating parallel workstreams.',
  },
] as const;

export default function CompareAuditBoardPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Compare', path: '/compare' },
              { name: 'AuditBoard', path: '/compare/auditboard' },
            ]),
            articleSchema({
              title: 'FormaOS vs AuditBoard',
              description:
                'Compare AuditBoard and FormaOS across audit defensibility, operational accountability, and procurement readiness.',
              url: `${siteUrl}/compare/auditboard`,
              datePublished: '2026-03-14',
              author: 'FormaOS Team',
            }),
            organizationSchema(),
            softwareApplicationSchema(),
          ]),
        }}
      />
      <ComparePageTemplate
        competitor="AuditBoard"
        heroDescription="AuditBoard is strong for internal audit and risk programs. FormaOS is built to run compliance as an operating system where control execution, evidence, ownership, and procurement proof stay connected."
        points={points}
        idealIf={idealIf}
        procurementChecks={procurementChecks}
        featureComparison={featureComparison}
        competitorStrengths={competitorStrengths}
        source="compare_auditboard"
        datePublished="2026-03-14"
      />
    </>
  );
}
