'use client';

import { Heart } from 'lucide-react';
import { SeoLandingTemplate } from '../components/shared/SeoLandingTemplate';

export default function NdisContent() {
  return (
    <SeoLandingTemplate
      badge="NDIS Compliance"
      badgeIcon={<Heart className="h-4 w-4" />}
      headline={
        <>
          NDIS Compliance System for{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Disability Service Providers
          </span>
        </>
      }
      subheadline="Translate NDIS Practice Standards into owned workflows with continuous evidence for Commission reviews."
      introParagraphs={[
        'NDIS providers face a unique compliance challenge. The NDIS Practice Standards define what quality looks like, but turning those standards into daily operational practice requires systems that connect policy to execution.',
        'Most providers manage compliance through a combination of policy documents, spreadsheets, incident logs, and folder structures. This approach creates gaps between what policies say and what staff actually do. When the NDIS Quality and Safeguards Commission conducts an audit, providers scramble to demonstrate that standards are met consistently — not just documented.',
        'FormaOS is purpose-built for this challenge. It maps NDIS Practice Standards and Quality Indicators to operational workflows that staff interact with daily. Evidence is captured as work happens — incident reports, staff training records, participant feedback, and service delivery documentation — creating a continuous compliance record.',
        'The result is a compliance system that works for providers, not against them. Staff focus on service delivery while the platform ensures every action creates the evidence trail that auditors and the Commission require.',
      ]}
      problemSections={[
        {
          heading: 'Why NDIS compliance is harder than it looks',
          paragraphs: [
            'The NDIS Practice Standards cover everything from governance and operational management to service delivery, participant rights, and incident management. Each standard has associated Quality Indicators that define observable evidence of compliance.',
            'For providers, this creates a multi-dimensional compliance challenge:',
          ],
          bullets: [
            'Practice Standards span governance, workforce, service delivery, and risk management',
            'Quality Indicators require observable evidence, not just documented policies',
            'Incident reporting has strict timeframes and categorization requirements',
            'Worker screening and credential management must be continuously maintained',
            'Participant feedback and complaints need structured handling and resolution',
            'Restrictive practice reporting requires detailed documentation and authorization',
          ],
        },
        {
          heading: 'The audit readiness gap',
          paragraphs: [
            'NDIS audits (both verification and certification) assess whether your organization consistently meets Practice Standards in practice — not just on paper. Auditors interview staff, review evidence, and observe operations.',
            'Providers who rely on manual compliance tracking face a common pattern: policies are well-written, but operational evidence is scattered, incomplete, or inconsistent. The gap between documented intent and operational reality is where audit findings originate.',
          ],
        },
      ]}
      solutionSections={[
        {
          heading: 'Practice Standards mapping',
          paragraphs: [
            'Map your registered modules directly to NDIS Practice Standards and Quality Indicators with clear ownership and evidence requirements.',
          ],
          bullets: [
            'Core Module and Supplementary Module mapping',
            'Quality Indicators linked to operational evidence',
            'Registration group-specific requirements tracking',
            'Standards coverage dashboard for compliance visibility',
          ],
        },
        {
          heading: 'Incident management workflows',
          paragraphs: [
            'Handle NDIS reportable incidents through structured workflows that meet Commission timeframes and documentation requirements.',
          ],
          bullets: [
            'Categorized incident intake aligned with NDIS categories',
            'Notification workflow with Commission reporting timeframes',
            'Investigation management with evidence attachment',
            'Corrective action tracking through to verified resolution',
          ],
        },
        {
          heading: 'Worker credential management',
          paragraphs: [
            'Track worker screening, qualifications, and training requirements. Ensure credential currency and receive alerts before expiry.',
          ],
          bullets: [
            'NDIS Worker Screening Check tracking',
            'Qualification and certification management',
            'Mandatory training compliance tracking',
            'Expiry alerts with automated renewal workflows',
          ],
        },
        {
          heading: 'Continuous evidence collection',
          paragraphs: [
            'Evidence is captured through daily operations — service delivery records, training completions, incident resolutions, and participant feedback — creating an always-current compliance record.',
          ],
          bullets: [
            'Evidence linked to specific Practice Standards and Quality Indicators',
            'Immutable audit trail with timestamps and attribution',
            'Participant feedback and complaints tracking',
            'Exportable evidence packages for Commission audits',
          ],
        },
      ]}
      comparison={{
        title: 'FormaOS vs Manual NDIS Compliance',
        subtitle: 'How operational compliance compares to document-based approaches for NDIS providers.',
        traditionalLabel: 'Spreadsheets & Folders',
        rows: [
          { feature: 'Practice Standards mapping', formaos: 'Live mapping with evidence workflows', traditional: 'Spreadsheet checklist' },
          { feature: 'Incident reporting', formaos: 'Structured workflows with timeframes', traditional: 'Email/paper-based reporting' },
          { feature: 'Worker credentials', formaos: 'Automated tracking with expiry alerts', traditional: 'Manual spreadsheet updates' },
          { feature: 'Evidence collection', formaos: 'Continuous capture from operations', traditional: 'Periodic manual gathering' },
          { feature: 'Audit readiness', formaos: 'Always audit-ready with organized evidence', traditional: 'Weeks of pre-audit preparation' },
          { feature: 'Participant feedback', formaos: 'Structured intake and resolution tracking', traditional: 'Informal documentation' },
          { feature: 'Restrictive practices', formaos: 'Documented authorization workflows', traditional: 'Paper-based authorization' },
        ],
      }}
      faq={[
        { question: 'Does FormaOS map to NDIS Practice Standards?', answer: 'Yes. FormaOS maps directly to the NDIS Practice Standards and Quality Indicators, including Core Module, Supplementary Modules, and provider-specific requirements based on your registration groups.' },
        { question: 'Can FormaOS help with NDIS Commission audits?', answer: 'FormaOS maintains continuous audit readiness by connecting Practice Standards to operational workflows, evidence collection, and incident management. When auditors arrive, evidence is already organized and accessible.' },
        { question: 'Does FormaOS handle NDIS incident reporting?', answer: 'Yes. FormaOS provides structured incident management workflows aligned with NDIS reportable incident requirements, including timeframes, categorization, investigation, and resolution tracking.' },
        { question: 'Is FormaOS suitable for small NDIS providers?', answer: 'Yes. FormaOS scales from small providers managing a few registration groups to large organizations with multiple service types and locations. The platform adapts to your operational scope.' },
      ]}
      relatedLinks={[
        { label: 'NDIS & Aged Care Use Case', href: '/use-cases/ndis-aged-care', description: 'Detailed NDIS use case with workflow examples.' },
        { label: 'Healthcare Compliance', href: '/healthcare-compliance-platform', description: 'Compliance for healthcare organizations.' },
        { label: 'Industry Solutions', href: '/industries', description: 'Compliance frameworks by industry.' },
        { label: 'Incident Management', href: '/use-cases/incident-management', description: 'How FormaOS handles incident workflows.' },
        { label: 'Workforce Credentials', href: '/use-cases/workforce-credentials', description: 'Worker screening and credential management.' },
        { label: 'Framework Coverage', href: '/frameworks', description: 'All supported compliance frameworks.' },
      ]}
      ctaTitle="Operationalize NDIS compliance"
      ctaDescription="Turn Practice Standards into daily workflows. FormaOS captures evidence continuously so your team stays focused on participants while maintaining audit readiness."
    />
  );
}
