'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Layers, Shield, Plug, Scale, Headphones,
  ChevronRight, ChevronDown, FileText, Code, Database,
  Lock, Users, BarChart3, Bell, Key, Activity, Clock,
  CheckCircle2, HelpCircle, Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { duration } from '@/config/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import type { LucideIcon } from 'lucide-react';

export interface DocSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  articles: {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
  }[];
}

// Every entry points at a page that exists. When a guide is written, add it
// here rather than listing a title that has nowhere to go.
export const docSections: DocSection[] = [
  {
    id: 'platform',
    title: 'Platform',
    description: 'What FormaOS does and how it is structured',
    icon: Layers,
    articles: [
      {
        title: 'Product overview',
        description: 'Controls, workflows, evidence, and reporting in one graph',
        icon: Layers,
        href: '/product',
      },
      {
        title: 'Framework coverage',
        description: 'The framework packs shipped today and what each includes',
        icon: CheckCircle2,
        href: '/frameworks',
      },
      {
        title: 'What a compliance operating system is',
        description: 'How the category differs from GRC suites and policy libraries',
        icon: FileText,
        href: '/what-is-a-compliance-operating-system',
      },
      {
        title: 'Plans and rollout',
        description: 'Plan structure, scoping, and how evaluation works',
        icon: BarChart3,
        href: '/pricing',
      },
    ],
  },
  {
    id: 'api',
    title: 'API and integrations',
    description: 'Build against the platform',
    icon: Code,
    articles: [
      {
        title: 'REST API reference',
        description: 'Endpoint table, envelope shape, and the generated OpenAPI 3.1 spec',
        icon: Code,
        href: '/documentation/api',
      },
      {
        title: 'Authentication and API keys',
        description: 'Bearer keys scoped per organisation, with session fallback',
        icon: Key,
        href: '/documentation/api#authentication',
      },
      {
        title: 'Rate limits and pagination',
        description: 'Per-key limits, response headers, and cursor pagination',
        icon: Clock,
        href: '/documentation/api#rate-limits',
      },
      {
        title: 'Webhook events',
        description: 'Signed payloads and the current event catalogue',
        icon: Bell,
        href: '/documentation/api#webhooks',
      },
      {
        title: 'Integrations',
        description: 'Connectors available today and those provided by request',
        icon: Plug,
        href: '/integrations',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security and data handling',
    description: 'What reviewers ask first',
    icon: Shield,
    articles: [
      {
        title: 'Security architecture',
        description: 'Encryption, tenant isolation, identity, and audit integrity',
        icon: Shield,
        href: '/security',
      },
      {
        title: 'Security review packet',
        description: 'The material we hand to a security reviewer',
        icon: FileText,
        href: '/security-review',
      },
      {
        title: 'Security review FAQ',
        description: 'Direct answers, including the capabilities we do not have',
        icon: HelpCircle,
        href: '/security-review/faq',
      },
      {
        title: 'Data handling',
        description: 'Storage, encryption, isolation, retention, and deletion',
        icon: Database,
        href: '/trust/data-handling',
      },
      {
        title: 'Access control',
        description: 'Roles, permissions, and how access changes are recorded',
        icon: Lock,
        href: '/trust/procurement',
      },
    ],
  },
  {
    id: 'procurement',
    title: 'Procurement and legal',
    description: 'Documents your legal and risk teams will ask for',
    icon: Scale,
    articles: [
      {
        title: 'Trust Center',
        description: 'Every assurance document in one index',
        icon: Shield,
        href: '/trust',
      },
      {
        title: 'Data Processing Agreement',
        description: 'GDPR Article 28 and Privacy Act aligned processing terms',
        icon: FileText,
        href: '/trust/dpa',
      },
      {
        title: 'Sub-processors',
        description: 'Third parties that process customer data, and their role',
        icon: Users,
        href: '/trust/subprocessors',
      },
      {
        title: 'Service levels',
        description: 'Availability expectations and support commitments by plan',
        icon: Clock,
        href: '/trust/sla',
      },
      {
        title: 'Incident response',
        description: 'How incidents are detected, contained, and disclosed',
        icon: Bell,
        href: '/trust/incident-response',
      },
    ],
  },
  {
    id: 'operations',
    title: 'Running FormaOS',
    description: 'Continuity, health, and what changed',
    icon: Activity,
    articles: [
      {
        title: 'Operational runbooks',
        description: 'Backup, point-in-time recovery, and health endpoints',
        icon: Database,
        href: '/runbooks',
      },
      {
        title: 'Platform status',
        description: 'Live subsystem checks and audit-chain anchoring, no sign-in',
        icon: Activity,
        href: '/status',
      },
      {
        title: 'Release notes',
        description: 'Every shipped change, with the reasoning behind it',
        icon: FileText,
        href: '/changelog',
      },
    ],
  },
  {
    id: 'help',
    title: 'Help',
    description: 'When the docs do not cover it',
    icon: Headphones,
    articles: [
      {
        title: 'Frequently asked questions',
        description: 'Product, security, evidence, pricing, and support questions',
        icon: HelpCircle,
        href: '/faq',
      },
      {
        title: 'Contact us',
        description: 'Reach us about implementation, procurement, or a problem',
        icon: Mail,
        href: '/contact',
      },
    ],
  },
];

export function DocSectionCard({ section, index }: { section: DocSection; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const Icon = section.icon;
  const panelId = `${section.id}-panel`;

  return (
    <ScrollReveal
      variant="blurIn"
      range={[index * 0.04, 0.3 + index * 0.04]}
      className="scroll-mt-24"
    >
      <div id={section.id} className="relative p-6 lg:p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-500 shadow-2xl shadow-black/30">
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center">
              <Icon className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white group-hover:text-slate-200 transition-colors">
                {section.title}
              </h2>
              <p className="text-sm text-slate-500">{section.description}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/5 group-hover:bg-white/[0.12] flex items-center justify-center transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-200 transition-colors" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: duration.normal }}
              id={panelId}
              className="overflow-hidden"
            >
              <div className="grid sm:grid-cols-2 gap-4 pt-6 mt-6 border-t border-white/5">
                {section.articles.map((article) => {
                  const ArticleIcon = article.icon;
                  return (
                    <Link
                      key={article.title}
                      href={article.href}
                      className="group/article flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/[0.06] transition-all duration-300"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover/article:bg-white/[0.12] transition-colors">
                        <ArticleIcon className="w-4 h-4 text-slate-400 group-hover/article:text-slate-200 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white group-hover/article:text-slate-200 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{article.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover/article:text-slate-300 group-hover/article:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollReveal>
  );
}
