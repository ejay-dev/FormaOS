'use client';

/**
 * ProductHeroShowcase — Premium interactive hero for /product
 *
 * - 24 scrollable tab cards (vertical stack, inertia scroll)
 * - Clicking a tab morphs it into the main app panel (spring physics portal)
 * - 6 distinct views with realistic fake data
 * - All text >= 12px, high contrast
 * - prefers-reduced-motion: instant state, no animation
 * - CSS transforms, no WebGL
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/* ═══════════════════════════════════════════════════════════════════════
   TYPES & VIEW CONFIG
   ═══════════════════════════════════════════════════════════════════════ */

type ViewId = 'dashboard' | 'evidence' | 'controls' | 'reports' | 'risk' | 'policies';

interface ViewMeta {
  id: ViewId;
  label: string;
  icon: string;
  accent: string;
  dot: string;
  glow: string;
}

const VIEWS: ViewMeta[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◫', accent: 'text-cyan-300', dot: 'bg-cyan-400', glow: '0,212,251' },
  { id: 'evidence', label: 'Evidence', icon: '◉', accent: 'text-violet-300', dot: 'bg-violet-400', glow: '160,131,255' },
  { id: 'controls', label: 'Controls', icon: '⬡', accent: 'text-blue-300', dot: 'bg-blue-400', glow: '59,130,246' },
  { id: 'reports', label: 'Reports', icon: '◈', accent: 'text-emerald-300', dot: 'bg-emerald-400', glow: '52,211,153' },
  { id: 'risk', label: 'Risk', icon: '△', accent: 'text-amber-300', dot: 'bg-amber-400', glow: '251,191,36' },
  { id: 'policies', label: 'Policies', icon: '▣', accent: 'text-rose-300', dot: 'bg-rose-400', glow: '251,113,133' },
];

const VIEW_MAP = Object.fromEntries(VIEWS.map((v) => [v.id, v])) as Record<ViewId, ViewMeta>;

/* ═══════════════════════════════════════════════════════════════════════
   TAB DATA (24 cards)
   ═══════════════════════════════════════════════════════════════════════ */

interface Tab {
  id: string;
  view: ViewId;
  title: string;
  stat: string;
  sub: string;
}

const TABS: Tab[] = [
  { id: 't01', view: 'dashboard', title: 'Compliance Score', stat: '94%', sub: 'Overall posture' },
  { id: 't02', view: 'evidence', title: 'Evidence Vault', stat: '1,247', sub: 'Artifacts collected' },
  { id: 't03', view: 'controls', title: 'Control Mapping', stat: '142/156', sub: 'Controls mapped' },
  { id: 't04', view: 'reports', title: 'Audit Reports', stat: '12', sub: 'Generated Q1' },
  { id: 't05', view: 'risk', title: 'Risk Register', stat: '4', sub: 'Open items' },
  { id: 't06', view: 'policies', title: 'Policy Library', stat: '38', sub: 'Active policies' },
  { id: 't07', view: 'dashboard', title: 'Task Tracker', stat: '23', sub: 'Active tasks' },
  { id: 't08', view: 'evidence', title: 'Audit Trail', stat: '8,412', sub: 'Log entries' },
  { id: 't09', view: 'controls', title: 'Framework Coverage', stat: '91%', sub: 'SOC 2 + ISO' },
  { id: 't10', view: 'reports', title: 'Board Reports', stat: '3', sub: 'Ready to send' },
  { id: 't11', view: 'risk', title: 'Vendor Risk', stat: '7', sub: 'Assessments due' },
  { id: 't12', view: 'policies', title: 'Review Queue', stat: '5', sub: 'Policies pending' },
  { id: 't13', view: 'dashboard', title: 'Team Activity', stat: '156', sub: 'Actions this week' },
  { id: 't14', view: 'evidence', title: 'Evidence Gaps', stat: '8', sub: 'Missing artifacts' },
  { id: 't15', view: 'controls', title: 'SOC 2 Readiness', stat: '98%', sub: 'Type II' },
  { id: 't16', view: 'reports', title: 'Gap Analysis', stat: '2', sub: 'In progress' },
  { id: 't17', view: 'risk', title: 'Incident Log', stat: '0', sub: 'Active incidents' },
  { id: 't18', view: 'policies', title: 'Compliance Calendar', stat: '14', sub: 'Upcoming deadlines' },
  { id: 't19', view: 'dashboard', title: 'Notifications', stat: '7', sub: 'Unread alerts' },
  { id: 't20', view: 'evidence', title: 'Auto Collection', stat: '12', sub: 'Active integrations' },
  { id: 't21', view: 'controls', title: 'ISO 27001', stat: '87%', sub: 'Annex A coverage' },
  { id: 't22', view: 'reports', title: 'Compliance Trends', stat: '+12%', sub: 'Month over month' },
  { id: 't23', view: 'risk', title: 'Third-Party Risk', stat: '3', sub: 'Vendors flagged' },
  { id: 't24', view: 'policies', title: 'Access Reviews', stat: '2', sub: 'Overdue reviews' },
];

/* ═══════════════════════════════════════════════════════════════════════
   VIEW-SPECIFIC DATA (6 views)
   ═══════════════════════════════════════════════════════════════════════ */

