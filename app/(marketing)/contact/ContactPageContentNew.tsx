'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  Phone,
  Clock,
  ArrowRight,
  Send,
  Shield,
  Building2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { demoHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';

type ContactIntent =
  | 'general'
  | 'pricing'
  | 'enterprise'
  | 'procurement'
  | 'compliance-plan'
  | 'demo'
  | 'sales'
  | 'assessment'
  | 'security-review'
  | 'case-study'
  | 'expert';

type SearchParamReader = {
  get(name: string): string | null;
};

type ContactIntentCopy = {
  badge: string;
  headline: string;
  subheadline: string;
  intro: string;
  formTitle: string;
  formBody: string;
  submitLabel: string;
  closingTitle: string;
  closingBody: string;
  secondaryHref: string;
  secondaryLabel: string;
};

const CONTACT_INTENT_COPY = {
  general: {
    badge: 'Contact',
    headline: 'Talk to the FormaOS Team',
    subheadline:
      'Speak with FormaOS about rollout, security review, and enterprise governance design.',
    intro:
      'We work with regulated organizations that require precision, accountability, and operational proof.',
    formTitle: 'Start the conversation',
    formBody:
      "Tell us about your organization, your regulatory environment, and what you're trying to achieve.",
    submitLabel: 'Talk to Sales',
    closingTitle: 'Operational compliance starts with the right conversation',
    closingBody:
      "Whether you're early in your compliance transformation or managing complex regulated operations, we'll help you find the right path.",
    secondaryHref: demoHref('contact_general'),
    secondaryLabel: PUBLIC_CTA_LABELS.bookDemo,
  },
  pricing: {
    badge: 'Pricing & Plans',
    headline: 'Find the Right Plan and Rollout Path',
    subheadline:
      'Talk through plan fit, team scope, and when to move from Foundation into guided Growth or Enterprise review.',
    intro:
      'Foundation is assessment-led. Growth and Enterprise buyers can run a guided review without losing momentum.',
    formTitle: 'Tell us what you need from pricing',
    formBody:
      'Share the team shape, plan questions, and rollout expectations you want to validate.',
    submitLabel: 'Request Pricing Review',
    closingTitle: 'Choose the buying path that matches your compliance risk',
    closingBody:
      'We can help you decide whether Foundation is enough or whether your team should move into Growth or Enterprise evaluation.',
    secondaryHref: '/pricing',
    secondaryLabel: 'Back to Pricing',
  },
  enterprise: {
    badge: 'Enterprise Evaluation',
    headline: 'Run an Enterprise Review Without Narrative Drift',
    subheadline:
      'Bring rollout, security review, identity requirements, and procurement into one guided conversation.',
    intro:
      'Enterprise buyers need more than a demo. We help teams connect product fit, trust review, and rollout planning early.',
    formTitle: 'Start an enterprise evaluation',
    formBody:
      'Tell us about deployment scope, stakeholders, and the controls your review team needs to validate.',
    submitLabel: 'Request Enterprise Review',
    closingTitle: 'Move from product fit to buyer confidence',
    closingBody:
      'FormaOS is strongest when operators, security reviewers, and procurement teams can work from the same evaluation path.',
    secondaryHref: '/enterprise',
    secondaryLabel: 'Back to Enterprise',
  },
  procurement: {
    badge: 'Procurement & Security Review',
    headline: 'Bring Security, Legal, and Procurement Into One Review Path',
    subheadline:
      'Use this path when you need the buyer-facing materials, operating context, and rollout answers that typically slow deals down.',
    intro:
      'This flow is tuned for enterprise review rather than a generic demo request.',
    formTitle: 'Start a procurement conversation',
    formBody:
      'Share the review scope, documents you need, and any security or contracting requirements already in motion.',
    submitLabel: 'Start Procurement Review',
    closingTitle: 'Reduce handoff friction during buyer review',
    closingBody:
      'We can route your request around security review, buyer documentation, rollout planning, and the right product walkthrough.',
    secondaryHref: '/security-review',
    secondaryLabel: 'Open Security Review',
  },
  'compliance-plan': {
    badge: 'Compliance Plan',
    headline: 'Scope a Compliance Plan for Your Regulated Operation',
    subheadline:
      'Talk through team shape, frameworks in scope, and how FormaOS enforces the evidence your auditors will ask for.',
    intro:
      'Growth buyers use this path when they already know Foundation is too small and need a guided rollout.',
    formTitle: 'Scope your compliance plan',
    formBody:
      'Tell us your team size, frameworks (NDIS, AHPRA, ISO, SOC 2, HIPAA), and rollout timeline.',
    submitLabel: PUBLIC_CTA_LABELS.compliancePlan,
    closingTitle: 'Match the plan to your operating risk',
    closingBody:
      "We'll help you choose the plan that matches your exposure, then hand off to a specialist for rollout.",
    secondaryHref: '/pricing',
    secondaryLabel: 'Back to Pricing',
  },
  demo: {
    badge: 'Product Walkthrough',
    headline: 'See FormaOS Enforce Compliance in Real Operations',
    subheadline:
      'Book a walkthrough of the exact workflows your team uses today — evidence, approvals, and the checks that happen before anything counts.',
    intro:
      'Demos are tailored to your framework and role, not a generic product tour.',
    formTitle: 'Book a walkthrough',
    formBody:
      'Share your framework, role, and the scenario you want to see enforced end-to-end.',
    submitLabel: PUBLIC_CTA_LABELS.bookDemo,
    closingTitle: 'Walk through the workflows your team actually runs',
    closingBody:
      "We'll map the walkthrough to the workflows you actually run, so you can judge fit in one session.",
    secondaryHref: '/pricing',
    secondaryLabel: 'See Pricing',
  },
  sales: {
    badge: 'Talk to Sales',
    headline: 'Talk to Sales About Rollout and Commercial Fit',
    subheadline:
      'Direct line to a FormaOS specialist for rollout scope, commercial terms, and multi-entity deployments.',
    intro:
      'Use this path when you need a commercial answer, not a product tour.',
    formTitle: 'Open a sales conversation',
    formBody:
      'Tell us the scope, stakeholders, and timeline. We route to the right specialist.',
    submitLabel: PUBLIC_CTA_LABELS.talkToSales,
    closingTitle: 'Get a commercial answer without a demo loop',
    closingBody:
      "We'll scope the commercials and only bring in product walkthroughs when your review needs them.",
    secondaryHref: demoHref('contact_sales'),
    secondaryLabel: PUBLIC_CTA_LABELS.bookDemo,
  },
  assessment: {
    badge: 'Compliance Assessment',
    headline: 'Run a Compliance Assessment Against Your Current Operation',
    subheadline:
      'Map your existing evidence, gaps, and framework exposure before committing to a rollout path.',
    intro:
      'Assessments are useful when you need to justify the compliance spend internally.',
    formTitle: 'Request an assessment',
    formBody:
      "Share the frameworks in scope and what evidence your auditors are asking for that you can't produce today.",
    submitLabel: PUBLIC_CTA_LABELS.startAssessment,
    closingTitle: "Know your exposure before you buy",
    closingBody:
      "We'll produce a clear view of gaps, controls needed, and the plan fit that matches your risk.",
    secondaryHref: '/pricing',
    secondaryLabel: 'See Pricing',
  },
  'security-review': {
    badge: 'Security Review',
    headline: 'Run a Security Review Against FormaOS',
    subheadline:
      'Get the security documentation, control mappings, and architecture answers your review team needs without chasing sales.',
    intro:
      'Security reviews get direct access to our trust packet and a technical contact.',
    formTitle: 'Book a security review',
    formBody:
      'Tell us your review scope: data classification, identity requirements, and the frameworks your security team validates against.',
    submitLabel: PUBLIC_CTA_LABELS.securityReview,
    closingTitle: 'Close security review without narrative drift',
    closingBody:
      "We'll route your request to the trust packet, technical contact, and any follow-ups your review team needs.",
    secondaryHref: '/trust',
    secondaryLabel: 'Open Trust Center',
  },
  'case-study': {
    badge: 'Proof Pack Walkthrough',
    headline: 'Walk Through a Representative Proof Pack',
    subheadline:
      'See how a regulated team produced the exact evidence their audit required — workflow trail, approvals, and the enforcement layer behind it.',
    intro:
      'Proof packs are representative — we walk you through how the evidence was produced, not just what it looks like.',
    formTitle: 'Request a proof walkthrough',
    formBody:
      "Tell us your framework and the evidence you're trying to produce. We'll match you to a relevant proof pack.",
    submitLabel: 'Request Proof Walkthrough',
    closingTitle: 'See the evidence path, not just the outcome',
    closingBody:
      "We'll walk you through how a regulated team produced the evidence, so you can judge whether FormaOS fits your audit cycle.",
    secondaryHref: '/case-studies',
    secondaryLabel: 'Back to Proof Packs',
  },
  expert: {
    badge: 'Talk to a Specialist',
    headline: 'Talk to a FormaOS Specialist About Plan Fit',
    subheadline:
      'Use this path when you want a specialist to validate which plan matches your exposure before you buy.',
    intro:
      'Specialists focus on plan fit, not a generic demo.',
    formTitle: 'Ask a specialist',
    formBody:
      'Share your team shape, frameworks, and the plan you think fits. A specialist will validate or redirect.',
    submitLabel: 'Ask a Specialist',
    closingTitle: 'Validate plan fit before you commit',
    closingBody:
      "We'll either confirm the plan matches your risk or route you to the right alternative.",
    secondaryHref: '/pricing',
    secondaryLabel: 'Back to Pricing',
  },
} as const satisfies Record<ContactIntent, ContactIntentCopy>;

function resolveContactIntent(searchParams: SearchParamReader): ContactIntent {
  const raw = (searchParams.get('type') ?? '').toLowerCase();
  switch (raw) {
    case 'pricing':
    case 'enterprise':
    case 'procurement':
    case 'compliance-plan':
    case 'demo':
    case 'sales':
    case 'assessment':
    case 'security-review':
    case 'case-study':
    case 'expert':
      return raw;
    default:
      return 'general';
  }
}

function contactErrorMessage(code: string | null): string {
  switch (code) {
    case 'rate_limit':
      return '❌ Too many submissions from this network. Please wait a few minutes before trying again.';
    case 'invalid_email':
      return '❌ That email address doesn’t look right. Please check it and try again.';
    case '1':
    default:
      return '❌ We could not submit your message. Please check the required fields and try again, or email us directly.';
  }
}

function defaultPrimaryNeedForIntent(intent: ContactIntent): string {
  switch (intent) {
    case 'procurement':
    case 'security-review':
      return 'security_review';
    case 'enterprise':
      return 'enterprise_rollout';
    case 'pricing':
    case 'compliance-plan':
    case 'assessment':
    case 'expert':
      return 'plan_fit';
    case 'demo':
    case 'case-study':
    case 'sales':
    case 'general':
      return '';
  }
}

// ============================================================================
// HERO SECTION
// ============================================================================

function ContactHero() {
  const searchParams = useSearchParams();
  const intent = resolveContactIntent(searchParams);
  const copy = CONTACT_INTENT_COPY[intent];

  return (
    <ImmersiveHero
      className="contact-hero--focused"
      theme="contact"
      badge={{
        icon: <Mail className="w-4 h-4 text-blue-400" />,
        text: copy.badge,
        colorClass: 'blue',
      }}
      headline={copy.headline}
      subheadline={copy.subheadline}
      extras={
        <p className="text-base text-gray-500 max-w-2xl mx-auto text-center">
          {copy.intro}
        </p>
      }
      primaryCta={{ href: '#demo-form', label: copy.submitLabel }}
      secondaryCta={{ href: copy.secondaryHref, label: copy.secondaryLabel }}
    />
  );
}

// ============================================================================
// CONTACT INFORMATION SECTION
// ============================================================================

function ContactInformation() {
  return (
    <section id="contact-info" className="mk-section mk-section--compact relative">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <ScrollReveal
          variant="blurIn"
          range={[0, 0.3]}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Direct Contact
          </h2>
        </ScrollReveal>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Email */}
          <ScrollReveal variant="depthSlide" range={[0, 0.3]}>
            <div className="text-center p-5 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
              <a
                href="mailto:support@formaos.com.au"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                support@formaos.com.au
              </a>
            </div>
          </ScrollReveal>

          {/* Phone */}
          <ScrollReveal variant="perspectiveUp" range={[0.04, 0.34]}>
            <div className="text-center p-5 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                <Phone className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Phone</h3>
              <a
                href="tel:+61469715062"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                +61 469 715 062
              </a>
            </div>
          </ScrollReveal>

          {/* Availability */}
          <ScrollReveal variant="depthSlide" range={[0.08, 0.38]}>
            <div className="text-center p-5 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Availability
              </h3>
              <p className="text-gray-400">Monday – Friday</p>
              <p className="text-gray-400">9:00 AM – 6:00 PM (AEST)</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CONTACT FORM SECTION
// ============================================================================

type ContactFormProps = {
  submitAction: (formData: FormData) => Promise<void>;
};

function ContactForm({ submitAction }: ContactFormProps) {
  const searchParams = useSearchParams();
  const intent = resolveContactIntent(searchParams);
  const copy = CONTACT_INTENT_COPY[intent];
  const plan = searchParams.get('plan') ?? '';
  const source = searchParams.get('source') ?? '';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      await submitAction(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="demo-form" className="mk-section relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <ScrollReveal
          variant="blurIn"
          range={[0, 0.3]}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {copy.formTitle}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {copy.formBody} A FormaOS specialist will respond promptly.
          </p>
        </ScrollReveal>

        {/* Form Card */}
        <ScrollReveal variant="perspectiveUp" range={[0.04, 0.34]}>
          <div className="p-5 sm:p-8 md:p-12 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
            <form action={handleSubmit} className="space-y-6">
              <input type="hidden" name="inquiryType" value={intent} />
              <input type="hidden" name="source" value={source} />
              <input type="hidden" name="plan" value={plan} />

              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    Inquiry path
                  </p>
                  <p className="mt-2 text-sm text-white capitalize">{intent}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    Plan in view
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {plan || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                    Source
                  </p>
                  <p className="mt-2 text-sm text-white">
                    {source || 'Direct contact'}
                  </p>
                </div>
              </div>

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Work Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    maxLength={254}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="you@organization.com"
                  />
                </div>
              </div>

              {/* Organization & Industry Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="organization"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Organization *
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    required
                    maxLength={200}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Your organization name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="industry"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Industry
                  </label>
                  <select
                    id="industry"
                    name="industry"
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="" className="bg-[#0a0f1c]">
                      Select industry
                    </option>
                    <option value="healthcare" className="bg-[#0a0f1c]">
                      Healthcare
                    </option>
                    <option value="ndis" className="bg-[#0a0f1c]">
                      NDIS
                    </option>
                    <option value="finance" className="bg-[#0a0f1c]">
                      Finance
                    </option>
                    <option value="education" className="bg-[#0a0f1c]">
                      Education
                    </option>
                    <option value="government" className="bg-[#0a0f1c]">
                      Government
                    </option>
                    <option value="other" className="bg-[#0a0f1c]">
                      Other
                    </option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="primaryNeed"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Primary Need
                  </label>
                  <select
                    id="primaryNeed"
                    name="primaryNeed"
                    defaultValue={defaultPrimaryNeedForIntent(intent)}
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="" className="bg-[#0a0f1c]">
                      Select focus
                    </option>
                    <option value="plan_fit" className="bg-[#0a0f1c]">
                      Plan fit and pricing
                    </option>
                    <option value="enterprise_rollout" className="bg-[#0a0f1c]">
                      Enterprise rollout
                    </option>
                    <option value="security_review" className="bg-[#0a0f1c]">
                      Security or procurement review
                    </option>
                    <option value="migration" className="bg-[#0a0f1c]">
                      Migration and implementation
                    </option>
                    <option value="general" className="bg-[#0a0f1c]">
                      General inquiry
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="timeline"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Desired Timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="" className="bg-[#0a0f1c]">
                    Select timeline
                  </option>
                  <option value="this_month" className="bg-[#0a0f1c]">
                    This month
                  </option>
                  <option value="this_quarter" className="bg-[#0a0f1c]">
                    This quarter
                  </option>
                  <option value="next_quarter" className="bg-[#0a0f1c]">
                    Next quarter
                  </option>
                  <option value="researching" className="bg-[#0a0f1c]">
                    Still researching
                  </option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Tell us about your requirements, review stakeholders, and what you need to validate..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:bg-blue-700/50 text-white font-medium transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    {copy.submitLabel}
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Trust Note */}
              <p className="text-center text-sm text-gray-500">
                Your information is handled securely and never shared.
              </p>
            </form>

            {/* Status Messages */}
            {searchParams.get('success') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
              >
                <p className="text-emerald-400 text-sm text-center">
                  Thank you. We&apos;ll route this to the right FormaOS team and
                  follow up shortly.
                </p>
              </motion.div>
            )}

            {searchParams.get('error') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <p className="text-red-400 text-sm text-center">
                  {contactErrorMessage(searchParams.get('error'))}
                </p>
              </motion.div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ============================================================================
// ENTERPRISE INQUIRIES
// ============================================================================

function EnterpriseInquiries() {
  const searchParams = useSearchParams();
  const intent = resolveContactIntent(searchParams);

  return (
    <section className="mk-section mk-section--compact relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="depthSlide" range={[0, 0.3]}>
          <div className="text-center p-6 sm:p-8 md:p-12 rounded-2xl bg-gradient-to-br from-purple-500/20 via-white/[0.08] to-white/[0.04] border border-purple-500/30 backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              {intent === 'procurement' || intent === 'security-review'
                ? 'Procurement and Security Review Requests'
                : intent === 'case-study'
                  ? 'Proof Pack and Case Study Requests'
                  : 'Enterprise and Partnership Requests'}
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              {intent === 'procurement' || intent === 'security-review'
                ? 'If your review already needs direct coordination with legal, security, or procurement stakeholders, email us directly.'
                : intent === 'case-study'
                  ? 'If you need a proof walkthrough aligned to a specific framework or auditor question, email us directly.'
                  : 'For large-scale deployments, compliance architecture discussions, or strategic partnerships, contact us directly.'}
            </p>
            <a
              href="mailto:support@formaos.com.au"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium text-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              support@formaos.com.au
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ============================================================================
// SECURITY & TRUST STATEMENT
// ============================================================================

function SecurityTrust() {
  return (
    <section className="mk-section mk-section--compact relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal
          variant="perspectiveUp"
          range={[0, 0.3]}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Secure by Design
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            All communications are handled in line with our security and privacy
            standards. FormaOS is built for regulated environments where
            confidentiality, data integrity, and auditability are essential.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ============================================================================
// CLOSING CTA
// ============================================================================

function ClosingCTA() {
  const searchParams = useSearchParams();
  const intent = resolveContactIntent(searchParams);
  const copy = CONTACT_INTENT_COPY[intent];

  return (
    <section className="mk-section mk-section--compact relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <ScrollReveal variant="depthScale" range={[0, 0.3]}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            {copy.closingTitle} <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
              with FormaOS
            </span>
          </h2>

          <p className="text-base sm:text-lg text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto">
            {copy.closingBody}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#demo-form"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-medium transition-all duration-300 w-full sm:w-auto justify-center"
            >
              {copy.submitLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={copy.secondaryHref}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all duration-300 w-full sm:w-auto justify-center"
            >
              {copy.secondaryLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

type ContactPageContentProps = {
  submitAction: (formData: FormData) => Promise<void>;
};

export default function ContactPageContent({
  submitAction,
}: ContactPageContentProps) {
  return (
    <MarketingPageShell>
      <ContactHero />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={500}>
        <ContactForm submitAction={submitAction} />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={300}>
        <ContactInformation />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={250}>
        <EnterpriseInquiries />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={200}>
        <SecurityTrust />
      </DeferredSection>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>
      <DeferredSection minHeight={250}>
        <ClosingCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
