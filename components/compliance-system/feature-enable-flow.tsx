'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Shield,
  FileCheck,
  History,
  Database,
  Users,
  FolderLock,
  BookOpen,
  BarChart3,
  Lock,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useSystemState } from '@/lib/system-state';
import { ModuleId, NodeState, PLAN_FEATURES } from '@/lib/system-state/types';
import { useComplianceAction } from '@/components/compliance-system';

/**
 * =========================================================
 * FEATURE ENABLE FLOW COMPONENT
 * =========================================================
 * Shows module nodes with real-time state based on user plan/role.
 * Clicking locked modules shows upgrade prompts.
 * Active modules show feature access.
 */

const MODULE_CONFIG: Record<
  ModuleId,
  {
    name: string;
    description: string;
    icon: LucideIcon;
    color: string;
  }
> = {
  controls: {
    name: 'Controls',
    description: 'Compliance control framework',
    icon: Shield,
    color: 'cyan',
  },
  evidence: {
    name: 'Evidence',
    description: 'Evidence collection & tracking',
    icon: FileCheck,
    color: 'emerald',
  },
  audits: {
    name: 'Audits',
    description: 'Audit trails & history',
    icon: History,
    color: 'violet',
  },
  registers: {
    name: 'Registers',
    description: 'Asset & training registers',
    icon: Database,
    color: 'amber',
  },
  policies: {
    name: 'Policies',
    description: 'Policy management',
    icon: BookOpen,
    color: 'blue',
  },
  vault: {
    name: 'Vault',
    description: 'Secure document storage',
    icon: FolderLock,
    color: 'slate',
  },
  team: {
    name: 'Team',
    description: 'Team management',
    icon: Users,
    color: 'pink',
  },
  reports: {
    name: 'Reports',
    description: 'Compliance reporting',
    icon: BarChart3,
    color: 'orange',
  },
  tasks: {
    name: 'Tasks',
    description: 'Task management',
    icon: Shield,
    color: 'teal',
  },
  billing: {
    name: 'Billing',
    description: 'Billing & subscriptions',
    icon: Zap,
    color: 'green',
  },
  admin: {
    name: 'Admin',
    description: 'System administration',
    icon: Zap,
    color: 'rose',
  },
  settings: {
    name: 'Settings',
    description: 'System settings',
    icon: Shield,
    color: 'gray',
  },
};

const STATE_COLORS: Record<
  NodeState,
  {
    border: string;
    bg: string;
    text: string;
    glow: string;
  }
> = {
  locked: {
    border: 'border-slate-600/50',
    bg: 'bg-slate-800/50',
    text: 'text-slate-500',
    glow: '',
  },
  activating: {
    border: 'border-cyan-400/50',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
  },
  active: {
    border: 'border-emerald-400/50',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_15px_rgba(52,211,153,0.2)]',
  },
  restricted: {
    border: 'border-amber-400/50',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  },
  error: {
    border: 'border-red-400/50',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
  },
  processing: {
    border: 'border-violet-400/50',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
  },
};

interface ModuleNodeProps {
  moduleId: ModuleId;
  state: NodeState;
  onAction: (moduleId: ModuleId) => void;
  isProcessing?: boolean;
}

function ModuleNode({
  moduleId,
  state,
  onAction,
  isProcessing,
}: ModuleNodeProps) {
  const config = MODULE_CONFIG[moduleId];
  const colors = STATE_COLORS[state];
  const Icon = config.icon;

  const handleClick = () => {
    if (state !== 'locked') {
      onAction(moduleId);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === 'locked' || isProcessing}
      className={cn(
        'group relative p-4 rounded-2xl border-2 transition-all duration-300',
        'flex flex-col items-center gap-2 text-center',
        'hover:scale-105 active:scale-95',
        colors.border,
        colors.bg,
        colors.glow,
        state === 'locked' && 'opacity-60 cursor-not-allowed',
        state === 'activating' && 'animate-pulse',
        isProcessing && 'animate-pulse pointer-events-none',
      )}
      data-module={moduleId}
    >
      {/* Lock overlay for locked modules */}
      {state === 'locked' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-2xl backdrop-blur-[1px]">
          <Lock className="h-6 w-6 text-slate-500" />
        </div>
      )}

      {/* State indicator */}
      <div className="absolute -top-1 -right-1">
        {state === 'active' && (
          <div className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
        )}
        {state === 'restricted' && (
          <div className="h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
        )}
        {state === 'error' && (
          <div className="h-3 w-3 rounded-full bg-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        )}
      </div>

      <div
        className={cn(
          'h-12 w-12 rounded-xl flex items-center justify-center',
          colors.bg,
          'border',
          colors.border,
        )}
      >
        <Icon className={cn('h-6 w-6', colors.text)} />
      </div>

      <div>
        <p className={cn('font-bold text-sm', colors.text)}>{config.name}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {config.description}
        </p>
      </div>

      {/* Hover tooltip for locked modules */}
      {state === 'locked' && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 whitespace-nowrap">
            Upgrade to unlock
          </div>
        </div>
      )}
    </button>
  );
}

