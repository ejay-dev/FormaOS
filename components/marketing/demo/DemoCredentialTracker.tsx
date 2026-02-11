'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Award, AlertCircle, CheckCircle, Clock,
  Shield, UserCheck,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';

/**
 * DemoCredentialTracker — Animated credential monitoring card.
 * Cycles through workforce credentials showing expiry status.
 */

interface Credential {
  id: string;
  name: string;
  holder: string;
  status: 'active' | 'expiring' | 'expired';
  expiryDate: string;
  daysRemaining: number;
  type: string;
}

const defaultCredentials: Credential[] = [
  {
    id: '1',
    name: 'AHPRA Registration',
    holder: 'Dr Sarah Chen',
    status: 'active',
    expiryDate: '15 Nov 2026',
    daysRemaining: 276,
    type: 'Professional',
  },
  {
    id: '2',
    name: 'Working with Children',
    holder: 'James Wilson',
    status: 'expiring',
    expiryDate: '28 Mar 2026',
    daysRemaining: 44,
    type: 'Screening',
  },
  {
    id: '3',
    name: 'First Aid Certificate',
    holder: 'Emma Rodriguez',
    status: 'expired',
    expiryDate: '02 Feb 2026',
    daysRemaining: -10,
    type: 'Certification',
  },
  {
    id: '4',
    name: 'NDIS Worker Screening',
    holder: 'Marcus Rivera',
    status: 'active',
    expiryDate: '30 Sep 2026',
    daysRemaining: 230,
    type: 'Screening',
  },
  {
    id: '5',
    name: 'CPR Certification',
    holder: 'Dr Sarah Chen',
    status: 'expiring',
    expiryDate: '14 Apr 2026',
    daysRemaining: 61,
    type: 'Certification',
  },
];

const statusConfig = {
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', label: 'Active', icon: CheckCircle },
  expiring: { color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', label: 'Expiring', icon: Clock },
  expired: { color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/20', label: 'Expired', icon: AlertCircle },
};

interface DemoCredentialTrackerProps {
  credentials?: Credential[];
  glowColor?: string;
}

export default function DemoCredentialTracker({
  credentials = defaultCredentials,
  glowColor = 'from-emerald-500/15 to-cyan-500/15',
}: DemoCredentialTrackerProps) {
  const prefersReducedMotion = useReducedMotion();
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setHighlighted((prev) => (prev + 1) % credentials.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, credentials.length]);

  const summary = {
    active: credentials.filter((c) => c.status === 'active').length,
    expiring: credentials.filter((c) => c.status === 'expiring').length,
    expired: credentials.filter((c) => c.status === 'expired').length,
  };

  return (
    <div className="relative">
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${glowColor} blur-sm`} />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0b1022] p-4 sm:p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Credential Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] text-emerald-400 font-medium">
              {summary.active} Active
            </span>
            {summary.expiring > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] text-amber-400 font-medium">
                {summary.expiring} Expiring
              </span>
            )}
            {summary.expired > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] text-red-400 font-medium">
                {summary.expired} Expired
              </span>
            )}
          </div>
        </div>

        {/* Credential list */}
        <div className="space-y-1.5">
          {credentials.map((cred, i) => {
            const config = statusConfig[cred.status];
            const Icon = config.icon;
            const isHighlighted = i === highlighted;

            return (
              <AnimatePresence key={cred.id} mode="wait">
                <motion.div
                  initial={prefersReducedMotion ? undefined : { opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: duration.fast, ease: easing.signature, delay: i * 0.04 }}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all ${
                    isHighlighted ? `${config.bg.replace('/15', '/[0.08]')} border ${config.border}` : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                    <Icon className={`h-3 w-3 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-200 truncate">{cred.name}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate">{cred.holder} • {cred.type}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-[10px] block ${cred.status === 'expired' ? 'text-red-400' : cred.status === 'expiring' ? 'text-amber-400' : 'text-slate-400'}`}>
                      {cred.expiryDate}
                    </span>
                    <span className="text-[8px] text-slate-600 block">
                      {cred.daysRemaining > 0 ? `${cred.daysRemaining}d remaining` : `${Math.abs(cred.daysRemaining)}d overdue`}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.04]">
          <Shield className="h-3 w-3 text-emerald-400" />
          <span className="text-[9px] text-slate-500">Auto-reminders at 90, 60, 30, 7 days before expiry</span>
        </div>
      </div>
    </div>
  );
}
