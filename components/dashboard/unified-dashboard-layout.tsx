'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Lock } from 'lucide-react';
import { DatabaseRole } from '@/lib/roles';

/**
 * =========================================================
 * UNIFIED DASHBOARD LAYOUT
 * =========================================================
 *
 * The full app shell (sidebar, topbar, trial banner) is provided
 * by app/app/layout.tsx. This component now acts as a thin
 * pass-through wrapper so existing imports continue to work.
 */

interface DashboardLayoutProps {
  userRole: DatabaseRole;
  organizationName: string;
  children: React.ReactNode;
  empSections?: React.ReactNode;
  empAlloc?: React.ReactNode;
  empStats?: React.ReactNode;
}

/**
 * Main unified dashboard layout
 */
export function UnifiedDashboardLayout({ children }: DashboardLayoutProps) {
  return <div className="space-y-8">{children}</div>;
}

/**
 * Quick access card for dashboard sections
 */
export function DashboardSectionCard({
  title,
  description,
  icon: Icon,
  children,
  locked = false,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  locked?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 transition-all ${
        locked
          ? 'border-slate-700/50 bg-slate-900/30 opacity-50'
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <Icon
          className={`h-6 w-6 ${locked ? 'text-slate-500' : 'text-white'}`}
        />
      </div>
      {!locked && children}
      {locked && (
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <Lock className="h-3 w-3" /> This feature is not available for your
          role.
        </p>
      )}
    </div>
  );
}