const DASHBOARD_ROWS = [
  { title: 'Review SOC 2 Type II controls', badge: 'In Progress', badgeCls: 'bg-cyan-400/15 text-cyan-300', dot: 'bg-cyan-400/60', assignee: 'AK', pct: 72 },
  { title: 'Upload penetration test report', badge: 'Pending', badgeCls: 'bg-amber-400/15 text-amber-300', dot: 'bg-amber-400/60', assignee: 'SM', pct: 0 },
  { title: 'Map ISO 27001 Annex A controls', badge: 'Complete', badgeCls: 'bg-emerald-400/15 text-emerald-300', dot: 'bg-emerald-400/60', assignee: 'JR', pct: 100 },
  { title: 'Vendor risk assessment — Stripe', badge: 'In Review', badgeCls: 'bg-blue-400/15 text-blue-300', dot: 'bg-blue-400/60', assignee: 'LW', pct: 88 },
  { title: 'Incident response plan update', badge: 'In Progress', badgeCls: 'bg-cyan-400/15 text-cyan-300', dot: 'bg-cyan-400/60', assignee: 'TP', pct: 45 },
  { title: 'Update data retention policy', badge: 'Pending', badgeCls: 'bg-amber-400/15 text-amber-300', dot: 'bg-amber-400/60', assignee: 'AK', pct: 0 },
];

const EVIDENCE_ROWS = [
  { name: 'SOC2-AuditLog-2026Q1.pdf', type: 'PDF', size: '2.4 MB', date: 'Feb 14', tag: 'SOC 2' },
  { name: 'PenTest-Report-External.pdf', type: 'PDF', size: '5.1 MB', date: 'Feb 10', tag: 'ISO 27001' },
  { name: 'AccessReview-Jan2026.xlsx', type: 'XLSX', size: '890 KB', date: 'Feb 8', tag: 'Access' },
  { name: 'IncidentResponse-Runbook-v3.md', type: 'MD', size: '124 KB', date: 'Feb 5', tag: 'IR' },
  { name: 'VendorDueDiligence-Stripe.pdf', type: 'PDF', size: '1.8 MB', date: 'Feb 1', tag: 'Vendor' },
  { name: 'DataClassification-Matrix.xlsx', type: 'XLSX', size: '340 KB', date: 'Jan 28', tag: 'Data' },
];

const CONTROLS_ROWS = [
  { code: 'CC6.1', name: 'Logical Access Controls', status: 'Mapped', statusCls: 'bg-emerald-400/15 text-emerald-300', framework: 'SOC 2' },
  { code: 'CC7.2', name: 'System Monitoring', status: 'Mapped', statusCls: 'bg-emerald-400/15 text-emerald-300', framework: 'SOC 2' },
  { code: 'A.8.1', name: 'Asset Inventory', status: 'Partial', statusCls: 'bg-amber-400/15 text-amber-300', framework: 'ISO 27001' },
  { code: 'A.12.4', name: 'Logging & Monitoring', status: 'Mapped', statusCls: 'bg-emerald-400/15 text-emerald-300', framework: 'ISO 27001' },
  { code: 'CC3.1', name: 'Risk Assessment Process', status: 'Unmapped', statusCls: 'bg-red-400/15 text-red-300', framework: 'SOC 2' },
  { code: 'A.9.2', name: 'User Access Management', status: 'Mapped', statusCls: 'bg-emerald-400/15 text-emerald-300', framework: 'ISO 27001' },
];

const REPORTS_ROWS = [
  { name: 'Board Readiness Report — Q1 2026', status: 'Final', statusCls: 'bg-emerald-400/15 text-emerald-300', date: 'Feb 15', pages: 24 },
  { name: 'SOC 2 Type II Gap Analysis', status: 'Draft', statusCls: 'bg-slate-400/15 text-slate-300', date: 'Feb 12', pages: 18 },
  { name: 'Vendor Risk Summary', status: 'Final', statusCls: 'bg-emerald-400/15 text-emerald-300', date: 'Feb 8', pages: 12 },
  { name: 'Incident Response Metrics', status: 'In Review', statusCls: 'bg-blue-400/15 text-blue-300', date: 'Feb 5', pages: 9 },
  { name: 'Quarterly Compliance Digest', status: 'Final', statusCls: 'bg-emerald-400/15 text-emerald-300', date: 'Jan 31', pages: 16 },
];

const RISK_ROWS = [
  { name: 'Unpatched CVE in auth service', sev: 'High', sevCls: 'bg-red-400/15 text-red-300', sevDot: 'bg-red-400/70', age: '3d', owner: 'SM' },
  { name: 'Expired vendor NDA — Acme Corp', sev: 'Medium', sevCls: 'bg-amber-400/15 text-amber-300', sevDot: 'bg-amber-400/70', age: '7d', owner: 'LW' },
  { name: 'Missing MFA for 2 admin accounts', sev: 'High', sevCls: 'bg-red-400/15 text-red-300', sevDot: 'bg-red-400/70', age: '1d', owner: 'AK' },
  { name: 'Overdue access review — Q4', sev: 'Low', sevCls: 'bg-emerald-400/15 text-emerald-300', sevDot: 'bg-emerald-400/70', age: '14d', owner: 'JR' },
  { name: 'Stale firewall rules — prod', sev: 'Medium', sevCls: 'bg-amber-400/15 text-amber-300', sevDot: 'bg-amber-400/70', age: '5d', owner: 'TP' },
];

