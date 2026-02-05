import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FileCheck,
  Layers,
  Lock,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StaticImageData } from 'next/image';
import complianceDashboardHero from '@/test-results/screenshots/B4-dashboard.png';
import tasksWorkflowHero from '@/test-results/screenshots/C9-tasks-page.png';
import rbacHero from '@/test-results/screenshots/C12-rbac-redirect.png';
import workspaceHero from '@/test-results/screenshots/A3-post-login.png';
import adminAccessHero from '@/QA_UPGRADES/RESULTS/critical-user-journeys-CRI-516e8--cannot-access-admin-routes-chromium/test-failed-1.png';
import monitoringHero from '@/QA_UPGRADES/RESULTS/critical-user-journeys-CRI-e2d9e-console-not-user-dashboard--chromium/test-failed-1.png';
import soc2Hero from '@/QA_UPGRADES/RESULTS/critical-user-journeys-CRI-50a4f-user-login-resumes-properly-chromium/test-failed-1.png';
import controlsMapHero from '@/QA_UPGRADES/RESULTS/critical-user-journeys-CRI-dd0d7-hboard-NO-PRICING-REDIRECT--chromium/test-failed-1.png';
import policyLifecycleHero from '@/selenium-tests/test-results/screenshots/testAcceptInviteFlow_20260119_004735.png';
import vendorRiskHero from '@/selenium-tests/test-results/screenshots/uat_invite_flow.png';
import retentionHero from '@/selenium-tests/test-results/screenshots/testAcceptInviteFlow_20260119_010306.png';

export type BlogSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  steps?: string[];
  links?: { label: string; href: string; description?: string }[];
};

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  heroImage: StaticImageData;
  heroAlt: string;
  icon: LucideIcon;
  featured?: boolean;
  sections: BlogSection[];
};

