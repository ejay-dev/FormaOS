'use client';

import { FileCheck } from 'lucide-react';
import { SeoLandingTemplate } from '../components/shared/SeoLandingTemplate';

export default function AuditEvidenceContent() {
  return (
    <SeoLandingTemplate
      badge="Audit Evidence"
      badgeIcon={<FileCheck className="h-4 w-4" />}
      headline={
        <>
          Audit Evidence Management{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
            That Captures Itself
          </span>
        </>
      }
      subheadline="Stop reconstructing evidence before audits. FormaOS captures immutable evidence as work happens, links it to compliance controls, and generates auditor-ready packages on demand."
      introParagraphs={[
        'Audit evidence is the currency of compliance. Without organized, verifiable evidence, controls are just claims. With it, you demonstrate that your organization actually does what it says it does.',
        'The fundamental problem with audit evidence isn\'t collection — it\'s timing. When evidence is gathered after the fact, retroactively assembled from email threads, screenshots, and spreadsheets, it\'s incomplete, inconsistent, and unconvincing. Auditors can tell the difference between evidence that was captured in real-time and evidence that was reconstructed for an audit.',
        'FormaOS solves this by embedding evidence capture into operational workflows. Every task completion, every approval, every policy acknowledgment, every control verification creates an evidence record at the moment it happens. The result is a continuous, immutable evidence chain that auditors trust because it reflects actual operations.',
        'This isn\'t just about audit preparation efficiency — though that improves dramatically. It\'s about evidence quality. Real-time evidence is more complete, more accurate, and more defensible than retroactive evidence collection can ever be.',
      ]}
      problemSections={[
        {
          heading: 'The evidence collection anti-pattern',
          paragraphs: [
            'Most organizations follow a predictable pattern: compliance requirements are documented, controls are designed, and then — months later — someone needs to prove the controls actually worked. This triggers the evidence scramble.',
            'The evidence scramble looks like this:',
          ],
          bullets: [
            'Compliance managers email control owners asking for evidence of what happened 3-6 months ago',
            'Control owners search through email, Slack, and shared drives to find relevant artifacts',
            'Screenshots are taken of current system states, not historical states',
            'Spreadsheets are updated retroactively to show what should have been tracked all along',
            'Evidence packages are assembled manually, often missing context about who, when, and why',
            'Auditors receive evidence that\'s disorganized, incomplete, and hard to trace to specific controls',
          ],
        },
        {
          heading: 'Why retroactive evidence fails audits',
          paragraphs: [
            'Auditors are trained to identify retroactively assembled evidence. Inconsistent timestamps, missing context, gaps in coverage, and evidence that doesn\'t clearly tie to specific controls are all red flags.',
            'More importantly, retroactive evidence doesn\'t actually prove that controls operated effectively during the period under review. It only proves that someone tried to reconstruct what happened. For SOC 2 Type II, ISO 27001 surveillance audits, and NDIS Commission reviews, this distinction matters.',
          ],
        },
      ]}
      solutionSections={[
        {
          heading: 'Automatic evidence capture',
          paragraphs: [
            'Evidence is generated as a byproduct of operational execution. When staff complete tasks, approve workflows, or verify controls, the evidence is captured automatically with full context.',
          ],
          bullets: [
            'Every workflow action generates an evidence record',
            'Actor, timestamp, action, and context captured automatically',
            'Evidence linked to specific controls and requirements at creation',
            'No separate evidence collection step required from control owners',
          ],
        },
        {
          heading: 'Immutable audit trails',
          paragraphs: [
            'Evidence records are stored in append-only logs that cannot be modified after creation. This provides a tamper-evident chain that auditors trust.',
          ],
          bullets: [
            'Cryptographic timestamps on all evidence records',
            'Append-only storage prevents retroactive modification',
            'Complete chain of custody for every evidence artifact',
            'Version history for documents and policies with diff tracking',
          ],
        },
        {
          heading: 'Cross-framework evidence mapping',
          paragraphs: [
            'A single evidence record can satisfy requirements across multiple frameworks. When a control maps to both ISO 27001 Annex A and SOC 2 TSC, the evidence counts for both.',
          ],
          bullets: [
            'Multi-framework control mapping eliminates duplicate evidence collection',
            'Gap analysis identifies controls with insufficient evidence coverage',
            'Framework-specific views show evidence status per standard',
            'Unified evidence repository across all compliance programs',
          ],
        },
        {
          heading: 'Auditor-ready export packages',
          paragraphs: [
            'Generate evidence packages organized exactly how auditors expect — by framework, control, time period, and evidence type.',
          ],
          bullets: [
            'Structured exports organized by framework and control',
            'Time-period filtering for Type II and surveillance audits',
            'Evidence completeness scoring before export',
            'Standard formats (CSV, ZIP) for auditor independence',
          ],
        },
      ]}
      comparison={{
        title: 'FormaOS vs Manual Evidence Collection',
        subtitle: 'How continuous evidence capture compares to periodic evidence gathering approaches.',
        traditionalLabel: 'Manual Evidence Gathering',
        rows: [
          { feature: 'Evidence timing', formaos: 'Captured in real-time during operations', traditional: 'Collected retroactively before audits' },
          { feature: 'Evidence completeness', formaos: 'Continuous coverage with no gaps', traditional: 'Gaps between collection periods' },
          { feature: 'Evidence integrity', formaos: 'Immutable records with timestamps', traditional: 'Screenshots and manually updated logs' },
          { feature: 'Control linkage', formaos: 'Automatically linked at capture', traditional: 'Manually mapped after collection' },
          { feature: 'Multi-framework', formaos: 'Single evidence serves multiple frameworks', traditional: 'Separate collection per framework' },
          { feature: 'Audit preparation', formaos: 'Generate packages on demand', traditional: 'Weeks of manual assembly' },
          { feature: 'Auditor confidence', formaos: 'Real-time evidence is trusted', traditional: 'Retroactive evidence raises questions' },
        ],
      }}
      faq={[
        { question: 'How does FormaOS capture audit evidence?', answer: 'Evidence is captured automatically as work happens. Every task completion, policy acknowledgment, approval, and control verification creates an immutable evidence record linked to specific compliance controls.' },
        { question: 'Is evidence in FormaOS truly immutable?', answer: 'Yes. Evidence records include cryptographic timestamps and are stored in append-only audit logs. Records cannot be modified or deleted after creation, ensuring a tamper-evident evidence chain.' },
        { question: 'Can we export evidence for external auditors?', answer: 'Yes. FormaOS generates structured evidence packages organized by framework, control, and time period. Exports are available in standard formats (CSV, ZIP) that auditors can review independently.' },
        { question: 'How does FormaOS handle evidence for multiple frameworks?', answer: 'A single piece of evidence can be linked to controls across multiple frameworks. This eliminates duplicate evidence collection when controls overlap between ISO 27001, SOC 2, NDIS, and other frameworks.' },
      ]}
      relatedLinks={[
        { label: 'ISO Compliance Software', href: '/iso-compliance-software', description: 'Automate ISO 27001 compliance with continuous evidence.' },
        { label: 'SOC 2 Automation', href: '/soc2-compliance-automation', description: 'SOC 2 Type II evidence capture and reporting.' },
        { label: 'NDIS Compliance', href: '/ndis-compliance-system', description: 'Evidence management for NDIS providers.' },
        { label: 'Security Architecture', href: '/security', description: 'How FormaOS protects evidence integrity.' },
        { label: 'Product Platform', href: '/product', description: 'Explore the full FormaOS platform.' },
        { label: 'Compare Platforms', href: '/compare', description: 'How FormaOS compares to other compliance tools.' },
      ]}
      ctaTitle="End the evidence scramble"
      ctaDescription="FormaOS captures audit evidence automatically as work happens. No retroactive gathering, no missing context, no audit preparation panic. Just continuous, immutable proof that your controls work."
    />
  );
}