interface FeatureEnableFlowProps {
  onModuleSelect?: (moduleId: ModuleId) => void;
}

export function FeatureEnableFlow({ onModuleSelect }: FeatureEnableFlowProps) {
  const { state, getModuleState, isModuleAccessible, getPlan } =
    useSystemState();
  const { reportSuccess, reportWarning, reportInfo } = useComplianceAction();
  const [processingModule, setProcessingModule] = useState<ModuleId | null>(
    null,
  );
  const [recentlyActivated, setRecentlyActivated] = useState<ModuleId | null>(
    null,
  );

  const plan = getPlan();
  const enabledModules = PLAN_FEATURES[plan];

  // Primary modules (always shown)
  const primaryModules: ModuleId[] = [
    'controls',
    'evidence',
    'policies',
    'vault',
  ];

  // Advanced modules
  const advancedModules: ModuleId[] = [
    'audits',
    'registers',
    'team',
    'reports',
    'tasks',
  ];

  // Admin modules
  const adminModules: ModuleId[] = ['admin', 'billing', 'settings'];

  const handleModuleAction = useCallback(
    async (moduleId: ModuleId) => {
      const moduleState = getModuleState(moduleId);

      if (moduleState === 'locked') {
        reportWarning({
          title: 'Module locked',
          message: 'Upgrade your plan to access this feature',
        });
        return;
      }

      if (moduleState === 'restricted') {
        reportWarning({
          title: 'Limited access',
          message: 'Some features are restricted in your current plan',
        });
      }

      setProcessingModule(moduleId);

      // Simulate module activation/access
      await new Promise((resolve) => setTimeout(resolve, 500));

      setProcessingModule(null);
      setRecentlyActivated(moduleId);

      reportInfo({
        title: 'Module accessed',
        message: `Opening ${MODULE_CONFIG[moduleId].name}...`,
      });

      setTimeout(() => setRecentlyActivated(null), 2000);

      if (onModuleSelect) {
        onModuleSelect(moduleId);
      }
    },
    [getModuleState, reportWarning, reportInfo, onModuleSelect],
  );

  return (
    <div className="space-y-8">
      {/* Current Plan Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">System Modules</h3>
          <p className="text-sm text-slate-400">
            {enabledModules.length} modules enabled on {plan} plan
          </p>
        </div>
        <div
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider',
            plan === 'enterprise' &&
              'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-400/30',
            plan === 'pro' &&
              'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-400/30',
            plan === 'basic' &&
              'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border border-blue-400/30',
            plan === 'trial' &&
              'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-400/30',
          )}
        >
          {plan}
        </div>
      </div>

      {/* Primary Modules */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Core Modules
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {primaryModules.map((moduleId) => (
            <ModuleNode
              key={moduleId}
              moduleId={moduleId}
              state={
                recentlyActivated === moduleId
                  ? 'processing'
                  : getModuleState(moduleId)
              }
              onAction={handleModuleAction}
              isProcessing={processingModule === moduleId}
            />
          ))}
        </div>
      </div>

      {/* Advanced Modules */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Advanced Modules
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {advancedModules.map((moduleId) => (
            <ModuleNode
              key={moduleId}
              moduleId={moduleId}
              state={
                recentlyActivated === moduleId
                  ? 'processing'
                  : getModuleState(moduleId)
              }
              onAction={handleModuleAction}
              isProcessing={processingModule === moduleId}
            />
          ))}
        </div>
      </div>

      {/* Admin Modules */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Administration
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-sm">
          {adminModules.map((moduleId) => (
            <ModuleNode
              key={moduleId}
              moduleId={moduleId}
              state={
                recentlyActivated === moduleId
                  ? 'processing'
                  : getModuleState(moduleId)
              }
              onAction={handleModuleAction}
              isProcessing={processingModule === moduleId}
            />
          ))}
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex items-center gap-6 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs text-slate-400">
            {enabledModules.length} Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400">
            {Object.keys(MODULE_CONFIG).length - enabledModules.length} Locked
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-xs text-slate-400">
            {plan === 'trial' ? 'Trial limits apply' : 'Full access'}
          </span>
        </div>
      </div>
    </div>
  );
}
