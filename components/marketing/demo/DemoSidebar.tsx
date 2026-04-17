'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Lock,
  Users,
  BarChart3,
  History,
  Settings,
  Shield,
  Heart,
  ClipboardList,
} from 'lucide-react';
import { demoNavItems, demoNavCategories, demoOrg } from './demo-data';
import type { DemoScreenId } from './demo-data';
import { easing, duration } from '@/config/motion';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Lock,
  Users,
  BarChart3,
  History,
  Settings,
  Shield,
  Heart,
  ClipboardList,
};

interface DemoSidebarProps {
  activeScreen: string;
  onNavigate: (id: DemoScreenId) => void;
}

const ragDotColor: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

// Items with RAG status dots (compliance-related)
const ragItems: Record<string, string> = {
  policies: 'green',
  vault: 'amber',
  tasks: 'green',
};

export default function DemoSidebar({
  activeScreen,
  onNavigate,
}: DemoSidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-[#060d1a] border-r border-white/[0.08]">
      {/* Logo */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">FO</span>
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-white block leading-none">
              FormaOS
            </span>
            <span className="text-[7px] text-white/30 uppercase tracking-[0.08em] leading-none">
              Compliance Operating System
            </span>
          </div>
        </div>
      </div>

      {/* Industry badge */}
      <div className="px-3 pb-2">
        <span className="inline-flex items-center rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[9px] font-medium text-cyan-400">
          {demoOrg.industry}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-3">
        {demoNavCategories.map((cat) => {
          const items = demoNavItems.filter((item) => item.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-0.5">
              <h3 className="px-2 text-[8px] font-bold uppercase tracking-[0.1em] text-white/20 mb-1">
                {cat}
              </h3>
              {items.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = activeScreen === item.id;
                const isClickable = [
                  'dashboard',
                  'policies',
                  'tasks',
                  'vault',
                  'audit',
                ].includes(item.id);
                const rag = ragItems[item.id];

                return (
                  <motion.button
                    key={item.id}
                    onClick={() =>
                      isClickable && onNavigate(item.id as DemoScreenId)
                    }
                    className={`
                      relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] font-medium transition-colors h-7
                      ${
                        isActive
                          ? 'border-l-2 border-l-cyan-400 bg-cyan-500/10 text-cyan-300'
                          : isClickable
                            ? 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                            : 'text-white/30 cursor-default'
                      }
                    `}
                    whileHover={isClickable ? { x: 2 } : undefined}
                    transition={{
                      duration: duration.fast,
                      ease: easing.signature,
                    }}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                    <span className="truncate flex-1">{item.label}</span>
                    {rag && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${ragDotColor[rag]} flex-shrink-0`}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
