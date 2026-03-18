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
};

interface DemoSidebarProps {
  activeScreen: string;
  onNavigate: (id: DemoScreenId) => void;
}

export default function DemoSidebar({ activeScreen, onNavigate }: DemoSidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-[#0f1729]/90 border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white tracking-tight">F</span>
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">FormaOS</span>
        </div>
      </div>

      {/* Industry badge */}
      <div className="px-4 pb-3">
        <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
          {demoOrg.industry}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-4">
        {demoNavCategories.map((cat) => {
          const items = demoNavItems.filter((item) => item.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-0.5">
              <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {cat}
              </h3>
              {items.map((item) => {
                const Icon = iconMap[item.icon];
                const isActive = activeScreen === item.id;
                const isClickable = ['dashboard', 'policies', 'tasks', 'vault', 'audit'].includes(item.id);

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => isClickable && onNavigate(item.id as DemoScreenId)}
                    className={`
                      relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-medium transition-colors
                      ${isActive
                        ? 'bg-cyan-500/15 text-cyan-300'
                        : isClickable
                          ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                          : 'text-slate-500 cursor-default'
                      }
                    `}
                    whileHover={isClickable ? { x: 2 } : undefined}
                    transition={{ duration: duration.fast, ease: easing.signature }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="demo-sidebar-active"
                        className="absolute inset-0 rounded-lg bg-cyan-500/15"
                        transition={{ duration: duration.normal, ease: easing.signature }}
                      />
                    )}
                    {Icon && <Icon className="relative z-10 h-3.5 w-3.5 flex-shrink-0" />}
                    <span className="relative z-10 truncate">{item.label}</span>
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
