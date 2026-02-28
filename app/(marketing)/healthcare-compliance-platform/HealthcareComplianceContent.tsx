'use client';

import { Stethoscope } from 'lucide-react';
import { SeoLandingTemplate } from '../components/shared/SeoLandingTemplate';

export default function HealthcareComplianceContent() {
  return (
    <SeoLandingTemplate
      badge="Healthcare Compliance"
      badgeIcon={<Stethoscope className="h-4 w-4" />}
      headline={
        <>
          Healthcare Compliance Platform for{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            Clinical Governance
          </span>
        </>
      }
      subheadline="Run NSQHS, AHPRA, incidents, and accreditation evidence in one clinical governance operating system."
      introParagraphs={[
        'Healthcare organizations operate under some of the most demanding compliance requirements of any industry. The National Safety and Quality Health Service Standards, AHPRA practitioner requirements, state health regulations, and accreditation standards create a complex web of obligations that must be met while delivering patient care.',
        'Clinical governance isn\'t optional — it\'s the foundation that ensures patient safety, care quality, and organizational accountability. But managing governance obligations through disconnected systems creates dangerous gaps between documented procedures and actual practice.',
        'FormaOS provides a unified compliance platform that connects clinical governance frameworks to operational workflows. Credential management, incident reporting, policy compliance, and accreditation evidence are managed through structured processes that capture evidence as care is delivered.',
        'For healthcare leaders, this means visibility into compliance status across services and sites, confidence in accreditation readiness, and reduced administrative burden on clinical staff who can focus on patient care.',
      ]}
      problemSections={[
        {
          heading: 'The clinical governance challenge',
          paragraphs: [
            'Healthcare compliance spans clinical, operational, and administrative domains. Each domain has its own standards, reporting requirements, and evidence needs. Managing these domains separately creates fragmentation that undermines governance effectiveness.',
          ],
          bullets: [
            'NSQHS Standards require evidence across all eight standard areas',
            'AHPRA practitioner registration and credential currency must be continuously verified',
            'Clinical incident reporting requires structured investigation and reporting workflows',
            'Medication management, infection control, and safety protocols need documented compliance',
            'Accreditation assessors expect organized, comprehensive evidence packages',
            'Multi-site organizations need consistent governance with local operational flexibility',
          ],
        },
        {
          heading: 'Why document management isn\'t clinical governance',
          paragraphs: [
            'Many healthcare organizations equate compliance with document management — policies stored in shared drives, checklists completed periodically, and evidence gathered before accreditation assessments.',
            'This approach confuses documentation with governance. A policy that exists but isn\'t connected to operational workflows provides no assurance of compliance. A checklist completed quarterly doesn\'t capture what happens daily. Evidence gathered retroactively may not accurately reflect operational reality.',
          ],
        },
      ]}
      solutionSections={[
        {
          heading: 'NSQHS Standards compliance',
          paragraphs: [
            'Map all eight NSQHS Standards to operational controls with evidence requirements and ownership.',
          ],
          bullets: [
            'Standard 1: Clinical Governance — leadership, accountability, and oversight workflows',
            'Standard 2: Partnering with Consumers — feedback collection and participation tracking',
            'Standards 3-8: Clinical standards with specific evidence requirements per domain',
            'Cross-standard evidence sharing where controls satisfy multiple requirements',
          ],
        },
        {
          heading: 'Credential and registration management',
          paragraphs: [
            'Track practitioner registrations, qualifications, and competency requirements with automated alerts and verification workflows.',
          ],
          bullets: [
            'AHPRA registration tracking with expiry monitoring',
            'Qualification and credential management across practitioner types',
            'Continuing professional development tracking',
            'Automated alerts before credential expiry with renewal workflows',
          ],
        },
        {
          heading: 'Clinical incident management',
          paragraphs: [
            'Structured incident workflows from intake through investigation and resolution, aligned with clinical governance reporting requirements.',
          ],
          bullets: [
            'Severity classification with escalation pathways',
            'Root cause analysis documentation and tracking',
            'Corrective and preventive action management',
            'Regulatory reporting compliance with audit trail',
          ],
        },
        {
          heading: 'Accreditation readiness',
          paragraphs: [
            'Maintain continuous accreditation readiness with organized evidence packages that map directly to assessment criteria.',
          ],
          bullets: [
            'Evidence organized by NSQHS Standard and assessment item',
            'Gap analysis identifying missing or weak evidence',
            'Pre-assessment self-evaluation tools',
            'Exportable evidence packages for assessors',
          ],
        },
      ]}
      comparison={{
        title: 'FormaOS vs Traditional Healthcare Compliance',
        subtitle: 'How operational compliance compares to document-centric approaches in healthcare settings.',
        traditionalLabel: 'Document Management & Checklists',
        rows: [
          { feature: 'NSQHS mapping', formaos: 'Live mapping to operational workflows', traditional: 'Standards referenced in policy documents' },
          { feature: 'Credential tracking', formaos: 'Automated monitoring with alerts', traditional: 'Spreadsheet-based manual tracking' },
          { feature: 'Clinical incidents', formaos: 'Structured workflows with full lifecycle', traditional: 'Paper forms or basic incident logs' },
          { feature: 'Evidence collection', formaos: 'Continuous capture from operations', traditional: 'Pre-accreditation evidence gathering' },
          { feature: 'Multi-site governance', formaos: 'Centralized oversight, local execution', traditional: 'Inconsistent practices across sites' },
          { feature: 'Accreditation prep', formaos: 'Always ready with organized evidence', traditional: 'Months of preparation before assessment' },
          { feature: 'Staff compliance burden', formaos: 'Evidence captured through normal workflows', traditional: 'Separate compliance tasks and documentation' },
        ],
      }}
      faq={[
        { question: 'Does FormaOS support NSQHS Standards?', answer: 'Yes. FormaOS maps to the National Safety and Quality Health Service Standards, including all eight standards covering clinical governance, partnering with consumers, medication safety, comprehensive care, and more.' },
        { question: 'Can FormaOS manage AHPRA compliance requirements?', answer: 'FormaOS tracks practitioner registration, credential currency, and continuing professional development requirements aligned with AHPRA regulatory obligations.' },
        { question: 'How does FormaOS handle clinical incident reporting?', answer: 'FormaOS provides structured incident management workflows with severity classification, investigation management, root cause analysis, and corrective action tracking aligned with clinical governance requirements.' },
        { question: 'Is FormaOS suitable for multi-site healthcare organizations?', answer: 'Yes. FormaOS supports multi-site deployments with centralized governance and site-specific operational workflows, allowing standardized compliance management across locations.' },
      ]}
      relatedLinks={[
        { label: 'Healthcare Use Case', href: '/use-cases/healthcare', description: 'Detailed healthcare compliance workflows and examples.' },
        { label: 'NDIS Compliance', href: '/ndis-compliance-system', description: 'Compliance system for disability service providers.' },
        { label: 'Incident Management', href: '/use-cases/incident-management', description: 'Structured incident management workflows.' },
        { label: 'Workforce Credentials', href: '/use-cases/workforce-credentials', description: 'Worker credential and training management.' },
        { label: 'Industry Solutions', href: '/industries', description: 'Compliance solutions by industry.' },
        { label: 'Audit Evidence', href: '/audit-evidence-management', description: 'How FormaOS manages audit evidence.' },
      ]}
      ctaTitle="Strengthen clinical governance"
      ctaDescription="Connect NSQHS Standards to daily operations. FormaOS captures evidence from clinical workflows so your team stays focused on patient care while maintaining accreditation readiness."
    />
  );
}