export const blogPosts: BlogPost[] = [
  {
    id: 'compliance-operating-system',
    title: 'Why Your Organization Needs a Compliance Operating System',
    excerpt:
      'Modern compliance requires more than checklists. Learn how a compliance operating system aligns people, processes, and evidence in real time—without slowing the business.',
    author: 'FormaOS Team',
    date: 'February 2, 2026',
    readTime: '10 min read',
    category: 'Compliance',
    heroImage: complianceDashboardHero,
    heroAlt: 'FormaOS compliance dashboard with control status and evidence',
    icon: Sparkles,
    featured: true,
    sections: [
      {
        heading: 'The compliance gap most teams feel',
        paragraphs: [
          'Growth creates compliance pressure. New services, new markets, and new partners multiply obligations faster than policy teams can keep up.',
          'The result is a gap between what the organization thinks is happening and what is actually happening day to day.',
          'That gap shows up as late evidence, scattered documentation, and a scramble before audits. A compliance operating system closes that gap by turning requirements into audit‑readiness workflows rather than a yearly project.',
        ],
        bullets: [
          'Policies that are readable but not operationalized',
          'Evidence collected retroactively and stored in silos',
          'Controls that are owned by “everyone,” which means no one',
        ],
      },
      {
        heading: 'What a compliance operating system is',
        paragraphs: [
          'A compliance operating system connects obligations to controls, controls to tasks, and tasks to evidence.',
          'It is not a GRC spreadsheet, and it is not a document repository. It is the system of record for how compliance actually happens.',
          'The most effective platforms make compliance measurable. They expose control health, make ownership explicit, and enforce governance with role‑based access controls (RBAC).',
        ],
        bullets: [
          'Control lifecycle management with ownership and SLAs',
          'Evidence capture embedded in daily workflows',
          'Audit-ready reporting with immutable history',
        ],
      },
      {
        heading: 'How to implement in 90 days',
        steps: [
          'Inventory obligations across regulators, contracts, and customer requirements.',
          'Normalize controls and map each obligation to a single source of truth.',
          'Assign control owners and convert controls into operational tasks.',
          'Automate evidence collection for recurring workflows and integrations.',
          'Establish weekly control health reviews with defined escalation paths.',
        ],
        paragraphs: [
          'A 90‑day rollout is realistic when teams focus on repeatable controls first.',
          'Start with high‑risk controls and the workflows that already produce evidence, then layer in compliance automation for the rest.',
        ],
      },
      {
        heading: 'Metrics that matter for leaders',
        bullets: [
          'Coverage: percentage of obligations mapped to active controls',
          'Freshness: time since last evidence update for key controls',
          'Ownership: controls with a named accountable owner',
          'Audit readiness: evidence completeness for the last 90 days',
        ],
        paragraphs: [
          'These indicators help leadership decide where to invest and where risk is accumulating.',
          'They also make compliance a living system rather than a quarterly fire drill by tying evidence freshness to daily execution.',
        ],
      },
      {
        heading: 'Where FormaOS fits',
        paragraphs: [
          'FormaOS brings obligations, controls, and evidence together in one operational workflow.',
          'With automated evidence capture, audit readiness workflows, and RBAC governance, teams can scale compliance without slowing delivery.',
        ],
        links: [
          {
            label: 'Explore the platform',
            href: '/product',
            description: 'See how FormaOS connects controls to real work.',
          },
          {
            label: 'Security posture overview',
            href: '/security',
            description: 'Understand how evidence integrity is protected.',
          },
          {
            label: 'Pricing and rollout options',
            href: '/pricing',
          },
        ],
      },
    ],
  },
  {
    id: 'ndis-practice-standards-2025',
    title: 'NDIS Practice Standards 2025: What Providers Need to Know',
    excerpt:
      'A practical guide to the 2025 NDIS Practice Standards updates—what changed, how to map controls, and how to keep evidence ready across service lines.',
    author: 'Compliance Team',
    date: 'January 20, 2026',
    readTime: '9 min read',
    category: 'NDIS',
    heroImage: tasksWorkflowHero,
    heroAlt: 'FormaOS task workflow view with evidence-ready tasks',
    icon: Building2,
    sections: [
      {
        heading: 'What changed in 2025',
        paragraphs: [
          'The 2025 update focuses on participant safety, continuity of care, and transparent outcomes reporting.',
          'Providers are expected to demonstrate not only policies but also reliable execution evidence across locations and teams.',
          'The most significant change is the emphasis on ongoing monitoring—auditors now expect evidence that shows consistent control performance, not a single snapshot.',
        ],
        bullets: [
          'Stronger requirements for incident response and reporting timelines',
          'More explicit expectations for staff competency validation',
          'Greater scrutiny of subcontractors and shared service partners',
        ],
      },
      {
        heading: 'Mapping standards to operational controls',
        paragraphs: [
          'Mapping starts with translating each standard into a control objective and a measurable task.',
          'Avoid creating a unique control for every line item. Instead, normalize common controls that can cover multiple obligations.',
        ],
        bullets: [
          'Create a control dictionary that is shared across all service lines',
          'Assign one accountable owner per control, even if multiple teams execute it',
          'Define evidence artifacts that are generated as part of delivery',
        ],
      },
      {
        heading: 'A provider playbook: 5 steps',
        paragraphs: [
          'A simple playbook keeps providers consistent across services. The goal is to make evidence capture part of daily delivery, not a quarterly scramble.',
        ],
        steps: [
          'Run a gap assessment for each service line and note control maturity.',
          'Standardize evidence templates for incidents, audits, and training.',
          'Automate capture of shift handovers, progress notes, and approvals.',
          'Schedule monthly control reviews with quality and service leaders.',
          'Document remediation actions and retain evidence for 24 months.',
        ],
      },
      {
        heading: 'Evidence that stands up to audit',
        paragraphs: [
          'Auditors want to see timing, ownership, and completeness.',
          'Evidence should show who performed the control, when it was completed, and how exceptions were handled in the audit‑readiness workflow.',
        ],
        bullets: [
          'Training records linked to staff rosters and role requirements',
          'Incident reviews with root cause analysis and remediation',
          'Consent records tied to individual plans and service delivery',
        ],
      },
      {
        heading: 'Supporting providers with FormaOS',
        links: [
          {
            label: 'Product overview',
            href: '/product',
            description:
              'See how standards map directly to controls and tasks.',
          },
          {
            label: 'Pricing for providers',
            href: '/pricing',
          },
        ],
        paragraphs: [
          'FormaOS helps providers maintain consistent evidence without changing the way teams deliver care.',
          'Automated evidence capture and RBAC governance keep control health visible, so teams can see risk before it becomes a finding.',
        ],
      },
    ],
  },
  {
    id: 'immutable-audit-trails',
    title: 'The Power of Immutable Audit Trails in Regulatory Defense',
    excerpt:
      'Immutable audit trails create defensible evidence chains. Learn how to design them, what regulators expect, and how to implement them without slowing teams down.',
    author: 'Security Team',
    date: 'January 12, 2026',
    readTime: '8 min read',
    category: 'Security',
    heroImage: rbacHero,
    heroAlt: 'FormaOS RBAC configuration and access controls interface',
    icon: Shield,
    sections: [
      {
        heading: 'Why traditional evidence fails',
        paragraphs: [
          'Screenshots and PDFs are easy to fabricate and hard to validate. Auditors increasingly expect evidence that can prove provenance and integrity.',
          'Immutable audit trails provide a timeline of actions, ownership, and changes that can be verified long after the event occurred.',
        ],
        bullets: [
          'Unverifiable evidence leads to deeper sampling and higher scrutiny',
          'Manual evidence trails often lack timestamps and authorship',
          'Version drift makes it impossible to prove “what was true then”',
        ],
      },
      {
        heading: 'Designing an immutable trail',
        paragraphs: [
          'Immutable trails do not require blockchain to be effective.',
          'They require strong integrity controls: write‑once logs, chained hashes, and strict access controls with clear audit metadata.',
        ],
        bullets: [
          'Append-only logs with cryptographic hashing',
          'Role-based access with explicit change events',
          'Retention policies aligned to regulatory timelines',
        ],
      },
      {
        heading: 'Implementation steps for teams',
        paragraphs: [
          'Teams should treat integrity controls as part of their audit‑readiness workflow, not a one‑off project.',
        ],
        steps: [
          'Identify controls where evidence integrity is most critical.',
          'Define a standard evidence schema (who, what, when, where).',
          'Automate log ingestion from core systems and workflows.',
          'Apply integrity verification and lock evidence after review.',
          'Test retrieval and reporting before your next audit window.',
        ],
      },
      {
        heading: 'Security practices that reinforce trust',
        paragraphs: [
          'RBAC governance keeps evidence handling explicit and reduces the chance of unauthorized changes.',
        ],
        bullets: [
          'Separation of duties for evidence review and approval',
          'Tamper-evident storage with monitored access',
          'Continuous monitoring for log gaps or anomalies',
        ],
      },
      {
        heading: 'How FormaOS supports audit integrity',
        paragraphs: [
          'FormaOS captures evidence at the moment of execution and locks it with immutable metadata.',
          'Audit trails are searchable, exportable, and mapped directly to the controls they support, with RBAC governance to protect access.',
        ],
        links: [
          {
            label: 'Security architecture',
            href: '/security',
          },
        ],
      },
    ],
  },
  {
    id: 'automated-evidence-collection',
    title: 'From Manual to Automatic: Evidence Collection Reimagined',
    excerpt:
      'Manual evidence collection is costly and error‑prone. Learn how to automate capture with workflow triggers and integrations without disrupting teams.',
    author: 'Product Team',
    date: 'January 6, 2026',
    readTime: '7 min read',
    category: 'Technology',
    heroImage: workspaceHero,
    heroAlt: 'FormaOS workspace overview showing evidence automation',
    icon: Zap,
    sections: [
      {
        heading: 'The manual evidence tax',
        paragraphs: [
          'Compliance teams often spend weeks gathering screenshots, spreadsheets, and approvals.',
          'This work is repetitive and rarely improves quality—yet it consumes scarce time.',
          'Automation shifts evidence capture from a separate activity into the workflow itself, making compliance the by‑product of doing the work.',
        ],
        bullets: [
          'Evidence requests that interrupt delivery teams',
          'High risk of missing or outdated artifacts',
          'Low audit confidence and poor traceability',
        ],
      },
      {
        heading: 'Event‑driven evidence capture',
        paragraphs: [
          'Modern systems can emit signals whenever a control‑relevant action happens: an approval, a deployment, or a training completion.',
          'These signals can be captured automatically and stored as evidence inside audit‑readiness workflows.',
        ],
        bullets: [
          'Integrations with identity, ticketing, and HR systems',
          'Webhooks or scheduled jobs for recurring controls',
          'Unified evidence metadata for audits and reporting',
        ],
      },
      {
        heading: 'A practical automation path',
        paragraphs: [
          'Start with the controls that generate the most recurring evidence. Build momentum before expanding across the full control library.',
        ],
        steps: [
          'Select 3–5 high‑volume controls that generate repeatable evidence.',
          'Define evidence templates with required fields and owners.',
          'Connect workflow systems to capture events automatically.',
          'Set quality checks for completeness and data drift.',
          'Roll out dashboards to confirm evidence freshness weekly.',
        ],
      },
      {
        heading: 'Data quality checks that prevent gaps',
        paragraphs: [
          'Compliance automation only helps when evidence is trustworthy. Quality checks keep automated capture defensible.',
        ],
        bullets: [
          'Validation rules for timestamps and unique identifiers',
          'Duplicate detection and version control',
          'Alerts when evidence is missing or out of date',
        ],
      },
      {
        heading: 'Where to start with FormaOS',
        paragraphs: [
          'FormaOS automates evidence capture across your existing tools and provides a single audit‑ready view.',
          'Teams see only the tasks they need, while compliance leaders get reliable coverage metrics and ownership clarity.',
        ],
        links: [
          {
            label: 'Explore product workflows',
            href: '/product',
          },
        ],
      },
    ],
  },
  {
    id: 'governance-framework-design',
    title: 'Designing a Governance Framework That Actually Works',
    excerpt:
      'A governance framework should drive accountability and outcomes. Here is a practical approach to building one that teams will actually follow.',
    author: 'FormaOS Team',
    date: 'December 18, 2025',
    readTime: '8 min read',
    category: 'Compliance',
    heroImage: adminAccessHero,
    heroAlt: 'FormaOS admin governance screen with access controls',
    icon: FileCheck,
    sections: [
      {
        heading: 'Start with governance principles',
        paragraphs: [
          'Governance works when it is tied to outcomes: safer delivery, lower risk, and faster audits.',
          'Principles are the guardrails that guide decisions when policies are ambiguous.',
        ],
        bullets: [
          'Explicit accountability for every control',
          'Transparent decision trails for exceptions',
          'A feedback loop from audit results to process changes',
        ],
      },
      {
        heading: 'Translate policy into operational controls',
        paragraphs: [
          'Policies should describe intent. Controls describe execution.',
          'The bridge between them is a clearly defined workflow with owners, SLAs, and expected evidence.',
        ],
        bullets: [
          'Use a single control taxonomy across the company',
          'Limit control variations to reduce audit complexity',
          'Attach evidence requirements to each control',
        ],
      },
      {
        heading: 'Framework build steps',
        paragraphs: [
          'Treat the framework as a living system. Build in ownership, evidence, and review cadence from day one.',
        ],
        steps: [
          'Inventory your policy and procedure documents.',
          'Normalize common controls and remove duplicates.',
          'Assign owners and define control performance metrics.',
          'Map each control to required evidence artifacts.',
          'Publish a governance calendar for reviews and reporting.',
        ],
      },
      {
        heading: 'RACI clarity prevents drift',
        paragraphs: [
          'RBAC governance in tooling should mirror the RACI model, keeping decision‑makers and executors aligned.',
        ],
        bullets: [
          'Responsible: the person who executes the control',
          'Accountable: the leader who owns the outcome',
          'Consulted: subject matter experts for changes',
          'Informed: stakeholders who need visibility',
        ],
      },
      {
        heading: 'Funding and ROI conversations',
        paragraphs: [
          'A strong governance framework is easier to fund when it is linked to risk reduction and operational savings.',
          'Leaders respond to metrics, not just mandates, especially when audit readiness workflows show measurable progress.',
        ],
        links: [
          {
            label: 'Pricing and rollout plans',
            href: '/pricing',
          },
        ],
      },
    ],
  },
  {
    id: 'real-time-compliance-monitoring',
    title: 'Real-Time Compliance Monitoring: Beyond the Dashboard',
    excerpt:
      'Dashboards are not enough. Real‑time monitoring means alerts, ownership, and action. Here’s how to design monitoring that keeps you audit‑ready.',
    author: 'Product Team',
    date: 'December 4, 2025',
    readTime: '7 min read',
    category: 'Technology',
    heroImage: monitoringHero,
    heroAlt: 'FormaOS monitoring console with alerts and control health',
    icon: TrendingUp,
    sections: [
      {
        heading: 'Dashboards show, monitoring acts',
        paragraphs: [
          'A dashboard is passive. Monitoring is active—it triggers action when control health changes.',
          'The difference is the difference between reporting and preventing issues.',
        ],
        bullets: [
          'Define thresholds for control freshness and completion',
          'Attach escalation paths to each alert type',
          'Track time‑to‑resolution for every control issue',
        ],
      },
      {
        heading: 'Signals worth tracking',
        paragraphs: [
          'Not all signals are meaningful. Prioritize indicators tied directly to audit outcomes and regulatory requirements.',
        ],
        bullets: [
          'Evidence freshness for critical controls',
          'Exception volume and time to close',
          'Owner response time for escalations',
        ],
      },
      {
        heading: 'How to build monitoring that works',
        paragraphs: [
          'Monitoring works best when it is embedded in compliance automation and routed to the people who can act quickly.',
        ],
        steps: [
          'Identify the 10–15 most audit‑critical controls.',
          'Define signal thresholds and owners for each control.',
          'Automate alerts into the tools teams already use.',
          'Review signal trends in a weekly compliance stand‑up.',
          'Adjust thresholds after each audit cycle.',
        ],
      },
      {
        heading: 'Alerting and escalation patterns',
        paragraphs: [
          'Escalations should be predictable and visible, with RBAC governance ensuring the right owners can approve remediation.',
        ],
        bullets: [
          'Tiered severity to avoid alert fatigue',
          'Auto‑assigning issues to control owners',
          'Escalation to leadership if thresholds are breached',
        ],
      },
      {
        heading: 'Security alignment matters',
        links: [
          {
            label: 'Security posture details',
            href: '/security',
          },
        ],
        paragraphs: [
          'Monitoring is strongest when security, compliance, and operations share the same signals.',
          'The result is faster response and clearer accountability, especially when evidence is captured automatically.',
        ],
      },
    ],
  },
  {
    id: 'security-soc2-journey',
    title: 'Our SOC 2 Journey: Lessons Learned Building FormaOS',
    excerpt:
      'An inside look at how we achieved SOC 2 compliance—what we prioritized, where we struggled, and how we built repeatable evidence along the way.',
    author: 'Engineering Team',
    date: 'November 22, 2025',
    readTime: '9 min read',
    category: 'Security',
    heroImage: soc2Hero,
    heroAlt: 'FormaOS security view highlighting SOC 2 readiness work',
    icon: Shield,
    sections: [
      {
        heading: 'Scope, timeline, and expectations',
        paragraphs: [
          'We scoped our first SOC 2 to the Security and Availability trust services criteria.',
          'The goal was a timeline we could actually hit without disrupting delivery.',
          'The biggest challenge was not documentation—it was proving ongoing control execution with verifiable evidence.',
        ],
      },
      {
        heading: 'The gaps we discovered',
        bullets: [
          'Inconsistent access reviews across teams',
          'Vendor risk assessments stored in multiple tools',
          'Evidence captured after the fact rather than inline',
        ],
        paragraphs: [
          'We realized the gap was operational. Our policies were sound, but the evidence trail was fragmented.',
        ],
      },
      {
        heading: 'Our remediation plan',
        paragraphs: [
          'We treated remediation like compliance automation work, not a documentation sprint. Each step needed clear ownership and evidence.',
        ],
        steps: [
          'Centralize controls in a single taxonomy.',
          'Assign clear owners and define evidence requirements.',
          'Automate evidence capture from core systems.',
          'Run weekly control health reviews and log exceptions.',
          'Test audit reports quarterly to validate integrity.',
        ],
      },
      {
        heading: 'Evidence automation wins',
        paragraphs: [
          'Automated evidence capture reduced manual effort and gave auditors a clear trail of accountability.',
        ],
        bullets: [
          'Automated access review evidence from identity systems',
          'Deployment approvals captured from CI/CD workflows',
          'Immutable logs for key control events',
        ],
      },
      {
        heading: 'Takeaways for teams starting SOC 2',
        paragraphs: [
          'Treat SOC 2 as an operating system, not a once‑a‑year project.',
          'Build evidence capture into everyday workflows, keep ownership explicit, and use RBAC governance to protect control changes.',
        ],
        links: [
          {
            label: 'Product workflows',
            href: '/product',
          },
          {
            label: 'Security architecture',
            href: '/security',
          },
        ],
      },
    ],
  },
  {
    id: 'risk-based-controls-mapping',
    title: 'Risk‑Based Controls Mapping: A Practical Framework',
    excerpt:
      'Risk‑based mapping reduces duplication and focuses effort where it matters. Learn how to build a control map that scales across regulations.',
    author: 'Compliance Strategy',
    date: 'November 6, 2025',
    readTime: '8 min read',
    category: 'Compliance',
    heroImage: controlsMapHero,
    heroAlt: 'FormaOS control mapping view for risk-based oversight',
    icon: Layers,
    sections: [
      {
        heading: 'Why risk‑based mapping works',
        paragraphs: [
          'Treating every requirement equally leads to over‑engineering.',
          'Risk‑based mapping ensures you focus on controls that reduce the most exposure.',
        ],
        bullets: [
          'Aligns effort with actual regulatory and business risk',
          'Reduces duplication across frameworks',
          'Improves audit clarity and evidence reuse',
        ],
      },
      {
        heading: 'A repeatable mapping model',
        paragraphs: [
          'Start with a normalized control library, then map obligations to those controls.',
          'This creates a one‑to‑many relationship that reduces complexity and supports audit readiness workflows.',
        ],
        bullets: [
          'Define control objectives in plain language',
          'Score each obligation by impact and likelihood',
          'Map to controls and document evidence requirements',
        ],
      },
      {
        heading: 'How to map in five steps',
        paragraphs: [
          'A repeatable control map depends on consistent definitions and ownership. Compliance automation helps keep the map current between audits.',
        ],
        steps: [
          'Build a control inventory with owners and scope.',
          'Assign risk scores to each obligation.',
          'Map obligations to controls using a consistent rubric.',
          'Validate with stakeholders and revise for clarity.',
          'Publish the map and review quarterly.',
        ],
      },
      {
        heading: 'Common pitfalls to avoid',
        paragraphs: [
          'Most mapping failures happen after the first audit cycle when the map is not maintained.',
        ],
        bullets: [
          'Creating a unique control for every requirement',
          'Skipping stakeholder review',
          'Failing to update mapping after audits',
        ],
      },
      {
        heading: 'Tooling that supports mapping',
        paragraphs: [
          'A control map is only useful when it stays current. Tools that automate evidence capture and control health make the map a living asset.',
        ],
        links: [
          {
            label: 'Explore the platform',
            href: '/product',
          },
        ],
      },
    ],
  },
  {
    id: 'policy-lifecycle-automation',
    title: 'Policy Lifecycle Automation: From Draft to Audit',
    excerpt:
      'Policies fail when they drift. Learn how to automate the policy lifecycle—from drafting and approvals to ongoing reviews and evidence capture.',
    author: 'Product Updates',
    date: 'October 18, 2025',
    readTime: '7 min read',
    category: 'Product Updates',
    heroImage: policyLifecycleHero,
    heroAlt: 'FormaOS workflow screen for policy approvals and reviews',
    icon: ClipboardCheck,
    sections: [
      {
        heading: 'Why policy drift is so common',
        paragraphs: [
          'Policies often change without a consistent approval flow or review cadence.',
          'Over time, teams follow outdated guidance while auditors compare against the newest standard.',
        ],
        bullets: [
          'Policies stored in multiple locations',
          'Lack of automated review reminders',
          'No clear ownership for updates',
        ],
      },
      {
        heading: 'The lifecycle stages that matter',
        paragraphs: [
          'A mature policy lifecycle includes drafting, review, approval, publishing, and periodic reassessment.',
          'Each stage should produce evidence by default to support compliance automation.',
        ],
        bullets: [
          'Draft: collaboration and version history',
          'Review: stakeholder sign‑off tracking',
          'Publish: distribution and acknowledgment',
        ],
      },
      {
        heading: 'Automation steps to start today',
        paragraphs: [
          'Policy automation should connect to audit readiness workflows so approvals and acknowledgments are always traceable.',
        ],
        steps: [
          'Set a policy review cadence and owner for every policy.',
          'Automate approvals with time‑boxed reminders.',
          'Capture acknowledgment evidence from staff systems.',
          'Link policies to controls and audit checklists.',
          'Track exceptions and update policies after audits.',
        ],
      },
      {
        heading: 'Change management practices',
        paragraphs: [
          'RBAC governance keeps policy changes restricted to authorized owners while still enabling collaboration.',
        ],
        bullets: [
          'Notify teams of material changes',
          'Require acknowledgment for high‑risk updates',
          'Keep audit logs of edits and approvals',
        ],
      },
      {
        heading: 'Roadmap and rollout options',
        links: [
          {
            label: 'Pricing and rollout plans',
            href: '/pricing',
          },
        ],
        paragraphs: [
          'Policy lifecycle automation is one of the fastest ways to reduce audit risk. It brings governance into the operational flow, where it belongs.',
        ],
      },
    ],
  },
  {
    id: 'vendor-risk-management-playbook',
    title: 'Vendor Risk Management Playbook for Fast‑Growing Teams',
    excerpt:
      'A vendor program should scale with growth. This playbook covers tiering, evidence requirements, and how to keep third‑party risk visible.',
    author: 'Security Team',
    date: 'September 28, 2025',
    readTime: '8 min read',
    category: 'Security',
    heroImage: vendorRiskHero,
    heroAlt: 'FormaOS vendor invite and access workflow screen',
    icon: Lock,
    sections: [
      {
        heading: 'Why vendor risk escalates quickly',
        paragraphs: [
          'As teams move faster, they onboard more vendors.',
          'Each vendor adds data exposure, access, and regulatory obligations. Without a structured program, risk compounds.',
        ],
      },
      {
        heading: 'Tiering vendors with a simple model',
        bullets: [
          'Tier 1: access to sensitive data or core systems',
          'Tier 2: operational tools with limited data exposure',
          'Tier 3: low‑risk services with no sensitive access',
        ],
        paragraphs: [
          'Tiering keeps due diligence proportional. High‑risk vendors get deeper review and ongoing monitoring.',
        ],
      },
      {
        heading: 'Build the program in five steps',
        paragraphs: [
          'A repeatable workflow with clear owners is essential. RBAC governance ensures only approved stakeholders can sign off on vendor risk decisions.',
        ],
        steps: [
          'Define data classification and access requirements.',
          'Assign vendor tiers based on impact and exposure.',
          'Collect baseline evidence (SOC reports, policies).',
          'Track remediation and renewal checkpoints.',
          'Review the program quarterly and adjust tiers.',
        ],
      },
      {
        heading: 'Evidence checklist for audits',
        paragraphs: [
          'Keep evidence current and tied to control owners so audit readiness workflows are continuous.',
        ],
        bullets: [
          'Signed vendor agreements and DPAs',
          'Security questionnaires and remediation plans',
          'Annual reviews with documented approvals',
        ],
      },
      {
        heading: 'Visibility with FormaOS',
        paragraphs: [
          'FormaOS centralizes vendor evidence and links it to compliance controls, so audits no longer require a manual hunt across tools.',
          'Automated evidence capture keeps vendor reviews current without extra coordination overhead.',
        ],
        links: [
          {
            label: 'Security overview',
            href: '/security',
          },
          {
            label: 'Product workflows',
            href: '/product',
          },
        ],
      },
    ],
  },
  {
    id: 'data-retention-privacy-controls',
    title: 'Data Retention and Privacy Controls That Auditors Trust',
    excerpt:
      'Retention policies and privacy controls are under increasing scrutiny. Learn how to define retention rules, automate enforcement, and keep evidence defensible.',
    author: 'Compliance Team',
    date: 'September 10, 2025',
    readTime: '8 min read',
    category: 'Compliance',
    heroImage: retentionHero,
    heroAlt: 'FormaOS evidence workflow for retention and approvals',
    icon: BookOpen,
    sections: [
      {
        heading: 'Retention is more than a policy',
        paragraphs: [
          'Retention policies only matter if they are enforced consistently.',
          'Auditors look for proof that retention rules are applied across systems and teams.',
        ],
        bullets: [
          'Clear retention schedules by data type',
          'Consistent deletion workflows',
          'Evidence of exceptions and approvals',
        ],
      },
      {
        heading: 'Privacy controls that show intent',
        paragraphs: [
          'Privacy controls should demonstrate least‑privilege access, controlled sharing, and prompt incident response.',
          'The evidence must show ongoing compliance, not just design intent.',
        ],
        bullets: [
          'Access reviews tied to role changes',
          'Consent management with audit trails',
          'Incident response records within required timelines',
        ],
      },
      {
        heading: 'How to operationalize retention',
        paragraphs: [
          'Operational retention depends on automation and clear accountability. Automated evidence capture makes retention actions defensible.',
        ],
        steps: [
          'Define data categories and owners for each system.',
          'Create retention schedules aligned to regulations.',
          'Automate deletion and retention events where possible.',
          'Log exceptions with approvals and reasons.',
          'Review schedules annually and after audits.',
        ],
      },
      {
        heading: 'Make privacy evidence audit‑ready',
        paragraphs: [
          'Audit readiness workflows should surface privacy evidence continuously, not just during reviews.',
        ],
        bullets: [
          'Proof of deletion logs and timestamps',
          'Data access review logs with reviewer identity',
          'Customer request handling metrics',
        ],
      },
      {
        heading: 'Where FormaOS helps',
        links: [
          {
            label: 'Explore product workflows',
            href: '/product',
          },
          {
            label: 'Security posture',
            href: '/security',
          },
        ],
        paragraphs: [
          'FormaOS unifies retention evidence across teams and keeps a verified trail for audit defense.',
          'RBAC governance ensures retention exceptions are reviewed and approved by the right owners.',
        ],
      },
    ],
  },
];

export const featuredPost =
  blogPosts.find((post) => post.featured) ?? blogPosts[0];

export const getCategoryId = (category: string) =>
  category.toLowerCase().replace(/\s+/g, '-');

export const getCategoryCounts = (posts: BlogPost[]) => {
  const counts = posts.reduce<Record<string, number>>((acc, post) => {
    const key = getCategoryId(post.category);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return [
    { id: 'all', name: 'All Posts', count: posts.length },
    ...Object.entries(counts).map(([id, count]) => ({
      id,
      name:
        posts.find((post) => getCategoryId(post.category) === id)?.category ??
        id,
      count,
    })),
  ];
};