const POLICY_ROWS = [
  { name: 'Information Security Policy', ver: 'v4.2', status: 'Active', statusCls: 'bg-emerald-400/15 text-emerald-300', review: 'Jan 15', owner: 'CISO' },
  { name: 'Acceptable Use Policy', ver: 'v3.1', status: 'Active', statusCls: 'bg-emerald-400/15 text-emerald-300', review: 'Dec 20', owner: 'HR' },
  { name: 'Data Retention Policy', ver: 'v2.0', status: 'In Review', statusCls: 'bg-blue-400/15 text-blue-300', review: 'Feb 10', owner: 'Legal' },
  { name: 'Incident Response Plan', ver: 'v5.0', status: 'Active', statusCls: 'bg-emerald-400/15 text-emerald-300', review: 'Jan 28', owner: 'Security' },
  { name: 'Vendor Management Policy', ver: 'v1.3', status: 'Draft', statusCls: 'bg-slate-400/15 text-slate-300', review: 'Feb 14', owner: 'Procurement' },
  { name: 'Access Control Policy', ver: 'v3.0', status: 'Active', statusCls: 'bg-emerald-400/15 text-emerald-300', review: 'Jan 5', owner: 'IT' },
];

const STATS: Record<ViewId, { label: string; value: string; sub: string }[]> = {
  dashboard: [
    { label: 'Controls', value: '142', sub: '/ 156 mapped' },
    { label: 'Evidence', value: '94%', sub: 'coverage' },
    { label: 'Audit Risk', value: 'Low', sub: '3 open items' },
  ],
  evidence: [
    { label: 'Artifacts', value: '1,247', sub: 'total collected' },
    { label: 'Coverage', value: '94%', sub: 'of controls' },
    { label: 'Stale', value: '8', sub: 'need refresh' },
  ],
  controls: [
    { label: 'Mapped', value: '142', sub: '/ 156 total' },
    { label: 'Partial', value: '11', sub: 'need work' },
    { label: 'Unmapped', value: '3', sub: 'remaining' },
  ],
  reports: [
    { label: 'Generated', value: '12', sub: 'this quarter' },
    { label: 'Final', value: '8', sub: 'approved' },
    { label: 'Pending', value: '4', sub: 'in review' },
  ],
  risk: [
    { label: 'Open', value: '5', sub: 'active items' },
    { label: 'High', value: '2', sub: 'critical' },
    { label: 'Posture', value: 'Low', sub: 'overall' },
  ],
  policies: [
    { label: 'Active', value: '34', sub: 'policies' },
    { label: 'In Review', value: '3', sub: 'pending' },
    { label: 'Overdue', value: '1', sub: 'needs update' },
  ],
};

/* ═══════════════════════════════════════════════════════════════════════
   GRAIN OVERLAY
   ═══════════════════════════════════════════════════════════════════════ */

function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[60] opacity-[0.025] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INERTIA SCROLL
   ═══════════════════════════════════════════════════════════════════════ */

function useInertiaScroll(itemCount: number, itemH: number, visibleH: number) {
  const posRef = useRef(0);
  const velRef = useRef(0);
  const rafRef = useRef(0);
  const lastWheelRef = useRef(0);
  const runningRef = useRef(false);
  const [scrollY, setScrollY] = useState(0);

  const maxScroll = Math.max(0, itemCount * itemH - visibleH);

  const tick = useCallback(() => {
    const pos = posRef.current;
    if (pos < 0) {
      posRef.current += (0 - pos) * 0.15;
      velRef.current *= 0.6;
    } else if (pos > maxScroll) {
      posRef.current += (maxScroll - pos) * 0.15;
      velRef.current *= 0.6;
    } else {
      velRef.current *= 0.92;
    }
    posRef.current += velRef.current;
    setScrollY(posRef.current);

    if (Math.abs(velRef.current) > 0.2 || posRef.current < -2 || posRef.current > maxScroll + 2) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      runningRef.current = false;
      posRef.current = Math.max(0, Math.min(maxScroll, posRef.current));
      setScrollY(posRef.current);
    }
  }, [maxScroll]);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const now = Date.now();
    const dt = Math.max(8, now - lastWheelRef.current);
    lastWheelRef.current = now;
    velRef.current = e.deltaY * 0.6 * Math.min(1, 16 / dt);
    if (!runningRef.current) {
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { scrollY, onWheel };
}

/* ═══════════════════════════════════════════════════════════════════════
   MORPH OVERLAY — portal that flies from tab to panel
   ═══════════════════════════════════════════════════════════════════════ */

interface MorphRect { x: number; y: number; w: number; h: number }
interface MorphData { from: MorphRect; to: MorphRect; glow: string }

