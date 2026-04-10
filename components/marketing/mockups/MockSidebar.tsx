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
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, section: 'OVERVIEW', active: true },
  { label: 'Obligations', icon: Shield, section: 'COMPLIANCE', hasRag: 'green', expandable: true },
  { label: 'Controls', icon: Shield, section: 'COMPLIANCE', hasRag: 'amber' },
  { label: 'Evidence', icon: ClipboardList, section: 'COMPLIANCE', hasRag: 'green' },
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

export function MockSidebar({ industry = 'NDIS Provider', activeItem = 'Dashboard' }: MockSidebarProps) {
  const shouldReduceMotion = useReducedMotion();
  const sections = [...new Set(NAV_ITEMS.map((i) => i.section))];

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="w-40 flex-shrink-0 bg-[#060d1a] border-r border-white/[0.08] flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
            <span className="text-[7px] font-bold text-white">FO</span>
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-white block leading-none">FormaOS</span>
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
                return (
                  <div
                    key={item.label}
                    className={`flex items-center gap-1.5 h-6 px-1.5 rounded text-[8px] font-medium transition-colors ${
                      isActive
                        ? 'border-l-2 border-l-cyan-400 bg-cyan-500/10 text-cyan-400'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate flex-1">{item.label}</span>
                    {item.hasRag && (
                      <span className={`w-1.5 h-1.5 rounded-full ${ragDotColor[item.hasRag]} flex-shrink-0`} />
                    )}
                    {item.expandable && (
                      <ChevronDown className="w-2 h-2 text-white/20 flex-shrink-0" />
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
