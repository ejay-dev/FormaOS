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

// ============================================================================
// HERO SECTION
// ============================================================================

function ContactHero() {
  return (
    <ImmersiveHero
      theme="contact"
      visualContent={<ContactHeroVisual />}
      badge={{ icon: <Mail className="w-4 h-4 text-blue-400" />, text: 'Contact', colorClass: 'blue' }}
      headline={<>Let&apos;s Talk About Your<br /><span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-purple-500 bg-clip-text text-transparent">Compliance Strategy</span></>}
      subheadline="Whether you're exploring FormaOS, preparing for audits, or designing governance at scale, our team is here to help."
      extras={<p className="text-base text-gray-500 max-w-2xl mx-auto text-center">We work with regulated organizations that require precision, accountability, and operational proof.</p>}
      primaryCta={{ href: '#demo-form', label: 'Request a Demo' }}
      secondaryCta={{ href: '#contact-info', label: 'Contact Our Team' }}
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
                href="mailto:hello@formaos.com.au"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                hello@formaos.com.au
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
            Start the Conversation
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Tell us about your organization, your regulatory environment, and
            what you&apos;re trying to achieve. A FormaOS specialist will
            respond promptly.
          </p>
        </ScrollReveal>

        {/* Form Card */}
        <ScrollReveal variant="perspectiveUp" range={[0.04, 0.34]}>
          <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl">
            <form action={handleSubmit} className="space-y-6">
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
                    className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="you@organization.com"
                  />
                </div>
              </div>

              {/* Organization & Industry Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
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
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  placeholder="Tell us about your compliance challenges and goals..."
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
                    Send Message
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
                  ✅ Thank you! We&apos;ll be in touch within 24 hours.
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
  return (
    <section className="mk-section relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="depthSlide" range={[0, 0.3]}>
          <div className="text-center p-12 rounded-2xl bg-gradient-to-br from-purple-500/20 via-white/[0.08] to-white/[0.04] border border-purple-500/30 backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Enterprise & Partnership Requests
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              For large-scale deployments, compliance architecture discussions,
              or strategic partnerships, contact us directly.
            </p>
            <a
              href="mailto:hello@formaos.com.au"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium text-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              hello@formaos.com.au
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
        <ScrollReveal variant="perspectiveUp" range={[0, 0.3]} className="text-center">
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
  return (
    <section className="mk-section relative">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <ScrollReveal variant="depthScale" range={[0, 0.3]}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Operational Compliance Starts With
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
              the Right Conversation
            </span>
          </h2>

          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Whether you&apos;re early in your compliance transformation or
            managing complex regulatory operations, we&apos;re here to help you
            build systems that enforce accountability and prove outcomes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="#demo-form"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-medium transition-all duration-300"
            >
              Request a Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`${appBase}/auth/signup`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all duration-300"
            >
              Start Free Trial
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
      <DeferredSection minHeight={300}>
        <ContactInformation />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={500}>
        <ContactForm submitAction={submitAction} />
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
