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
import { ContactHeroVisual } from './components/ContactHeroVisual';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

type ContactIntent = 'general' | 'pricing' | 'enterprise' | 'procurement';

type SearchParamReader = {
  get(name: string): string | null;
};

const CONTACT_INTENT_COPY: Record<
  ContactIntent,
  {
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
  }
> = {
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
    secondaryHref: `${appBase}/auth/signup`,
    secondaryLabel: 'Start Free Trial',
  },
  pricing: {
    badge: 'Pricing & Plans',
    headline: 'Find the Right Plan and Rollout Path',
    subheadline:
      'Talk through plan fit, team scope, and when to move from self-serve into guided enterprise review.',
    intro:
      'Starter and Professional are self-serve. Enterprise buyers can run a guided review without losing momentum.',
    formTitle: 'Tell us what you need from pricing',
    formBody:
      'Share the team shape, plan questions, and rollout expectations you want to validate.',
    submitLabel: 'Request Pricing Review',
    closingTitle: 'Choose the buying path that matches your compliance risk',
    closingBody:
      'We can help you decide whether self-serve is enough or whether your team should move into enterprise evaluation.',
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
};

function resolveContactIntent(searchParams: SearchParamReader): ContactIntent {
  const raw = (searchParams.get('type') ?? '').toLowerCase();
  if (raw === 'pricing') return 'pricing';
  if (raw === 'enterprise') return 'enterprise';
  if (raw === 'procurement') return 'procurement';
  return 'general';
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
      visualContent={<ContactHeroVisual />}
      badge={{
        icon: <Mail className="w-4 h-4 text-blue-400" />,
        text: copy.badge,
        colorClass: 'blue',
      }}
      headline={
        <>
          {copy.headline} <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
            for Regulated Operations
          </span>
        </>
      }
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
    <section id="contact-info" className="mk-section relative">
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
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
              <a
                href="mailto:Formaos.team@gmail.com"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Formaos.team@gmail.com
              </a>
            </div>
          </ScrollReveal>

          {/* Phone */}
          <ScrollReveal variant="perspectiveUp" range={[0.04, 0.34]}>
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
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
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
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
                  <p className="mt-2 text-sm text-white capitalize">
                    {intent}
                  </p>
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
                    defaultValue={
                      intent === 'procurement'
                        ? 'security_review'
                        : intent === 'enterprise'
                          ? 'enterprise_rollout'
                          : intent === 'pricing'
                            ? 'plan_fit'
                            : ''
                    }
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
                className="w-full py-4 px-6 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white font-medium transition-all duration-300 flex items-center justify-center gap-2"
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
                  ❌ Something went wrong. Please try again or contact us
                  directly.
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
    <section className="mk-section relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="depthSlide" range={[0, 0.3]}>
          <div className="text-center p-6 sm:p-8 md:p-12 rounded-2xl bg-gradient-to-br from-purple-500/20 via-white/[0.08] to-white/[0.04] border border-purple-500/30 backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              {intent === 'procurement'
                ? 'Procurement and Security Review Requests'
                : 'Enterprise and Partnership Requests'}
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              {intent === 'procurement'
                ? 'If your review already needs direct coordination with legal, security, or procurement stakeholders, email us directly.'
                : 'For large-scale deployments, compliance architecture discussions, or strategic partnerships, contact us directly.'}
            </p>
            <a
              href="mailto:Formaos.team@gmail.com"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium text-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              Formaos.team@gmail.com
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
    <section className="mk-section relative">
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
    <section className="mk-section relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <ScrollReveal variant="depthScale" range={[0, 0.3]}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            {copy.closingTitle}{' '}
            <br className="hidden sm:block" />
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
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-medium transition-all duration-300 w-full sm:w-auto justify-center"
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
      <VisualDivider gradient />
      <DeferredSection minHeight={500}>
        <ContactForm submitAction={submitAction} />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={300}>
        <ContactInformation />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={250}>
        <EnterpriseInquiries />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={200}>
        <SecurityTrust />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={250}>
        <ClosingCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
