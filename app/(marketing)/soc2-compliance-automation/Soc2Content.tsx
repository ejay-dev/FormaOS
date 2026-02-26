'use client';

import { ShieldCheck } from 'lucide-react';
import { SeoLandingTemplate } from '../components/shared/SeoLandingTemplate';

export default function Soc2Content() {
  return (
    <SeoLandingTemplate
      badge="SOC 2 Compliance"
      badgeIcon={<ShieldCheck className="h-4 w-4" />}
      headline={
        <>
          SOC 2 Compliance Automation{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Built for Type II
          </span>
        </>
      }
      subheadline="SOC 2 Type II demands continuous evidence of control effectiveness. FormaOS maps Trust Service Criteria to operational workflows that capture evidence as work happens — not before audits."
      introParagraphs={[
        'SOC 2 has become table stakes for B2B SaaS companies, cloud service providers, and any organization handling customer data. Prospects and enterprise customers increasingly require SOC 2 Type II reports before signing contracts.',
        'The challenge isn\'t understanding the Trust Service Criteria — it\'s operationalizing them. SOC 2 Type II requires demonstrating that controls operated effectively over an extended period, typically 6-12 months. This means your compliance program must run continuously, not just during audit preparation windows.',
        'Most organizations start SOC 2 with a consultant engagement and a compliance automation tool. The consultant maps controls, the tool monitors configurations. But the gap between "controls documented" and "controls operating effectively" is where most teams struggle — and where auditors find exceptions.',
        'FormaOS bridges that gap by embedding compliance into operational workflows. Controls aren\'t just documented and monitored — they\'re executed through structured processes that automatically capture evidence of effectiveness.',
      ]}
      problemSections={[
        {
          heading: 'The SOC 2 Type II evidence problem',
          paragraphs: [
            'SOC 2 Type I proves your controls exist at a point in time. Type II proves they work consistently over time. The difference is enormous operationally.',
            'Type II evidence requires:',
          ],
          bullets: [
            'Proof that controls operated throughout the audit period, not just when tested',
            'Evidence of exception handling and remediation processes',
            'Consistent documentation of who executed controls and when',
            'Change management evidence showing controls adapted to system changes',
            'Incident response evidence demonstrating detection and resolution workflows',
          ],
        },
        {
          heading: 'Why automation tools alone aren\'t enough',
          paragraphs: [
            'Configuration monitoring tools check that your cloud infrastructure meets baseline requirements. They\'re valuable for technical controls. But SOC 2 covers far more than infrastructure configuration.',
            'Administrative controls, access reviews, vendor management, security awareness, incident response, and change management all require human processes with documented evidence. These operational controls are where most SOC 2 exceptions originate — and where automation tools provide the least coverage.',
          ],
        },
      ]}
      solutionSections={[
        {
          heading: 'Trust Service Criteria mapping',
          paragraphs: [
            'Map controls across all five TSC categories with clear ownership, testing frequency, and evidence requirements.',
          ],
          bullets: [
            'Security (Common Criteria) — CC1 through CC9 control mapping',
            'Availability, Processing Integrity, Confidentiality, Privacy criteria',
            'Cross-mapped controls that satisfy multiple criteria simultaneously',
            'Control maturity tracking from design to operating effectiveness',
          ],
        },
        {
          heading: 'Operational evidence capture',
          paragraphs: [
            'Evidence is generated as part of daily operations, creating a continuous record of control effectiveness.',
          ],
          bullets: [
            'Task completions linked to specific SOC 2 controls',
            'Access review workflows with approval evidence and timestamps',
            'Change management records with authorization and testing evidence',
            'Incident response timelines with full activity logging',
          ],
        },
        {
          heading: 'Exception and remediation tracking',
          paragraphs: [
            'When controls fail or exceptions occur, FormaOS tracks them through structured remediation workflows — exactly what auditors look for.',
          ],
          bullets: [
            'Exception detection linked to affected controls',
            'Corrective action workflows with owner assignment',
            'Root cause analysis documentation',
            'Verified closure with re-testing evidence',
          ],
        },
        {
          heading: 'Auditor-ready reporting',
          paragraphs: [
            'Generate evidence packages organized by TSC, control description, and testing period. Reduce auditor back-and-forth by providing complete, well-organized documentation.',
          ],
          bullets: [
            'Evidence packages mapped to TSC requirements',
            'Control testing matrices with pass/fail/exception status',
            'Timeline views showing control operation over the audit period',
            'Exportable in formats auditors expect (CSV, ZIP)',
          ],
        },
      ]}
      comparison={{
        title: 'FormaOS vs Configuration Monitoring Tools',
        subtitle: 'SOC 2 covers more than infrastructure. Compare full-scope compliance coverage.',
        traditionalLabel: 'Config Monitoring Only',
        rows: [
          { feature: 'Technical controls', formaos: 'Mapped with evidence workflows', traditional: 'Automated config checks' },
          { feature: 'Administrative controls', formaos: 'Operational workflows with evidence', traditional: 'Manual tracking outside tool' },
          { feature: 'Access reviews', formaos: 'Structured review workflows', traditional: 'Spreadsheet-based reviews' },
          { feature: 'Change management', formaos: 'Integrated approval workflows', traditional: 'Separate ticketing system' },
          { feature: 'Incident response', formaos: 'Full lifecycle evidence capture', traditional: 'Manual timeline reconstruction' },
          { feature: 'Exception handling', formaos: 'Structured remediation workflows', traditional: 'Ad-hoc tracking' },
          { feature: 'Auditor reporting', formaos: 'Complete evidence packages by TSC', traditional: 'Evidence gathered from multiple sources' },
        ],
      }}
      faq={[
        { question: 'Does FormaOS support SOC 2 Type II?', answer: 'Yes. FormaOS is designed for continuous compliance, which aligns directly with the SOC 2 Type II requirement to demonstrate controls operating effectively over a period of time, not just at a point in time.' },
        { question: 'Which Trust Service Criteria does FormaOS cover?', answer: 'FormaOS supports all five Trust Service Criteria: Security (Common Criteria), Availability, Processing Integrity, Confidentiality, and Privacy. Controls can be mapped across one or multiple criteria.' },
        { question: 'Can FormaOS generate auditor-ready evidence packages?', answer: 'Yes. FormaOS generates exportable evidence packages that map directly to TSC requirements, including control descriptions, testing results, and exception tracking with timestamps and attribution.' },
        { question: 'How does FormaOS work alongside configuration monitoring tools?', answer: 'FormaOS complements technical monitoring tools by covering the operational and administrative controls that configuration scanners can\'t address — access reviews, change management, vendor management, and incident response workflows.' },
      ]}
      relatedLinks={[
        { label: 'ISO 27001 Compliance', href: '/iso-compliance-software', description: 'Manage ISO 27001 alongside SOC 2 with shared controls.' },
        { label: 'Framework Coverage', href: '/frameworks', description: 'See all compliance frameworks FormaOS supports.' },
        { label: 'Audit Evidence Management', href: '/audit-evidence-management', description: 'How FormaOS captures and manages audit evidence.' },
        { label: 'Security Architecture', href: '/security', description: 'FormaOS enterprise security infrastructure.' },
        { label: 'Compare: FormaOS vs Drata', href: '/compare/drata', description: 'Side-by-side comparison with Drata.' },
        { label: 'Trust Center', href: '/trust', description: 'Review our security and compliance posture.' },
      ]}
      ctaTitle="Build continuous SOC 2 compliance"
      ctaDescription="Type II demands evidence of control effectiveness over time. FormaOS turns Trust Service Criteria into operational workflows that generate evidence continuously."
    />
  );
}