function MorphOverlay({ morph, onDone }: { morph: MorphData; onDone: () => void }) {
  const dx = morph.to.x + morph.to.w / 2 - morph.from.x - morph.from.w / 2;
  const dy = morph.to.y + morph.to.h / 2 - morph.from.y - morph.from.h / 2;
  const sx = morph.to.w / morph.from.w;
  const sy = morph.to.h / morph.from.h;

  return createPortal(
    <motion.div
      className="pointer-events-none"
      style={{
        position: 'fixed',
        zIndex: 9999,
        left: morph.from.x,
        top: morph.from.y,
        width: morph.from.w,
        height: morph.from.h,
        transformOrigin: 'center center',
        borderRadius: '16px',
        willChange: 'transform',
      }}
      initial={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 0.95 }}
      animate={{ x: dx, y: dy, scaleX: sx, scaleY: sy, opacity: 0.85 }}
      transition={{ type: 'spring', stiffness: 170, damping: 24, mass: 0.8 }}
      onAnimationComplete={onDone}
    >
      {/* Gradient fill */}
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background: `linear-gradient(145deg, rgba(${morph.glow},0.12) 0%, rgba(10,15,28,0.92) 40%)`,
          border: `1px solid rgba(${morph.glow},0.3)`,
          boxShadow: `0 0 60px rgba(${morph.glow},0.2), 0 30px 60px rgba(0,0,0,0.4)`,
        }}
      />
      {/* Glow pulse */}
      <motion.div
        className="absolute inset-0 rounded-[inherit]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.7, 0] }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        style={{ border: `2px solid rgba(${morph.glow},0.5)`, boxShadow: `inset 0 0 30px rgba(${morph.glow},0.15)` }}
      />
      {/* Light sweep */}
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <motion.div
          className="absolute inset-y-0 w-1/3"
          initial={{ x: '-100%' }}
          animate={{ x: '400%' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
        />
      </div>
    </motion.div>,
    document.body,
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB STACK — scrollable with morph on click
   ═══════════════════════════════════════════════════════════════════════ */

const TAB_H = 70;
const VISIBLE_COUNT = 8;
const STACK_H = TAB_H * VISIBLE_COUNT;

function TabStack({
  activeTabId,
  liftedTabId,
  onTabClick,
  shouldAnimate,
  entranceProgress,
  tabRefs,
}: {
  activeTabId: string;
  liftedTabId: string | null;
  onTabClick: (tab: Tab, el: HTMLButtonElement) => void;
  shouldAnimate: boolean;
  entranceProgress: number;
  tabRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY, onWheel } = useInertiaScroll(TABS.length, TAB_H, STACK_H);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const ease3 = (t: number) => 1 - Math.pow(1 - t, 3);
  const entrance = shouldAnimate ? ease3(Math.min(1, entranceProgress / 0.8)) : 1;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        width: '400px',
        height: `${STACK_H}px`,
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)',
      }}
      role="listbox"
      aria-label="Feature modules"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const curIdx = TABS.findIndex((t) => t.id === activeTabId);
          const next = e.key === 'ArrowDown' ? Math.min(curIdx + 1, TABS.length - 1) : Math.max(curIdx - 1, 0);
          const tab = TABS[next];
          const el = tabRefs.current.get(tab.id);
          if (el) onTabClick(tab, el);
        }
      }}
    >
      <div className="absolute left-0 right-0" style={{ transform: `translateY(${-scrollY}px)`, willChange: 'transform' }}>
        {TABS.map((tab, i) => {
          const viewMeta = VIEW_MAP[tab.view];
          const cardTop = i * TAB_H;
          const dist = Math.abs(cardTop - scrollY - STACK_H / 2 + TAB_H / 2);
          const depthBlur = Math.max(0, (dist - STACK_H * 0.3) / (STACK_H * 0.4));
          const isActive = tab.id === activeTabId;
          const isLifted = tab.id === liftedTabId;
          const entDelay = shouldAnimate ? (1 - entrance) * (50 + i * 6) : 0;

          return (
            <button
              key={tab.id}
              ref={(el) => { if (el) tabRefs.current.set(tab.id, el); }}
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={(e) => onTabClick(tab, e.currentTarget)}
              className="absolute left-0 right-0 mx-2 flex items-center gap-3 px-5 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 group"
              style={{
                top: `${cardTop}px`,
                height: `${TAB_H - 6}px`,
                borderRadius: '14px',
                background: `linear-gradient(135deg, rgba(${viewMeta.glow},${isActive ? 0.12 : 0.07}) 0%, rgba(51,153,255,0.03) 100%)`,
                border: `1px solid rgba(${viewMeta.glow},${isActive ? 0.35 : 0.12})`,
                boxShadow: isLifted
                  ? `0 0 40px rgba(${viewMeta.glow},0.25), 0 12px 32px rgba(0,0,0,0.4)`
                  : isActive
                    ? `0 0 20px rgba(${viewMeta.glow},0.12), 0 4px 16px rgba(0,0,0,0.25)`
                    : '0 2px 8px rgba(0,0,0,0.15)',
                filter: depthBlur > 0 ? `blur(${depthBlur * 3}px)` : 'none',
                opacity: isLifted ? 0.4 : Math.max(0.3, 1 - depthBlur * 0.7) * entrance,
                transform: `translateY(${entDelay}px) scale(${isLifted ? 1.04 : 1})`,
                backdropFilter: 'blur(8px)',
                willChange: 'transform, opacity, filter',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.25s, opacity 0.2s, transform 0.25s',
              }}
            >
              {/* Hover shimmer */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.04) 48%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 52%, transparent 65%)',
                  animation: 'none',
                }}
              />
              {/* Glass top edge */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(168deg, rgba(255,255,255,0.05) 0%, transparent 30%)' }} />
              {/* Active ring */}
              <div
                className={`absolute inset-0 rounded-[14px] pointer-events-none transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                style={{ boxShadow: `inset 0 0 0 1px rgba(${viewMeta.glow},0.2)` }}
              />

              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0 ${viewMeta.accent}`}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {viewMeta.icon}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] text-white/75 font-medium truncate leading-tight">{tab.title}</div>
                <div className="text-[12px] text-white/35 truncate leading-tight mt-0.5">{tab.sub}</div>
              </div>
              <div className={`text-[17px] font-bold shrink-0 ${viewMeta.accent}`}>{tab.stat}</div>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${viewMeta.dot} opacity-50`} />
            </button>
          );
        })}
      </div>

      {/* Scroll track */}
      <div className="absolute right-0 top-[6%] bottom-[6%] w-[3px] rounded-full bg-white/[0.04] z-20">
        <div
          className="absolute top-0 w-full rounded-full bg-white/[0.12]"
          style={{
            height: `${Math.max(20, (STACK_H / (TABS.length * TAB_H)) * 100)}%`,
            top: `${(scrollY / Math.max(1, TABS.length * TAB_H - STACK_H)) * (100 - Math.max(20, (STACK_H / (TABS.length * TAB_H)) * 100))}%`,
            transition: 'top 0.06s linear',
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   APP PANEL — big focal window, 6 interactive views
   ═══════════════════════════════════════════════════════════════════════ */

function AppPanel({
  activeView,
  onViewChange,
  isMorphing,
  panelRef,
}: {
  activeView: ViewId;
  onViewChange: (v: ViewId) => void;
  isMorphing: boolean;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const view = VIEW_MAP[activeView];
  const stats = STATS[activeView];

  return (
    <div
      ref={panelRef}
      className="relative overflow-hidden rounded-[22px]"
      style={{
        width: '920px',
        height: '620px',
        background: 'linear-gradient(145deg, rgba(0,212,251,0.05) 0%, rgba(10,15,28,0.95) 10%, rgba(10,15,28,0.98) 100%)',
        border: `1px solid rgba(${view.glow},${isMorphing ? 0.35 : 0.15})`,
        boxShadow: `0 0 80px rgba(${view.glow},0.06), 0 40px 80px rgba(0,0,0,0.35), 0 80px 120px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
        backdropFilter: 'blur(24px) saturate(1.1)',
        transition: 'border-color 0.4s, box-shadow 0.4s',
        opacity: isMorphing ? 0.6 : 1,
      }}
    >
      {/* Glass reflection */}
      <div className="absolute inset-0 pointer-events-none rounded-[22px]" style={{ background: 'linear-gradient(170deg, rgba(255,255,255,0.05) 0%, transparent 20%)' }} />

      <div className="absolute inset-0 flex flex-col">
        {/* Chrome bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.07] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/50" />
              <div className="w-3 h-3 rounded-full bg-amber-400/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/50" />
            </div>
            <div className="text-[12px] text-white/25 font-mono tracking-wider">app.formaos.com.au / {activeView}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-28 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center px-3 hover:border-white/[0.12] transition-colors">
              <span className="text-[12px] text-white/20">Search…</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/20 flex items-center justify-center">
              <span className="text-[12px] font-bold text-white/60">FO</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-[170px] shrink-0 border-r border-white/[0.06] bg-white/[0.015] py-4 px-3 flex flex-col">
            <div className="flex items-center gap-2 px-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400/25 to-blue-500/15 flex items-center justify-center">
                <span className="text-[12px] font-bold text-cyan-400/80">FO</span>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-white/55">FormaOS</div>
                <div className="text-[12px] text-white/20">Enterprise</div>
              </div>
            </div>
            <div className="space-y-0.5">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onViewChange(v.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-left transition-all duration-150 ${
                    activeView === v.id
                      ? 'bg-cyan-400/[0.10] text-cyan-300 border border-cyan-400/15'
                      : 'text-white/30 hover:text-white/55 hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <span className="text-[14px] opacity-70 w-4 text-center">{v.icon}</span>
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto pt-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 px-2.5 mt-2 pt-2 border-t border-white/[0.06]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400/30 to-blue-400/20" />
                <div>
                  <div className="text-[12px] text-white/35">Nancy M.</div>
                  <div className="text-[12px] text-white/15">Admin</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[17px] font-semibold text-white/85">{view.label}</div>
                <div className="text-[12px] text-white/25">Last synced 2 min ago</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[12px] text-white/30 cursor-pointer hover:bg-white/[0.06] transition-colors">Export</div>
                <div className="px-3 py-1.5 rounded-lg bg-cyan-400/12 border border-cyan-400/25 text-[12px] text-cyan-300 cursor-pointer hover:bg-cyan-400/18 transition-colors">+ New</div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3.5 hover:border-white/[0.12] transition-colors cursor-default">
                  <div className="text-[12px] text-white/25 uppercase tracking-wider">{s.label}</div>
                  <div className="text-[20px] font-bold text-white/85 mt-1">{s.value}</div>
                  <div className="text-[12px] text-white/20 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Content list */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="space-y-1.5 overflow-y-auto"
                style={{ maxHeight: '250px' }}
              >
                <div className="text-[12px] text-white/25 font-medium uppercase tracking-wider mb-2">
                  {activeView === 'dashboard' && 'Active Tasks'}
                  {activeView === 'evidence' && 'Recent Artifacts'}
                  {activeView === 'controls' && 'Control Mapping'}
                  {activeView === 'reports' && 'Recent Reports'}
                  {activeView === 'risk' && 'Open Risk Items'}
                  {activeView === 'policies' && 'Policy Library'}
                </div>

                {activeView === 'dashboard' && DASHBOARD_ROWS.map((r) => (
                  <div key={r.title} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-4 py-2.5 hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer">
                    <div className={`w-2 h-2 rounded-full ${r.dot} shrink-0`} />
                    <div className="flex-1 min-w-0 text-[13px] text-white/60 truncate">{r.title}</div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-500/30 to-slate-700/30 flex items-center justify-center shrink-0"><span className="text-[12px] font-semibold text-white/40">{r.assignee}</span></div>
                    <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.badgeCls}`}>{r.badge}</div>
                    {r.pct > 0 && r.pct < 100 && (
                      <div className="w-14 h-1.5 rounded-full bg-white/[0.05] overflow-hidden shrink-0">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400/40 to-blue-400/25" style={{ width: `${r.pct}%` }} />
                      </div>
                    )}
                  </div>
                ))}

                {activeView === 'evidence' && EVIDENCE_ROWS.map((r) => (
                  <div key={r.name} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-4 py-2.5 hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-violet-400/12 flex items-center justify-center shrink-0"><span className="text-[12px] text-violet-300 font-mono">{r.type}</span></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-white/60 truncate">{r.name}</div>
                      <div className="text-[12px] text-white/22">{r.size} · {r.date}</div>
                    </div>
                    <div className="text-[12px] px-2 py-0.5 rounded-full bg-violet-400/12 text-violet-300 shrink-0">{r.tag}</div>
                  </div>
                ))}

                {activeView === 'controls' && CONTROLS_ROWS.map((r) => (
                  <div key={r.code} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-4 py-2.5 hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer">
                    <div className="text-[12px] font-mono text-blue-300/70 w-12 shrink-0">{r.code}</div>
                    <div className="flex-1 min-w-0 text-[13px] text-white/60 truncate">{r.name}</div>
                    <div className="text-[12px] text-white/22 shrink-0">{r.framework}</div>
                    <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.statusCls}`}>{r.status}</div>
                  </div>
                ))}

                {activeView === 'reports' && REPORTS_ROWS.map((r) => (
                  <div key={r.name} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-4 py-2.5 hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-emerald-400/12 flex items-center justify-center shrink-0"><span className="text-[13px] text-emerald-300">◈</span></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-white/60 truncate">{r.name}</div>
                      <div className="text-[12px] text-white/22">{r.date} · {r.pages} pages</div>
                    </div>
                    <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.statusCls}`}>{r.status}</div>
                  </div>
                ))}

                {activeView === 'risk' && RISK_ROWS.map((r) => (
                  <div key={r.name} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-4 py-2.5 hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${r.sevDot}`} />
                    <div className="flex-1 min-w-0 text-[13px] text-white/60 truncate">{r.name}</div>
                    <div className="text-[12px] text-white/22 shrink-0">{r.age}</div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-500/30 to-slate-700/30 flex items-center justify-center shrink-0"><span className="text-[12px] font-semibold text-white/40">{r.owner}</span></div>
                    <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.sevCls}`}>{r.sev}</div>
                  </div>
                ))}

                {activeView === 'policies' && POLICY_ROWS.map((r) => (
                  <div key={r.name} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-4 py-2.5 hover:bg-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer">
                    <div className="w-7 h-7 rounded-lg bg-rose-400/10 flex items-center justify-center shrink-0"><span className="text-[13px] text-rose-300">▣</span></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-white/60 truncate">{r.name}</div>
                      <div className="text-[12px] text-white/22">{r.ver} · {r.review} · {r.owner}</div>
                    </div>
                    <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.statusCls}`}>{r.status}</div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   DESKTOP 3D SCENE
   ═══════════════════════════════════════════════════════════════════════ */

