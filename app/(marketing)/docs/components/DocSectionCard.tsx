'use client';

import { useState } from 'react';
import {
  Rocket, Layers, Shield, Plug, Settings, Headphones,
  ChevronRight, ChevronDown, FileText, Code, Terminal, Database,
  Lock, Users, Workflow, BarChart3, Bell, Key, Globe, Zap,
  Sparkles, CheckCircle2, PlayCircle, BookMarked,
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
  color: string;
  articles: { title: string; description: string; icon: LucideIcon }[];
}

export const docSections: DocSection[] = [
  {
    id: 'getting-started', title: 'Getting Started', description: 'Begin your journey with FormaOS',
    icon: Rocket, color: 'cyan',
    articles: [
      { title: 'Quick Start Guide', description: 'Get up and running in 15 minutes', icon: PlayCircle },
      { title: 'Platform Overview', description: 'Understanding FormaOS architecture', icon: Layers },
      { title: 'Your First Workflow', description: 'Create and deploy a compliance workflow', icon: Workflow },
      { title: 'User & Role Setup', description: 'Configure team access and permissions', icon: Users },
    ],
  },
  {
    id: 'core-platform', title: 'Core Platform', description: 'Master the fundamentals',
    icon: Layers, color: 'purple',
    articles: [
      { title: 'Policies & Frameworks', description: 'Define governance foundations', icon: FileText },
      { title: 'Controls & Ownership', description: 'Assign and track control accountability', icon: CheckCircle2 },
      { title: 'Workflows & Automation', description: 'Build operational processes', icon: Workflow },
      { title: 'Evidence Collection', description: 'Automatic and manual evidence capture', icon: Database },
      { title: 'Audit Trails', description: 'Immutable logging and chain of custody', icon: BookMarked },
      { title: 'Reporting & Analytics', description: 'Real-time compliance dashboards', icon: BarChart3 },
    ],
  },
  {
    id: 'security', title: 'Security & Governance', description: 'Enterprise-grade protection',
    icon: Shield, color: 'green',
    articles: [
      { title: 'Authentication & SSO', description: 'Google OAuth today; enterprise SSO by request', icon: Key },
      { title: 'Access Control (RBAC)', description: 'Role-based permission management', icon: Lock },
      { title: 'Encryption & Data Protection', description: 'At-rest and in-transit security', icon: Shield },
      { title: 'Compliance Alignment', description: 'SOC 2-aligned, GDPR-ready, and regulatory framework support', icon: FileText },
    ],
  },
  {
    id: 'integrations', title: 'Integrations', description: 'Connect your ecosystem',
    icon: Plug, color: 'blue',
    articles: [
      { title: 'REST API Overview', description: 'Programmatic access to FormaOS', icon: Code },
      { title: 'API Authentication', description: 'API keys and OAuth flows', icon: Key },
      { title: 'Webhooks', description: 'Webhook integrations (by request)', icon: Bell },
      { title: 'HR System Integration', description: 'Sync users and organizational data (via API/webhook)', icon: Users },
      { title: 'Identity Provider Setup', description: 'Okta, Azure AD, Google Workspace (by request)', icon: Globe },
    ],
  },
  {
    id: 'administration', title: 'Administration', description: 'Manage your organization',
    icon: Settings, color: 'amber',
    articles: [
      { title: 'Organization Settings', description: 'Configure global preferences', icon: Settings },
      { title: 'User Management', description: 'Add, modify, and offboard users', icon: Users },
      { title: 'Billing & Subscriptions', description: 'Plans, invoices, and payment', icon: FileText },
      { title: 'Audit Logs', description: 'Administrative action tracking', icon: Terminal },
    ],
  },
  {
    id: 'support', title: 'Support Resources', description: 'Get help when you need it',
    icon: Headphones, color: 'rose',
    articles: [
      { title: 'Troubleshooting Guide', description: 'Common issues and solutions', icon: Zap },
      { title: 'Contact Support', description: 'Reach our support team', icon: Headphones },
      { title: 'Release Notes', description: 'Latest updates and improvements', icon: Sparkles },
      { title: 'Community & Feedback', description: 'Share ideas and connect', icon: Users },
    ],
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  rose: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export function DocSectionCard({ section, index }: { section: DocSection; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const Icon = section.icon;
  const colors = colorMap[section.color] || colorMap.cyan;
  const panelId = `${section.id}-panel`;

  return (
    <ScrollReveal
      variant="blurIn"
      range={[index * 0.04, 0.3 + index * 0.04]}
      className="scroll-mt-24"
    >
      <div id={section.id} className="relative p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 shadow-2xl shadow-black/30">
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
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
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{article.description}</p>
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
    </ScrollReveal>
  );
}
