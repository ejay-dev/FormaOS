'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  Mail,
  Phone,
  Clock,
  ArrowRight,
  Send,
  Shield,
  Building2,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import CinematicField from '../components/motion/CinematicField';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

// ============================================================================
// HERO SECTION
// ============================================================================

function ContactHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-purple-500/15 via-indigo-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1 opacity-40">
        <CinematicField />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 mb-8 backdrop-blur-sm"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium tracking-wide">
                Contact
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Let&apos;s Talk About Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-purple-500 bg-clip-text text-transparent">
                Compliance Strategy
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-3xl mx-auto text-center leading-relaxed"
            >
              Whether you&apos;re exploring FormaOS, preparing for audits, or
              designing governance at scale, our team is here to help.
            </motion.p>

            {/* Support Line */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-base text-gray-500 mb-10 max-w-2xl mx-auto text-center"
            >
              We work with regulated organizations that require precision,
              accountability, and operational proof.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="#demo-form"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-medium transition-all duration-300"
              >
                Request a Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#contact-info"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all duration-300"
              >
                Contact Our Team
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-gray-600/50 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// CONTACT INFORMATION SECTION
// ============================================================================

function ContactInformation() {
  return (
    <section id="contact-info" className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Direct Contact
          </h2>
        </motion.div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
            <a
              href="mailto:formaos.team@gmail.com"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              formaos.team@gmail.com
            </a>
          </motion.div>

          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl"
          >
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
          </motion.div>

          {/* Availability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Availability
            </h3>
            <p className="text-gray-400">Monday – Friday</p>
            <p className="text-gray-400">9:00 AM – 6:00 PM (AEST)</p>
          </motion.div>
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
  searchParams?: {
    success?: string;
    error?: string;
  };
};

function ContactForm({ submitAction, searchParams }: ContactFormProps) {
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
    <section
      id="demo-form"
      className="relative py-32 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="p-8 sm:p-12 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl"
        >
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
          {searchParams?.success && (
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

          {searchParams?.error && (
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
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// ENTERPRISE INQUIRIES
// ============================================================================

function EnterpriseInquiries() {
  return (
    <section className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center p-12 rounded-2xl bg-gradient-to-br from-purple-500/20 via-white/[0.08] to-white/[0.04] border border-purple-500/30 backdrop-blur-xl"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-purple-500/20 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Enterprise & Partnership Requests
          </h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            For large-scale deployments, compliance architecture discussions, or
            strategic partnerships, contact us directly.
          </p>
          <a
            href="mailto:formaos.team@gmail.com"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium text-lg transition-colors"
          >
            <Mail className="w-5 h-5" />
            formaos.team@gmail.com
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// SECURITY & TRUST STATEMENT
// ============================================================================

function SecurityTrust() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
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
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// CLOSING CTA
// ============================================================================

function ClosingCTA() {
  return (
    <section className="relative py-32 bg-[#0a0f1c]">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
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
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

type ContactPageContentProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
  submitAction: (formData: FormData) => Promise<void>;
};

export default function ContactPageContent({
  searchParams,
  submitAction,
}: ContactPageContentProps) {
  return (
    <div className="relative">
      <ContactHero />
      <ContactInformation />
      <ContactForm submitAction={submitAction} searchParams={searchParams} />
      <EnterpriseInquiries />
      <SecurityTrust />
      <ClosingCTA />
    </div>
  );
}
