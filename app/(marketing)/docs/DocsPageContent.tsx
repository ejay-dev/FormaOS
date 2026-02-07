'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  Search,
  Rocket,
  Layers,
  Shield,
  Plug,
  Settings,
  Headphones,
  ChevronRight,
  ChevronDown,
  FileText,
  Code,
  Terminal,
  Database,
  Lock,
  Users,
  Workflow,
  BarChart3,
  Bell,
  Key,
  Globe,
  Zap,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  PlayCircle,
  BookMarked,
} from 'lucide-react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';

// ============================================================================
// DOCUMENTATION DATA
// ============================================================================

const docSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Begin your journey with FormaOS',
    icon: Rocket,
    color: 'cyan',
    articles: [
      {
        title: 'Quick Start Guide',
        description: 'Get up and running in 15 minutes',
        icon: PlayCircle,
      },
      {
        title: 'Platform Overview',
        description: 'Understanding FormaOS architecture',
        icon: Layers,
      },
      {
        title: 'Your First Workflow',
        description: 'Create and deploy a compliance workflow',
        icon: Workflow,
      },
      {
        title: 'User & Role Setup',
        description: 'Configure team access and permissions',
        icon: Users,
      },
    ],
  },
  {
    id: 'core-platform',
    title: 'Core Platform',
    description: 'Master the fundamentals',
    icon: Layers,
    color: 'purple',
    articles: [
      {
        title: 'Policies & Frameworks',
        description: 'Define governance foundations',
        icon: FileText,
      },
      {
        title: 'Controls & Ownership',
        description: 'Assign and track control accountability',
        icon: CheckCircle2,
      },
      {
        title: 'Workflows & Automation',
        description: 'Build operational processes',
        icon: Workflow,
      },
      {
        title: 'Evidence Collection',
        description: 'Automatic and manual evidence capture',
        icon: Database,
      },
      {
        title: 'Audit Trails',
        description: 'Immutable logging and chain of custody',
        icon: BookMarked,
      },
      {
        title: 'Reporting & Analytics',
        description: 'Real-time compliance dashboards',
        icon: BarChart3,
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & Governance',
    description: 'Enterprise-grade protection',
    icon: Shield,
    color: 'green',
    articles: [
      {
        title: 'Authentication & SSO',
        description: 'Google OAuth today; enterprise SSO by request',
        icon: Key,
      },
      {
        title: 'Access Control (RBAC)',
        description: 'Role-based permission management',
        icon: Lock,
      },
      {
        title: 'Encryption & Data Protection',
        description: 'At-rest and in-transit security',
        icon: Shield,
      },
      {
        title: 'Compliance Certifications',
        description: 'SOC 2, GDPR, and regulatory alignment',
        icon: FileText,
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect your ecosystem',
    icon: Plug,
    color: 'blue',
    articles: [
      {
        title: 'REST API Overview',
        description: 'Programmatic access to FormaOS',
        icon: Code,
      },
      {
        title: 'API Authentication',
        description: 'API keys and OAuth flows',
        icon: Key,
      },
      {
        title: 'Webhooks',
        description: 'Webhook integrations (by request)',
        icon: Bell,
      },
      {
        title: 'HR System Integration',
        description: 'Sync users and organizational data',
        icon: Users,
      },
      {
        title: 'Identity Provider Setup',
        description: 'Okta, Azure AD, Google Workspace (by request)',
        icon: Globe,
      },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    description: 'Manage your organization',
    icon: Settings,
    color: 'amber',
    articles: [
      {
        title: 'Organization Settings',
        description: 'Configure global preferences',
        icon: Settings,
      },
      {
        title: 'User Management',
        description: 'Add, modify, and offboard users',
        icon: Users,
      },
      {
        title: 'Billing & Subscriptions',
        description: 'Plans, invoices, and payment',
        icon: FileText,
      },
      {
        title: 'Audit Logs',
        description: 'Administrative action tracking',
        icon: Terminal,
      },
    ],
  },
  {
    id: 'support',
    title: 'Support Resources',
    description: 'Get help when you need it',
    icon: Headphones,
    color: 'rose',
    articles: [
      {
        title: 'Troubleshooting Guide',
        description: 'Common issues and solutions',
        icon: Zap,
      },
      {
        title: 'Contact Support',
        description: 'Reach our support team',
        icon: Headphones,
      },
      {
        title: 'Release Notes',
        description: 'Latest updates and improvements',
        icon: Sparkles,
      },
      {
        title: 'Community & Feedback',
        description: 'Share ideas and connect',
        icon: Users,
      },
    ],
  },
];

const quickLinks = [
  {
    title: 'Quick Start',
    description: 'Get running in 15 minutes',
    icon: Rocket,
    href: '#getting-started',
  },
  {
    title: 'API Reference',
    description: 'Complete API documentation',
    icon: Code,
    href: '#integrations',
  },
  {
    title: 'Security Docs',
    description: 'Enterprise security details',
    icon: Shield,
    href: '#security',
  },
  {
    title: 'Troubleshooting',
    description: 'Solve common issues',
    icon: Zap,
    href: '#support',
  },
];

// ============================================================================
// HERO SECTION
// ============================================================================

function DocsHero() {
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
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl"
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1">
        <CinematicField />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Knowledge Base
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              FormaOS{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Documentation
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto text-center leading-relaxed"
            >
              Comprehensive guides, tutorials, and API references to help you
              master the compliance operating system.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="w-full max-w-xl mx-auto mb-10"
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  className="w-full pl-14 pr-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all backdrop-blur-sm text-lg"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700/50">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto"
            >
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.title}
                    href={link.href}
                    className="group flex flex-col items-center text-center p-4 rounded-xl bg-gray-800/30 border border-gray-700/30 hover:border-cyan-500/30 hover:bg-gray-800/50 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                      {link.title}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {link.description}
                    </span>
                  </a>
                );
              })}
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
          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// DOCUMENTATION SECTION CARD
// ============================================================================

function DocSectionCard({
  section,
  index,
}: {
  section: (typeof docSections)[0];
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const Icon = section.icon;

  const colorMap: Record<string, { bg: string; text: string; border: string }> =
    {
      cyan: {
        bg: 'bg-cyan-500/20',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
      },
      purple: {
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
      },
      blue: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
      },
      green: {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      },
      amber: {
        bg: 'bg-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
      },
      rose: {
        bg: 'bg-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
      },
    };

  const colors = colorMap[section.color] || colorMap.cyan;

  return (
    <motion.div
      id={section.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="scroll-mt-24"
    >
      <div className="relative p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 shadow-2xl shadow-black/30">
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Section Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}
            >
              <Icon className={`w-6 h-6 ${colors.text}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                {section.title}
              </h2>
              <p className="text-sm text-gray-500">{section.description}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
          </motion.div>
        </button>

        {/* Articles Grid */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden"
            >
              <div className="grid sm:grid-cols-2 gap-4 pt-6 mt-6 border-t border-white/5">
                {section.articles.map((article, i) => {
                  const ArticleIcon = article.icon;
                  return (
                    <motion.a
                      key={article.title}
                      href={`#${section.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="group/article flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gray-800/50 flex items-center justify-center flex-shrink-0 group-hover/article:bg-cyan-500/20 transition-colors">
                        <ArticleIcon className="w-4 h-4 text-gray-400 group-hover/article:text-cyan-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white group-hover/article:text-cyan-300 transition-colors truncate">
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {article.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover/article:text-cyan-400 group-hover/article:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ============================================================================
// DOCUMENTATION CONTENT
// ============================================================================

function DocsContent() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-12 space-y-6">
        {docSections.map((section, index) => (
          <DocSectionCard key={section.id} section={section} index={index} />
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// API PREVIEW
// ============================================================================

function APIPreview() {
  return (
    <section className="relative py-16 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/30 overflow-hidden"
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
            {/* Code Preview */}
            <div className="w-full lg:w-1/2">
              <div className="rounded-xl bg-gray-950/80 border border-gray-800/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/50 border-b border-gray-800/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2 font-mono">
                    api-example.sh
                  </span>
                </div>
                <pre className="p-4 text-sm font-mono overflow-x-auto">
                  <code className="text-gray-300">
                    <span className="text-cyan-400">curl</span>{' '}
                    <span className="text-yellow-400">-X GET</span>{' '}
                    <span className="text-gray-500">\</span>
                    {'\n'}
                    {'  '}
                    <span className="text-emerald-400">
                      &quot;https://api.formaos.com/v1/workflows&quot;
                    </span>{' '}
                    <span className="text-gray-500">\</span>
                    {'\n'}
                    {'  '}
                    <span className="text-purple-400">-H</span>{' '}
                    <span className="text-emerald-400">
                      &quot;Authorization: Bearer $API_KEY&quot;
                    </span>{' '}
                    <span className="text-gray-500">\</span>
                    {'\n'}
                    {'  '}
                    <span className="text-purple-400">-H</span>{' '}
                    <span className="text-emerald-400">
                      &quot;Content-Type: application/json&quot;
                    </span>
                  </code>
                </pre>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-medium">
                  Developer API
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                Build Powerful Integrations with the FormaOS API
              </h2>

              <p className="text-gray-400 leading-relaxed">
                Our comprehensive REST API gives you programmatic access to
                workflows, evidence, audit trails, and compliance data. Build
                custom integrations, automate processes, and extend FormaOS to
                fit your needs.
              </p>

              <ul className="space-y-3">
                {[
                  'RESTful endpoints with JSON responses',
                  'Webhook support for real-time events',
                  'OAuth 2.0 and API key authentication',
                  'Comprehensive documentation & SDKs',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <motion.a
                href="#integrations"
                whileHover={{ x: 5 }}
                className="inline-flex items-center gap-2 text-cyan-400 font-medium group"
              >
                <span>Explore API Documentation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// CTA SECTION
// ============================================================================

function DocsCTA() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative p-10 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/30"
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Can&apos;t find what you&apos;re looking for?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Our support team is here to help. Reach out for personalized
              guidance or schedule a technical consultation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="/contact"
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                <span>Contact Support</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <Link
                href="/faq"
                className="group px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all"
              >
                <span>Browse FAQ</span>
                <ExternalLink className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function DocsPageContent() {
  return (
    <div className="relative min-h-screen bg-[#0a0f1c]">
      {/* Fixed particle background */}
      <div className="fixed inset-0 z-0">
        <div className="opacity-30">
          <CinematicField />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-emerald-500/3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <DocsHero />
        <VisualDivider gradient />
        <DocsContent />
        <VisualDivider gradient />
        <APIPreview />
        <VisualDivider gradient />
        <DocsCTA />
      </div>
    </div>
  );
}
