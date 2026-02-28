'use client';

import { Shield } from 'lucide-react';
import { SeoLandingTemplate } from '../components/shared/SeoLandingTemplate';

export default function IsoContent() {
  return (
    <SeoLandingTemplate
      badge="ISO Compliance"
      badgeIcon={<Shield className="h-4 w-4" />}
      headline={
        <>
          ISO 27001 Compliance Software{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            That Runs Year-Round
          </span>
        </>
      }
      subheadline="Map ISO 27001 Annex A controls to live workflows and keep your ISMS audit-ready year-round."
      introParagraphs={[
        'ISO 27001 certification signals to customers, partners, and regulators that your organization takes information security seriously. But maintaining that certification is where most teams struggle. The gap between passing an audit and actually operating a mature ISMS is where risk lives.',
        'Traditional approaches rely on spreadsheets, shared drives, and annual evidence-gathering sprints. Controls exist on paper but aren\'t connected to the people and processes that execute them. When the auditor arrives, teams scramble to reconstruct evidence from scattered systems.',
        'FormaOS closes that gap by turning ISO 27001 requirements into executable operational workflows. Every Annex A control is mapped to an owner, a process, and an evidence requirement. Compliance isn\'t something you prepare for — it\'s something your organization does naturally as part of daily operations.',
        'The result: less audit preparation time, stronger security posture, and a living ISMS that actually reflects how your organization manages information security risks.',
      ]}
      problemSections={[
        {
          heading: 'The hidden cost of spreadsheet-driven ISO compliance',
          paragraphs: [
            'Many organizations begin their ISO 27001 journey with spreadsheets and document repositories. Initial certification is achievable with manual effort. But the real challenge emerges during surveillance audits and recertification cycles.',
            'Without operational infrastructure, teams face predictable failure patterns:',
          ],
          bullets: [
            'Evidence is collected retroactively, creating gaps and inconsistencies',
            'Control owners change but documentation lags behind',
            'Risk assessments become stale because they\'re disconnected from daily operations',
            'Internal audit findings are tracked in email threads, not structured workflows',
            'The Statement of Applicability becomes a static document rather than a living system',
          ],
        },
        {
          heading: 'Why periodic compliance creates security blind spots',
          paragraphs: [
            'When ISO compliance operates on a periodic cycle — annual reviews, quarterly evidence collection, pre-audit preparation sprints — your organization develops blind spots between those cycles. Controls that look good on paper may not be executed consistently. Evidence requirements that changed aren\'t captured until someone notices during audit prep.',
            'This periodic approach also creates unnecessary stress and cost. Teams context-switch from their regular work to "compliance mode" multiple times per year, disrupting operations and consuming resources that could be better deployed on actual security improvements.',
          ],
        },
      ]}
      solutionSections={[
        {
          heading: 'Annex A control mapping',
          paragraphs: [
            'FormaOS maps every Annex A control to internal policies, operational processes, and evidence requirements. Controls aren\'t just documented — they\'re connected to the workflows that execute them.',
          ],
          bullets: [
            'Full Annex A 2022 control catalog with applicability tracking',
            'Map controls to policies, processes, and responsible owners',
            'Track implementation status and maturity per control',
            'Generate Statement of Applicability from live operational data',
          ],
        },
        {
          heading: 'Continuous evidence capture',
          paragraphs: [
            'Evidence is captured as work happens, not reconstructed before audits. Every task completion, policy acknowledgment, and control verification creates an immutable evidence record.',
          ],
          bullets: [
            'Automatic evidence collection tied to workflow execution',
            'Immutable audit trail with timestamps and actor attribution',
            'Evidence linked directly to specific Annex A controls',
            'Exportable evidence packages for external auditors',
          ],
        },
        {
          heading: 'Risk register integration',
          paragraphs: [
            'Your risk assessment stays connected to operational controls. When risks change, the controls and evidence requirements update accordingly.',
          ],
          bullets: [
            'Link risks to specific controls and treatment plans',
            'Track risk treatment progress through structured workflows',
            'Maintain assessment history with full version control',
            'Generate risk reports aligned with ISO 27001 requirements',
          ],
        },
        {
          heading: 'Internal audit management',
          paragraphs: [
            'Run internal audits as structured workflows with findings, corrective actions, and evidence requirements — not email chains and spreadsheets.',
          ],
          bullets: [
            'Schedule and execute internal audits with structured findings',
            'Track corrective actions through to verified closure',
            'Link audit findings to specific controls and evidence',
            'Maintain complete audit history for surveillance reviews',
          ],
        },
      ]}
      comparison={{
        title: 'FormaOS vs Traditional ISO Compliance',
        subtitle: 'How operational compliance compares to periodic compliance approaches.',
        traditionalLabel: 'Spreadsheets & Manual Tracking',
        rows: [
          { feature: 'Control mapping', formaos: 'Live Annex A mapping with owners', traditional: 'Static spreadsheet rows' },
          { feature: 'Evidence collection', formaos: 'Continuous, automatic capture', traditional: 'Periodic manual gathering' },
          { feature: 'Audit preparation', formaos: 'Always audit-ready', traditional: 'Weeks of pre-audit scramble' },
          { feature: 'Statement of Applicability', formaos: 'Living document from real data', traditional: 'Annually updated PDF' },
          { feature: 'Risk treatment tracking', formaos: 'Connected to controls and workflows', traditional: 'Separate risk register spreadsheet' },
          { feature: 'Internal audit findings', formaos: 'Structured workflows to closure', traditional: 'Email threads and follow-ups' },
          { feature: 'Multi-framework support', formaos: 'Unified control mapping across ISO, SOC, NDIS', traditional: 'Separate tracking per framework' },
        ],
      }}
      faq={[
        { question: 'Does FormaOS support ISO 27001:2022?', answer: 'Yes. FormaOS maps controls directly to Annex A requirements from the 2022 revision, including the new organizational, people, physical, and technological control categories.' },
        { question: 'Can FormaOS help with ISO certification?', answer: 'FormaOS provides the operational infrastructure to maintain continuous compliance — control ownership, evidence capture, and audit trail generation — that auditors require during certification and surveillance audits.' },
        { question: 'How does FormaOS handle the Statement of Applicability?', answer: 'FormaOS lets you define which Annex A controls are applicable, map them to internal policies and controls, and track evidence against each. This creates a living Statement of Applicability backed by real operational data.' },
        { question: 'Can we manage multiple ISO frameworks simultaneously?', answer: 'Yes. FormaOS is framework-agnostic. You can manage ISO 27001, ISO 9001, ISO 45001, and other frameworks concurrently with shared controls and unified evidence collection.' },
      ]}
      relatedLinks={[
        { label: 'Framework Coverage', href: '/frameworks', description: 'See all compliance frameworks FormaOS supports.' },
        { label: 'SOC 2 Compliance', href: '/soc2-compliance-automation', description: 'Automate SOC 2 compliance alongside ISO 27001.' },
        { label: 'Audit Evidence Management', href: '/audit-evidence-management', description: 'How FormaOS captures and manages audit evidence.' },
        { label: 'Security Architecture', href: '/security', description: 'FormaOS enterprise security infrastructure.' },
        { label: 'Compare Platforms', href: '/compare', description: 'See how FormaOS compares to compliance automation tools.' },
        { label: 'Trust Center', href: '/trust', description: 'Review our security posture and compliance documentation.' },
      ]}
      ctaTitle="Make ISO compliance operational"
      ctaDescription="Stop treating certification as a project. FormaOS connects Annex A controls to daily workflows, captures evidence continuously, and keeps your ISMS audit-ready year-round."
    />
  );
}
