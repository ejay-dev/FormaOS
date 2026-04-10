'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  Heart,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronDown,
  GitBranch,
  Layers,
  Network,
} from 'lucide-react';

export type MockIndustry =
  | 'NDIS Provider'
  | 'Healthcare'
  | 'Financial Services'
  | 'Childcare'
  | 'Construction';

interface MockSidebarProps {
  industry?: MockIndustry;
  activeItem?: string;
}

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  active?: boolean;
  hasRag?: 'green' | 'amber' | 'red';
  expandable?: boolean;
  subItems?: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'OVERVIEW',
    active: true,
  },
  {
    label: 'Obligations',
    icon: Shield,
    section: 'COMPLIANCE',
    hasRag: 'green',
    expandable: true,
    subItems: [
      { label: 'Frameworks', icon: GitBranch },
      { label: 'Controls', icon: Layers },
      { label: 'Cross-Map', icon: Network },
    ],
  },
  { label: 'Controls', icon: Shield, section: 'COMPLIANCE', hasRag: 'amber' },
  {
    label: 'Evidence',
    icon: ClipboardList,
    section: 'COMPLIANCE',
    hasRag: 'green',
  },
  { label: 'Care Plans', icon: Heart, section: 'CARE OPERATIONS' },
  { label: 'Progress Notes', icon: ClipboardList, section: 'CARE OPERATIONS' },
  { label: 'Staff Register', icon: Users, section: 'WORKFORCE' },
  { label: 'Credentials', icon: Shield, section: 'WORKFORCE', hasRag: 'red' },
  { label: 'Incident Register', icon: ClipboardList, section: 'REGISTERS' },
  { label: 'Reports', icon: BarChart3, section: 'REPORTS' },
  { label: 'Settings', icon: Settings, section: 'SYSTEM' },
];

const ragDotColor: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const itemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      delay: 0.15 + i * 0.03,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function MockSidebar({
  industry = 'NDIS Provider',
  activeItem = 'Dashboard',
}: MockSidebarProps) {
  const shouldReduceMotion = useReducedMotion();
  const sections = [...new Set(NAV_ITEMS.map((i) => i.section))];

  let globalIndex = 0;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="w-40 flex-shrink-0 bg-[#0a0f1e] border-r border-white/[0.08] flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
            <span className="text-[7px] font-bold text-white">FO</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-white block leading-none">
              FormaOS
            </span>
            <span className="text-[6px] text-white/30 uppercase tracking-[0.08em] leading-none">
              Compliance Operating System
            </span>
          </div>
        </div>
      </div>

      {/* Industry badge */}
      <div className="px-3 pb-2">
        <span className="inline-flex items-center rounded-full bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-[7px] font-medium text-cyan-400">
          {industry}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-hidden px-1.5 space-y-1">
        {sections.map((section) => {
          const items = NAV_ITEMS.filter((i) => i.section === section);
          return (
            <div key={section}>
              <div className="px-1.5 pt-1 pb-0.5 text-[6px] font-bold uppercase tracking-[0.1em] text-white/20">
                {section}
              </div>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = item.label === activeItem;
                const itemIdx = globalIndex++;
                return (
                  <div key={item.label}>
                    <motion.div
                      custom={itemIdx}
                      variants={shouldReduceMotion ? undefined : itemVariants}
                      initial={shouldReduceMotion ? undefined : 'hidden'}
                      whileInView="visible"
                      viewport={{ once: true }}
                      className={`flex items-center gap-1.5 h-6 px-1.5 rounded text-[8px] font-medium transition-colors ${
                        isActive
                          ? 'border-l-2 border-l-cyan-400 bg-cyan-500/10 text-cyan-400'
                          : 'text-white/50 hover:text-white/70'
                      }`}
                    >
                      <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate flex-1">{item.label}</span>
                      {item.hasRag && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${ragDotColor[item.hasRag]} flex-shrink-0`}
                          style={{
                            animation: shouldReduceMotion
                              ? 'none'
                              : 'mockup-pulse-dot 2s ease-in-out infinite',
                          }}
                        />
                      )}
                      {item.expandable && (
                        <ChevronDown className="w-2 h-2 text-white/20 flex-shrink-0" />
                      )}
                    </motion.div>
                    {/* Sub-items for expandable items */}
                    {item.subItems && (
                      <div className="ml-4 border-l border-white/[0.06]">
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          const subIdx = globalIndex++;
                          return (
                            <motion.div
                              key={sub.label}
                              custom={subIdx}
                              variants={
                                shouldReduceMotion ? undefined : itemVariants
                              }
                              initial={
                                shouldReduceMotion ? undefined : 'hidden'
                              }
                              whileInView="visible"
                              viewport={{ once: true }}
                              className="flex items-center gap-1.5 h-5 px-1.5 text-[7px] text-white/30 hover:text-white/50 transition-colors"
                            >
                              <SubIcon className="w-2 h-2 flex-shrink-0" />
                              <span className="truncate">{sub.label}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </nav>
    </motion.div>
  );
}

export default MockSidebar;