function DesktopScene({
  activeView,
  activeTabId,
  liftedTabId,
  onTabClick,
  onViewChange,
  mouseX,
  mouseY,
  shouldAnimate,
  entranceProgress,
  isMorphing,
  tabRefs,
  panelRef,
}: {
  activeView: ViewId;
  activeTabId: string;
  liftedTabId: string | null;
  onTabClick: (tab: Tab, el: HTMLButtonElement) => void;
  onViewChange: (v: ViewId) => void;
  mouseX: number;
  mouseY: number;
  shouldAnimate: boolean;
  entranceProgress: number;
  isMorphing: boolean;
  tabRefs: React.MutableRefObject<Map<string, HTMLButtonElement>>;
  panelRef: React.RefObject<HTMLDivElement | null>;
}) {
  const px = shouldAnimate ? mouseX * 3.5 : 0;
  const py = shouldAnimate ? mouseY * 2 : 0;
  const ease3 = (t: number) => 1 - Math.pow(1 - t, 3);
  const winEnt = shouldAnimate ? ease3(Math.min(1, Math.max(0, (entranceProgress - 0.35) / 0.6))) : 1;

  return (
    <div className="relative w-full h-full" style={{ perspective: '1800px' }}>
      {/* Ambient glows */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[12%] left-[5%] w-[45%] h-[55%] rounded-full blur-[130px] opacity-[0.2]" style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.35), transparent 70%)' }} />
        <div className="absolute top-[35%] left-[50%] w-[40%] h-[45%] rounded-full blur-[110px] opacity-[0.16]" style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.3), transparent 70%)' }} />
        <div className="absolute bottom-[8%] left-[25%] w-[30%] h-[30%] rounded-full blur-[90px] opacity-[0.10]" style={{ background: 'radial-gradient(ellipse at center, rgba(251,113,133,0.2), transparent 70%)' }} />
      </div>

      {/* Dot grid */}
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 0.5px, transparent 0)', backgroundSize: '42px 42px' }} />

      {/* 3D container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${7 + py}deg) rotateY(${-8 + px}deg)`,
          transition: shouldAnimate ? 'transform 0.1s linear' : 'none',
        }}
      >
        {/* Tab stack */}
        <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%) translate3d(-360px, 0px, -8px) rotateX(1deg) rotateY(-4deg)' }}>
          <TabStack
            activeTabId={activeTabId}
            liftedTabId={liftedTabId}
            onTabClick={onTabClick}
            shouldAnimate={shouldAnimate}
            entranceProgress={entranceProgress}
            tabRefs={tabRefs}
          />
        </div>

        {/* App panel */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate3d(240px, ${(1 - winEnt) * 35}px, 50px) rotateX(0.5deg) rotateY(-1.5deg)`,
            opacity: winEnt,
            willChange: 'transform, opacity',
          }}
        >
          <AppPanel activeView={activeView} onViewChange={onViewChange} isMorphing={isMorphing} panelRef={panelRef} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MOBILE LAYOUT
   ═══════════════════════════════════════════════════════════════════════ */

function MobileLayout({ activeView, onViewChange }: { activeView: ViewId; onViewChange: (v: ViewId) => void }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      <div className="flex gap-1.5 mb-4 z-10 overflow-x-auto pb-1" style={{ maxWidth: '100%' }}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onViewChange(v.id)}
            className={`px-3 py-2 rounded-lg text-[13px] shrink-0 transition-all border ${
              activeView === v.id ? 'bg-cyan-400/12 text-cyan-300 border-cyan-400/25' : 'bg-white/[0.03] text-white/35 border-white/[0.07] hover:text-white/55'
            }`}
          >
            <span className="mr-1.5">{v.icon}</span>{v.label}
          </button>
        ))}
      </div>
      <div
        className="relative w-full max-w-[500px] rounded-2xl border border-cyan-400/15 overflow-hidden"
        style={{
          height: '420px',
          background: 'linear-gradient(145deg, rgba(0,212,251,0.05) 0%, rgba(10,15,28,0.94) 12%, rgba(10,15,28,0.97) 100%)',
          boxShadow: '0 0 50px rgba(0,212,251,0.05), 0 24px 48px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <AppPanel activeView={activeView} onViewChange={onViewChange} isMorphing={false} panelRef={useRef(null)} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — ProductHeroAnimation
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [activeTabId, setActiveTabId] = useState('t01');
  const [liftedTabId, setLiftedTabId] = useState<string | null>(null);
  const [morphData, setMorphData] = useState<MorphData | null>(null);
  const [entrancePhase, setEntrancePhase] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const morphTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const shouldAnimate = !shouldReduceMotion;

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.85, 0]);
  const sectionScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.98, 0.94]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting), { threshold: 0.05 });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Entrance animation
  useEffect(() => {
    if (!shouldAnimate) { setEntrancePhase(2); return; }
    if (!isVisible) return;
    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;
      if (elapsed <= 1.4) { setEntrancePhase(elapsed); rafRef.current = requestAnimationFrame(tick); }
      else setEntrancePhase(2);
    };
    const id = setTimeout(() => { rafRef.current = requestAnimationFrame(tick); }, 50);
    return () => { clearTimeout(id); cancelAnimationFrame(rafRef.current); };
  }, [shouldAnimate, isVisible]);

  useEffect(() => {
    const h = () => { if (document.hidden) cancelAnimationFrame(rafRef.current); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDesktop || shouldReduceMotion) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMousePos({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 });
  }, [isDesktop, shouldReduceMotion]);

  const handleTabClick = useCallback((tab: Tab, el: HTMLButtonElement) => {
    if (morphData || tab.id === activeTabId) return;
    const tabRect = el.getBoundingClientRect();
    const panelEl = panelRef.current;
    const viewMeta = VIEW_MAP[tab.view];

    if (!shouldAnimate || !panelEl) {
      setActiveTabId(tab.id);
      setActiveView(tab.view);
      return;
    }

    const pRect = panelEl.getBoundingClientRect();
    setLiftedTabId(tab.id);
    setMorphData({
      from: { x: tabRect.left, y: tabRect.top, w: tabRect.width, h: tabRect.height },
      to: { x: pRect.left, y: pRect.top, w: pRect.width, h: pRect.height },
      glow: viewMeta.glow,
    });

    // Update the view partway through the morph for smooth content transition
    morphTimeoutRef.current = setTimeout(() => {
      setActiveTabId(tab.id);
      setActiveView(tab.view);
    }, 200);
  }, [activeTabId, morphData, shouldAnimate]);

  const handleMorphDone = useCallback(() => {
    setMorphData(null);
    setLiftedTabId(null);
  }, []);

  const handleViewChange = useCallback((v: ViewId) => {
    setActiveView(v);
    const match = TABS.find((t) => t.view === v);
    if (match) setActiveTabId(match.id);
  }, []);

  useEffect(() => () => { if (morphTimeoutRef.current) clearTimeout(morphTimeoutRef.current); }, []);

  return (
    <motion.section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        height: isDesktop ? '96vh' : '82vh',
        minHeight: isDesktop ? '780px' : '560px',
        maxHeight: '1120px',
        opacity: sectionOpacity,
        scale: sectionScale,
      }}
      onMouseMove={handleMouseMove}
      role="presentation"
    >
      <GrainOverlay />

      <div aria-hidden className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[60%] rounded-full blur-[140px] opacity-[0.14]" style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.3), transparent 70%)' }} />
        <div className="absolute bottom-[-5%] right-[-3%] w-[45%] h-[55%] rounded-full blur-[120px] opacity-[0.10]" style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.25), transparent 70%)' }} />
      </div>

      <div className="absolute inset-0">
        {isDesktop ? (
          <DesktopScene
            activeView={activeView}
            activeTabId={activeTabId}
            liftedTabId={liftedTabId}
            onTabClick={handleTabClick}
            onViewChange={handleViewChange}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
            shouldAnimate={shouldAnimate}
            entranceProgress={entrancePhase}
            isMorphing={!!morphData}
            tabRefs={tabRefs}
            panelRef={panelRef}
          />
        ) : (
          <MobileLayout activeView={activeView} onViewChange={handleViewChange} />
        )}
      </div>

      {/* Morph overlay (portal) */}
      {mounted && morphData && <MorphOverlay morph={morphData} onDone={handleMorphDone} />}

      {/* Scroll indicator */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={shouldAnimate ? { duration: 0.8, delay: 1.2 } : { duration: 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20"
      >
        <div className="text-[12px] tracking-[0.25em] text-white/15 uppercase">Scroll</div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="animate-bounce opacity-20">
          <path d="M7 2v10M3 8l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO COPY — below the animation
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHeroCopy() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  return (
    <section className="relative py-20 lg:py-28">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,251,0.18) 50%, transparent 100%)' }} />

      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={sa ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={sa ? { duration: duration.slow } : { duration: 0 }}
          className="text-[12px] tracking-[0.3em] text-white/22 uppercase font-mono mb-6"
        >
          001 — Product
        </motion.div>

        <motion.div
          initial={sa ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={sa ? { duration: duration.slow, delay: 0.1 } : { duration: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/[0.08] border border-cyan-500/22 mb-8 mx-auto"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-medium tracking-wide">Compliance Operating System</span>
        </motion.div>

        <motion.h1
          initial={sa ? { opacity: 0, y: 24 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={sa ? { duration: duration.slower, delay: 0.15 } : { duration: 0 }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 leading-[1.05] tracking-tight text-white"
        >
          Your team&apos;s command center
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">for compliance.</span>
        </motion.h1>

        <motion.p
          initial={sa ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={sa ? { duration: duration.slower, delay: 0.25 } : { duration: 0 }}
          className="text-lg sm:text-xl text-slate-400 mb-6 max-w-2xl mx-auto leading-relaxed"
        >
          Transform regulatory obligations into structured controls, owned actions, and audit-ready outcomes — in real time.
        </motion.p>

        <motion.p
          initial={sa ? { opacity: 0, y: 10 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={sa ? { duration: duration.slower, delay: 0.3 } : { duration: 0 }}
          className="text-sm text-slate-500 mb-10 max-w-xl mx-auto"
        >
          Used by compliance teams. Aligned to ISO &amp; SOC frameworks. Built for audit defensibility.
        </motion.p>

        <motion.div
          initial={sa ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={sa ? { duration: duration.slower, delay: 0.35 } : { duration: 0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <motion.a
            href={`${appBase}/auth/signup`}
            whileHover={sa ? { scale: 1.03, boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)' } : undefined}
            whileTap={sa ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-primary group px-10 py-4 text-base"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.a>
          <motion.a
            href="/contact"
            whileHover={sa ? { scale: 1.03 } : undefined}
            whileTap={sa ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-secondary group px-10 py-4 text-base"
          >
            <span>Request Demo</span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={sa ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={sa ? { duration: duration.slower, delay: 0.45 } : { duration: 0 }}
          className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500"
        >
          {[
            { label: 'Structured Controls', color: 'bg-cyan-400' },
            { label: 'Owned Actions', color: 'bg-blue-400' },
            { label: 'Live Evidence', color: 'bg-violet-400' },
          ].map((chip) => (
            <span key={chip.label} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07]">
              <span className={`w-1.5 h-1.5 rounded-full ${chip.color}/60`} />
              {chip.label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════════════════════ */

export default ProductHeroAnimation;
