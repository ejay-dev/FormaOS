'use client';

/**
 * ProductHeroLargeObject v5 — Premium scrollable-stack hero for /product
 *
 * Architecture:
 *   - 24 scrollable tab cards in a vertical stack (left) with inertia physics
 *   - Full interactive app window (right) with 6 distinct views
 *   - Mouse parallax, depth blur, light sweep, grain overlay
 *   - All text ≥12px effective on desktop; brighter contrast
 *   - CSS 3D transforms only — GPU-composited, no WebGL/canvas
 *   - prefers-reduced-motion: static final state
 *   - IntersectionObserver pauses offscreen
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/* ═══════════════════════════════════════════════════════════════════════
   VIEW TYPES & DATA
   ═══════════════════════════════════════════════════════════════════════ */

type ViewId = 'dashboard' | 'evidence' | 'controls' | 'reports' | 'risk' | 'policies';

interface ViewConfig {
  id: ViewId;
  label: string;
  icon: string;
  accentClass: string;
  dotClass: string;
}

const VIEWS: ViewConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◫', accentClass: 'text-cyan-300', dotClass: 'bg-cyan-400' },
  { id: 'evidence', label: 'Evidence', icon: '◉', accentClass: 'text-violet-300', dotClass: 'bg-violet-400' },
  { id: 'controls', label: 'Controls', icon: '⬡', accentClass: 'text-blue-300', dotClass: 'bg-blue-400' },
  { id: 'reports', label: 'Reports', icon: '◈', accentClass: 'text-emerald-300', dotClass: 'bg-emerald-400' },
  { id: 'risk', label: 'Risk', icon: '△', accentClass: 'text-amber-300', dotClass: 'bg-amber-400' },
  { id: 'policies', label: 'Policies', icon: '▣', accentClass: 'text-rose-300', dotClass: 'bg-rose-400' },
];

/* ── Tab card data: 24 cards representing different compliance modules ── */

interface TabCard {
  id: string;
  viewId: ViewId;
  title: string;
  stat: string;
  subtitle: string;
  accentClass: string;
  borderColor: string;
  gradient: string;
}

const TAB_CARDS: TabCard[] = [
  { id: 't1', viewId: 'dashboard', title: 'Compliance Score', stat: '94%', subtitle: 'Overall posture', accentClass: 'text-cyan-300', borderColor: 'rgba(0,212,251,0.18)', gradient: 'linear-gradient(135deg, rgba(0,212,251,0.10) 0%, rgba(51,153,255,0.05) 100%)' },
  { id: 't2', viewId: 'evidence', title: 'Evidence Vault', stat: '1,247', subtitle: 'Artifacts collected', accentClass: 'text-violet-300', borderColor: 'rgba(160,131,255,0.15)', gradient: 'linear-gradient(135deg, rgba(160,131,255,0.10) 0%, rgba(51,153,255,0.05) 100%)' },
  { id: 't3', viewId: 'controls', title: 'Control Mapping', stat: '142/156', subtitle: 'Controls mapped', accentClass: 'text-blue-300', borderColor: 'rgba(51,153,255,0.15)', gradient: 'linear-gradient(135deg, rgba(51,153,255,0.10) 0%, rgba(0,212,251,0.05) 100%)' },
  { id: 't4', viewId: 'reports', title: 'Audit Reports', stat: '12', subtitle: 'Generated Q1', accentClass: 'text-emerald-300', borderColor: 'rgba(52,211,153,0.14)', gradient: 'linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(51,153,255,0.05) 100%)' },
  { id: 't5', viewId: 'risk', title: 'Risk Register', stat: '4', subtitle: 'Open items', accentClass: 'text-amber-300', borderColor: 'rgba(251,191,36,0.14)', gradient: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(51,153,255,0.04) 100%)' },
  { id: 't6', viewId: 'policies', title: 'Policy Library', stat: '38', subtitle: 'Active policies', accentClass: 'text-rose-300', borderColor: 'rgba(251,113,133,0.14)', gradient: 'linear-gradient(135deg, rgba(251,113,133,0.08) 0%, rgba(160,131,255,0.04) 100%)' },
  { id: 't7', viewId: 'dashboard', title: 'Task Tracker', stat: '23', subtitle: 'Active tasks', accentClass: 'text-cyan-300', borderColor: 'rgba(0,212,251,0.14)', gradient: 'linear-gradient(135deg, rgba(0,212,251,0.08) 0%, rgba(51,153,255,0.04) 100%)' },
  { id: 't8', viewId: 'evidence', title: 'Audit Trail', stat: '8,412', subtitle: 'Log entries', accentClass: 'text-violet-300', borderColor: 'rgba(160,131,255,0.12)', gradient: 'linear-gradient(135deg, rgba(160,131,255,0.08) 0%, rgba(51,153,255,0.04) 100%)' },
  { id: 't9', viewId: 'controls', title: 'Framework Coverage', stat: '91%', subtitle: 'SOC 2 + ISO', accentClass: 'text-blue-300', borderColor: 'rgba(51,153,255,0.12)', gradient: 'linear-gradient(135deg, rgba(51,153,255,0.08) 0%, rgba(0,212,251,0.04) 100%)' },
  { id: 't10', viewId: 'reports', title: 'Board Reports', stat: '3', subtitle: 'Ready to send', accentClass: 'text-emerald-300', borderColor: 'rgba(52,211,153,0.12)', gradient: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(51,153,255,0.04) 100%)' },
  { id: 't11', viewId: 'risk', title: 'Vendor Risk', stat: '7', subtitle: 'Assessments due', accentClass: 'text-amber-300', borderColor: 'rgba(251,191,36,0.12)', gradient: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(51,153,255,0.03) 100%)' },
  { id: 't12', viewId: 'policies', title: 'Review Queue', stat: '5', subtitle: 'Policies pending', accentClass: 'text-rose-300', borderColor: 'rgba(251,113,133,0.12)', gradient: 'linear-gradient(135deg, rgba(251,113,133,0.06) 0%, rgba(160,131,255,0.03) 100%)' },
  { id: 't13', viewId: 'dashboard', title: 'Team Activity', stat: '156', subtitle: 'Actions this week', accentClass: 'text-cyan-300', borderColor: 'rgba(0,212,251,0.12)', gradient: 'linear-gradient(135deg, rgba(0,212,251,0.07) 0%, rgba(51,153,255,0.03) 100%)' },
  { id: 't14', viewId: 'evidence', title: 'Evidence Gap', stat: '8', subtitle: 'Missing artifacts', accentClass: 'text-violet-300', borderColor: 'rgba(160,131,255,0.10)', gradient: 'linear-gradient(135deg, rgba(160,131,255,0.07) 0%, rgba(51,153,255,0.03) 100%)' },
  { id: 't15', viewId: 'controls', title: 'SOC 2 Type II', stat: '98%', subtitle: 'Readiness', accentClass: 'text-blue-300', borderColor: 'rgba(51,153,255,0.10)', gradient: 'linear-gradient(135deg, rgba(51,153,255,0.07) 0%, rgba(0,212,251,0.03) 100%)' },
  { id: 't16', viewId: 'reports', title: 'Gap Analysis', stat: '2', subtitle: 'In progress', accentClass: 'text-emerald-300', borderColor: 'rgba(52,211,153,0.10)', gradient: 'linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(51,153,255,0.03) 100%)' },
  { id: 't17', viewId: 'risk', title: 'Incident Log', stat: '0', subtitle: 'Active incidents', accentClass: 'text-amber-300', borderColor: 'rgba(251,191,36,0.10)', gradient: 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(51,153,255,0.03) 100%)' },
  { id: 't18', viewId: 'policies', title: 'Compliance Calendar', stat: '14', subtitle: 'Upcoming deadlines', accentClass: 'text-rose-300', borderColor: 'rgba(251,113,133,0.10)', gradient: 'linear-gradient(135deg, rgba(251,113,133,0.05) 0%, rgba(160,131,255,0.03) 100%)' },
  { id: 't19', viewId: 'dashboard', title: 'Notifications', stat: '7', subtitle: 'Unread alerts', accentClass: 'text-cyan-300', borderColor: 'rgba(0,212,251,0.10)', gradient: 'linear-gradient(135deg, rgba(0,212,251,0.06) 0%, rgba(51,153,255,0.03) 100%)' },
  { id: 't20', viewId: 'evidence', title: 'Automated Collection', stat: '12', subtitle: 'Active integrations', accentClass: 'text-violet-300', borderColor: 'rgba(160,131,255,0.10)', gradient: 'linear-gradient(135deg, rgba(160,131,255,0.06) 0%, rgba(51,153,255,0.03) 100%)' },
  { id: 't21', viewId: 'controls', title: 'ISO 27001', stat: '87%', subtitle: 'Annex A coverage', accentClass: 'text-blue-300', borderColor: 'rgba(51,153,255,0.10)', gradient: 'linear-gradient(135deg, rgba(51,153,255,0.06) 0%, rgba(0,212,251,0.03) 100%)' },
  { id: 't22', viewId: 'reports', title: 'Compliance Trends', stat: '+12%', subtitle: 'Month over month', accentClass: 'text-emerald-300', borderColor: 'rgba(52,211,153,0.10)', gradient: 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(51,153,255,0.03) 100%)' },
  { id: 't23', viewId: 'risk', title: 'Third-Party Risk', stat: '3', subtitle: 'Vendors flagged', accentClass: 'text-amber-300', borderColor: 'rgba(251,191,36,0.10)', gradient: 'linear-gradient(135deg, rgba(251,191,36,0.05) 0%, rgba(51,153,255,0.03) 100%)' },
  { id: 't24', viewId: 'policies', title: 'Access Reviews', stat: '2', subtitle: 'Overdue reviews', accentClass: 'text-rose-300', borderColor: 'rgba(251,113,133,0.10)', gradient: 'linear-gradient(135deg, rgba(251,113,133,0.05) 0%, rgba(160,131,255,0.03) 100%)' },
];

/* ── View-specific data ── */

const DASHBOARD_TASKS = [
  { title: 'Review SOC 2 Type II controls', assignee: 'AK', status: 'In Progress', color: 'bg-cyan-400/60', pct: 72 },
  { title: 'Upload penetration test report', assignee: 'SM', status: 'Pending', color: 'bg-amber-400/60', pct: 0 },
  { title: 'Map ISO 27001 Annex A controls', assignee: 'JR', status: 'Complete', color: 'bg-emerald-400/60', pct: 100 },
  { title: 'Vendor risk assessment — Stripe', assignee: 'LW', status: 'In Review', color: 'bg-blue-400/60', pct: 88 },
  { title: 'Incident response plan update', assignee: 'TP', status: 'In Progress', color: 'bg-cyan-400/60', pct: 45 },
  { title: 'Update data retention policy', assignee: 'AK', status: 'Pending', color: 'bg-amber-400/60', pct: 0 },
];

const EVIDENCE_ITEMS = [
  { name: 'SOC2-AuditLog-2026Q1.pdf', type: 'PDF', size: '2.4 MB', date: 'Feb 14', tag: 'SOC 2' },
  { name: 'PenTest-Report-External.pdf', type: 'PDF', size: '5.1 MB', date: 'Feb 10', tag: 'ISO 27001' },
  { name: 'AccessReview-Jan2026.xlsx', type: 'XLSX', size: '890 KB', date: 'Feb 8', tag: 'Access' },
  { name: 'IncidentResponse-Runbook-v3.md', type: 'MD', size: '124 KB', date: 'Feb 5', tag: 'IR' },
  { name: 'VendorDueDiligence-Stripe.pdf', type: 'PDF', size: '1.8 MB', date: 'Feb 1', tag: 'Vendor' },
  { name: 'DataClassification-Matrix.xlsx', type: 'XLSX', size: '340 KB', date: 'Jan 28', tag: 'Data' },
];

const CONTROLS_LIST = [
  { code: 'CC6.1', name: 'Logical Access Controls', status: 'Mapped', framework: 'SOC 2' },
  { code: 'CC7.2', name: 'System Monitoring', status: 'Mapped', framework: 'SOC 2' },
  { code: 'A.8.1', name: 'Asset Inventory', status: 'Partial', framework: 'ISO 27001' },
  { code: 'A.12.4', name: 'Logging & Monitoring', status: 'Mapped', framework: 'ISO 27001' },
  { code: 'CC3.1', name: 'Risk Assessment Process', status: 'Unmapped', framework: 'SOC 2' },
  { code: 'A.9.2', name: 'User Access Management', status: 'Mapped', framework: 'ISO 27001' },
];

const REPORT_ITEMS = [
  { name: 'Board Readiness Report — Q1 2026', status: 'Final', date: 'Feb 15', pages: 24 },
  { name: 'SOC 2 Type II Gap Analysis', status: 'Draft', date: 'Feb 12', pages: 18 },
  { name: 'Vendor Risk Summary', status: 'Final', date: 'Feb 8', pages: 12 },
  { name: 'Incident Response Metrics', status: 'In Review', date: 'Feb 5', pages: 9 },
  { name: 'Quarterly Compliance Digest', status: 'Final', date: 'Jan 31', pages: 16 },
];

const RISK_ITEMS = [
  { name: 'Unpatched CVE in auth service', severity: 'High', age: '3d', owner: 'SM' },
  { name: 'Expired vendor NDA — Acme Corp', severity: 'Medium', age: '7d', owner: 'LW' },
  { name: 'Missing MFA for 2 admin accounts', severity: 'High', age: '1d', owner: 'AK' },
  { name: 'Overdue access review — Q4', severity: 'Low', age: '14d', owner: 'JR' },
  { name: 'Stale firewall rules — prod', severity: 'Medium', age: '5d', owner: 'TP' },
];

const POLICY_ITEMS = [
  { name: 'Information Security Policy', version: 'v4.2', status: 'Active', lastReview: 'Jan 15', owner: 'CISO' },
  { name: 'Acceptable Use Policy', version: 'v3.1', status: 'Active', lastReview: 'Dec 20', owner: 'HR' },
  { name: 'Data Retention Policy', version: 'v2.0', status: 'In Review', lastReview: 'Feb 10', owner: 'Legal' },
  { name: 'Incident Response Plan', version: 'v5.0', status: 'Active', lastReview: 'Jan 28', owner: 'Security' },
  { name: 'Vendor Management Policy', version: 'v1.3', status: 'Draft', lastReview: 'Feb 14', owner: 'Procurement' },
  { name: 'Access Control Policy', version: 'v3.0', status: 'Active', lastReview: 'Jan 5', owner: 'IT' },
];

const STATS_BY_VIEW: Record<ViewId, { label: string; value: string; sub: string }[]> = {
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
    { label: 'Open Risks', value: '5', sub: 'active items' },
    { label: 'High', value: '2', sub: 'critical' },
    { label: 'Posture', value: 'Low', sub: 'overall risk' },
  ],
  policies: [
    { label: 'Active', value: '34', sub: 'policies' },
    { label: 'In Review', value: '3', sub: 'pending' },
    { label: 'Overdue', value: '1', sub: 'needs update' },
  ],
};

const statusBadge: Record<string, string> = {
  Complete: 'bg-emerald-400/15 text-emerald-300',
  Pending: 'bg-amber-400/15 text-amber-300',
  'In Progress': 'bg-cyan-400/15 text-cyan-300',
  'In Review': 'bg-blue-400/15 text-blue-300',
  Mapped: 'bg-emerald-400/15 text-emerald-300',
  Partial: 'bg-amber-400/15 text-amber-300',
  Unmapped: 'bg-red-400/15 text-red-300',
  Final: 'bg-emerald-400/15 text-emerald-300',
  Draft: 'bg-slate-400/15 text-slate-300',
  Active: 'bg-emerald-400/15 text-emerald-300',
  High: 'bg-red-400/15 text-red-300',
  Medium: 'bg-amber-400/15 text-amber-300',
  Low: 'bg-emerald-400/15 text-emerald-300',
};

const VIEW_HEADERS: Record<ViewId, string> = {
  dashboard: 'Active Tasks',
  evidence: 'Recent Artifacts',
  controls: 'Control Mapping',
  reports: 'Recent Reports',
  risk: 'Open Risk Items',
  policies: 'Policy Library',
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
   INERTIA SCROLL HOOK — physics-based scrolling for the tab stack
   ═══════════════════════════════════════════════════════════════════════ */

function useInertiaScroll(itemCount: number, itemHeight: number, visibleHeight: number) {
  const scrollRef = useRef(0);
  const velocityRef = useRef(0);
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef(0);
  const lastWheelRef = useRef(0);
  const isAnimatingRef = useRef(false);

  const totalHeight = itemCount * itemHeight;
  const maxScroll = Math.max(0, totalHeight - visibleHeight);

  const animate = useCallback(() => {
    const pos = scrollRef.current;

    // Elastic bounds
    if (pos < 0) {
      scrollRef.current += (0 - pos) * 0.15;
      velocityRef.current *= 0.6;
    } else if (pos > maxScroll) {
      scrollRef.current += (maxScroll - pos) * 0.15;
      velocityRef.current *= 0.6;
    } else {
      // Friction
      velocityRef.current *= 0.92;
    }

    scrollRef.current += velocityRef.current;
    setScrollY(scrollRef.current);

    if (Math.abs(velocityRef.current) > 0.2 || pos < -2 || pos > maxScroll + 2) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      isAnimatingRef.current = false;
      // Snap to bounds
      scrollRef.current = Math.max(0, Math.min(maxScroll, scrollRef.current));
      setScrollY(scrollRef.current);
    }
  }, [maxScroll]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const now = Date.now();
    const dt = Math.max(8, now - lastWheelRef.current);
    lastWheelRef.current = now;

    const delta = e.deltaY * 0.6;
    velocityRef.current = delta * Math.min(1, 16 / dt);

    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { scrollY, handleWheel };
}

/* ═══════════════════════════════════════════════════════════════════════
   SCROLLABLE TAB STACK
   ═══════════════════════════════════════════════════════════════════════ */

const TAB_HEIGHT = 68;
const VISIBLE_TABS = 8;
const STACK_HEIGHT = TAB_HEIGHT * VISIBLE_TABS;

function ScrollableTabStack({
  activeCardId,
  onCardClick,
  shouldAnimate,
  entrancePhase,
}: {
  activeCardId: string;
  onCardClick: (card: TabCard) => void;
  shouldAnimate: boolean;
  entrancePhase: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY, handleWheel } = useInertiaScroll(TAB_CARDS.length, TAB_HEIGHT, STACK_HEIGHT);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const ease3 = (t: number) => 1 - Math.pow(1 - t, 3);
  const panelEntrance = shouldAnimate ? ease3(Math.min(1, entrancePhase / 0.8)) : 1;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        width: '420px',
        height: `${STACK_HEIGHT}px`,
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      {/* Light sweep overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'linear-gradient(170deg, transparent 30%, rgba(255,255,255,0.015) 48%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.015) 52%, transparent 70%)',
          animation: shouldAnimate ? 'lightSweep 6s ease-in-out infinite' : 'none',
        }}
      />

      <div
        className="absolute left-0 right-0"
        style={{
          transform: `translateY(${-scrollY}px)`,
          willChange: 'transform',
        }}
      >
        {TAB_CARDS.map((card, i) => {
          const cardTop = i * TAB_HEIGHT;
          const distFromCenter = Math.abs(cardTop - scrollY - STACK_HEIGHT / 2 + TAB_HEIGHT / 2);
          const depthBlur = Math.max(0, (distFromCenter - STACK_HEIGHT * 0.3) / (STACK_HEIGHT * 0.4));
          const isActive = card.id === activeCardId;
          const entranceDelay = shouldAnimate ? (1 - panelEntrance) * (60 + i * 8) : 0;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onCardClick(card)}
              className="absolute left-0 right-0 mx-2 flex items-center gap-3 px-5 overflow-hidden focus:outline-none group"
              style={{
                top: `${cardTop}px`,
                height: `${TAB_HEIGHT - 6}px`,
                borderRadius: '14px',
                background: card.gradient,
                border: `1px solid ${isActive ? 'rgba(0,212,251,0.35)' : card.borderColor}`,
                boxShadow: isActive
                  ? '0 0 24px rgba(0,212,251,0.12), 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
                  : '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
                filter: depthBlur > 0 ? `blur(${depthBlur * 3}px)` : 'none',
                opacity: Math.max(0.3, 1 - depthBlur * 0.7) * panelEntrance,
                transform: `translateY(${entranceDelay}px)`,
                backdropFilter: 'blur(8px)',
                willChange: 'transform, opacity, filter',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Glass reflection */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(168deg, rgba(255,255,255,0.04) 0%, transparent 35%)' }} />

              {/* Hover ring */}
              <div
                className={`absolute inset-0 rounded-[14px] pointer-events-none transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                style={{ boxShadow: 'inset 0 0 0 1px rgba(0,212,251,0.18)' }}
              />

              {/* Content */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] shrink-0 ${card.accentClass}`} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {VIEWS.find((v) => v.id === card.viewId)?.icon ?? '◫'}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] text-white/70 font-medium truncate leading-tight">{card.title}</div>
                <div className="text-[12px] text-white/30 truncate leading-tight mt-0.5">{card.subtitle}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-[16px] font-bold ${card.accentClass}`}>{card.stat}</div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${VIEWS.find((v) => v.id === card.viewId)?.dotClass ?? 'bg-white/30'}`} style={{ opacity: 0.5 }} />
            </button>
          );
        })}
      </div>

      {/* Scroll track */}
      <div className="absolute right-0 top-[8%] bottom-[8%] w-[3px] rounded-full bg-white/[0.04] z-20">
        <div
          className="absolute top-0 w-full rounded-full bg-white/[0.12] transition-[height,top] duration-75"
          style={{
            height: `${Math.max(20, (STACK_HEIGHT / (TAB_CARDS.length * TAB_HEIGHT)) * 100)}%`,
            top: `${(scrollY / Math.max(1, TAB_CARDS.length * TAB_HEIGHT - STACK_HEIGHT)) * (100 - Math.max(20, (STACK_HEIGHT / (TAB_CARDS.length * TAB_HEIGHT)) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   APP WINDOW — fully interactive, 6 views, bigger text
   ═══════════════════════════════════════════════════════════════════════ */

function AppWindow({ activeView, onViewChange }: { activeView: ViewId; onViewChange: (v: ViewId) => void }) {
  const view = VIEWS.find((v) => v.id === activeView)!;
  const stats = STATS_BY_VIEW[activeView];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/50" />
            <div className="w-3 h-3 rounded-full bg-amber-400/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/50" />
          </div>
          <div className="text-[12px] text-white/25 font-mono tracking-wider ml-1">
            app.formaos.com.au / {activeView}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-24 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center px-2.5 cursor-pointer hover:border-white/[0.12] transition-colors">
            <div className="text-[12px] text-white/20">Search…</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/20 flex items-center justify-center">
            <span className="text-[12px] font-bold text-white/60">FO</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-[160px] shrink-0 border-r border-white/[0.06] bg-white/[0.015] py-4 px-3 flex flex-col">
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
            {[{ name: 'Settings', icon: '⚙' }, { name: 'Help', icon: '?' }].map((item) => (
              <div key={item.name} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[12px] text-white/25 hover:text-white/40 cursor-pointer transition-colors">
                <span className="text-[13px] opacity-50 w-4 text-center">{item.icon}</span>
                <span>{item.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-2.5 mt-3 pt-3 border-t border-white/[0.06]">
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
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[16px] font-semibold text-white/80 mb-0.5">{view.label}</div>
              <div className="text-[12px] text-white/25">Last synced 2 min ago</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-[12px] text-white/30 cursor-pointer hover:bg-white/[0.06] transition-colors">
                Export
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-cyan-400/12 border border-cyan-400/25 text-[12px] text-cyan-300 cursor-pointer hover:bg-cyan-400/18 transition-colors">
                + New
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-3 hover:border-white/[0.12] transition-colors cursor-default">
                <div className="text-[12px] text-white/25 mb-1 uppercase tracking-wider">{stat.label}</div>
                <div className="text-[18px] font-bold text-white/80 mb-0.5">{stat.value}</div>
                <div className="text-[12px] text-white/18">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Content header */}
          <div className="text-[12px] text-white/25 mb-3 font-medium uppercase tracking-wider">
            {VIEW_HEADERS[activeView]}
          </div>

          {/* View content with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-1.5 overflow-y-auto"
              style={{ maxHeight: '220px' }}
            >
              {activeView === 'dashboard' && DASHBOARD_TASKS.map((task) => (
                <div
                  key={task.title}
                  className="flex items-center gap-2.5 rounded-lg border bg-white/[0.015] border-white/[0.04] px-3.5 py-2 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-150"
                >
                  <div className={`w-2 h-2 rounded-full ${task.color} shrink-0`} />
                  <div className="flex-1 min-w-0"><div className="text-[13px] text-white/55 truncate">{task.title}</div></div>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-500/30 to-slate-700/30 flex items-center justify-center shrink-0 border border-white/[0.05]">
                    <span className="text-[12px] font-semibold text-white/40">{task.assignee}</span>
                  </div>
                  <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${statusBadge[task.status] ?? ''}`}>{task.status}</div>
                  {task.pct > 0 && task.pct < 100 && (
                    <div className="w-12 h-1.5 rounded-full bg-white/[0.05] overflow-hidden shrink-0">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-400/40 to-blue-400/25" style={{ width: `${task.pct}%` }} />
                    </div>
                  )}
                </div>
              ))}

              {activeView === 'evidence' && EVIDENCE_ITEMS.map((item) => (
                <div key={item.name} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3.5 py-2 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-150">
                  <div className="w-7 h-7 rounded-lg bg-violet-400/12 flex items-center justify-center shrink-0">
                    <span className="text-[12px] text-violet-300 font-mono">{item.type}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white/55 truncate">{item.name}</div>
                    <div className="text-[12px] text-white/20">{item.size} · {item.date}</div>
                  </div>
                  <div className="text-[12px] px-2 py-0.5 rounded-full bg-violet-400/12 text-violet-300 shrink-0">{item.tag}</div>
                </div>
              ))}

              {activeView === 'controls' && CONTROLS_LIST.map((c) => (
                <div key={c.code} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3.5 py-2 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-150">
                  <div className="text-[12px] font-mono text-blue-300/70 w-12 shrink-0">{c.code}</div>
                  <div className="flex-1 min-w-0"><div className="text-[13px] text-white/55 truncate">{c.name}</div></div>
                  <div className="text-[12px] text-white/20 shrink-0">{c.framework}</div>
                  <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${statusBadge[c.status] ?? ''}`}>{c.status}</div>
                </div>
              ))}

              {activeView === 'reports' && REPORT_ITEMS.map((r) => (
                <div key={r.name} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3.5 py-2 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-150">
                  <div className="w-7 h-7 rounded-lg bg-emerald-400/12 flex items-center justify-center shrink-0">
                    <span className="text-[13px] text-emerald-300">◈</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white/55 truncate">{r.name}</div>
                    <div className="text-[12px] text-white/20">{r.date} · {r.pages} pages</div>
                  </div>
                  <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${statusBadge[r.status] ?? ''}`}>{r.status}</div>
                </div>
              ))}

              {activeView === 'risk' && RISK_ITEMS.map((r) => (
                <div key={r.name} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3.5 py-2 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-150">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${r.severity === 'High' ? 'bg-red-400/70' : r.severity === 'Medium' ? 'bg-amber-400/70' : 'bg-emerald-400/70'}`} />
                  <div className="flex-1 min-w-0"><div className="text-[13px] text-white/55 truncate">{r.name}</div></div>
                  <div className="text-[12px] text-white/20 shrink-0">{r.age}</div>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-500/30 to-slate-700/30 flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-semibold text-white/40">{r.owner}</span>
                  </div>
                  <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${statusBadge[r.severity] ?? ''}`}>{r.severity}</div>
                </div>
              ))}

              {activeView === 'policies' && POLICY_ITEMS.map((p) => (
                <div key={p.name} className="flex items-center gap-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3.5 py-2 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-150">
                  <div className="w-7 h-7 rounded-lg bg-rose-400/10 flex items-center justify-center shrink-0">
                    <span className="text-[13px] text-rose-300">▣</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white/55 truncate">{p.name}</div>
                    <div className="text-[12px] text-white/20">{p.version} · {p.lastReview} · {p.owner}</div>
                  </div>
                  <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${statusBadge[p.status] ?? ''}`}>{p.status}</div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MICROCOPY CALLOUTS
   ═══════════════════════════════════════════════════════════════════════ */

const CALLOUTS = [
  { text: 'Immutable evidence chains', x: '2%', y: '16%', align: 'left' as const },
  { text: 'ISO / SOC framework mapped', x: '1%', y: '72%', align: 'left' as const },
  { text: 'Live posture monitoring', x: '84%', y: '10%', align: 'right' as const },
  { text: 'Role-based access controls', x: '82%', y: '80%', align: 'right' as const },
  { text: 'Automated evidence collection', x: '2%', y: '44%', align: 'left' as const },
  { text: 'Real-time compliance scoring', x: '83%', y: '45%', align: 'right' as const },
];

function MicrocopyCallouts({ shouldAnimate }: { shouldAnimate: boolean }) {
  return (
    <>
      {CALLOUTS.map((c, i) => (
        <motion.div
          key={c.text}
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={shouldAnimate ? { duration: 0.8, delay: 0.6 + i * 0.12 } : { duration: 0 }}
          className="absolute hidden lg:flex items-center gap-2 pointer-events-none z-10"
          style={{ left: c.x, top: c.y }}
        >
          {c.align === 'left' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/35 shrink-0" />}
          <span className="text-[12px] tracking-wide text-white/20 whitespace-nowrap">{c.text}</span>
          {c.align === 'right' && <div className="w-1.5 h-1.5 rounded-full bg-violet-400/35 shrink-0" />}
        </motion.div>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO COMPOSITION — desktop 3D layout
   ═══════════════════════════════════════════════════════════════════════ */

function HeroComposition({
  activeView,
  activeCardId,
  onCardClick,
  onViewChange,
  mouseX,
  mouseY,
  shouldAnimate,
  entrancePhase,
}: {
  activeView: ViewId;
  activeCardId: string;
  onCardClick: (card: TabCard) => void;
  onViewChange: (v: ViewId) => void;
  mouseX: number;
  mouseY: number;
  shouldAnimate: boolean;
  entrancePhase: number;
}) {
  const parallaxX = shouldAnimate ? mouseX * 4 : 0;
  const parallaxY = shouldAnimate ? mouseY * 2.5 : 0;
  const ease3 = (t: number) => 1 - Math.pow(1 - t, 3);
  const windowEntrance = shouldAnimate ? ease3(Math.min(1, Math.max(0, (entrancePhase - 0.3) / 0.6))) : 1;

  return (
    <div className="relative w-full h-full" style={{ perspective: '1800px' }}>
      {/* Ambient glows — brighter */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[15%] left-[8%] w-[40%] h-[50%] rounded-full blur-[120px] opacity-[0.22]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.35), transparent 70%)' }}
        />
        <div
          className="absolute top-[40%] left-[55%] w-[35%] h-[40%] rounded-full blur-[100px] opacity-[0.18]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.3), transparent 70%)' }}
        />
        <div
          className="absolute bottom-[10%] left-[30%] w-[30%] h-[35%] rounded-full blur-[90px] opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(251,113,133,0.2), transparent 70%)' }}
        />
      </div>

      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.045]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 0.5px, transparent 0)', backgroundSize: '40px 40px' }}
      />

      {/* 3D scene */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${8 + parallaxY}deg) rotateY(${-10 + parallaxX}deg)`,
          transition: shouldAnimate ? 'transform 0.1s linear' : 'none',
        }}
      >
        {/* Tab stack — left side */}
        <div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate3d(-340px, 0px, -10px) rotateX(2deg) rotateY(-6deg)`,
          }}
        >
          <ScrollableTabStack
            activeCardId={activeCardId}
            onCardClick={onCardClick}
            shouldAnimate={shouldAnimate}
            entrancePhase={entrancePhase}
          />
        </div>

        {/* App window — right side, larger */}
        <div
          className="absolute overflow-hidden"
          style={{
            width: '860px',
            height: '580px',
            left: '50%',
            top: '50%',
            borderRadius: '20px',
            transform: `translate(-50%, -50%) translate3d(220px, ${(1 - windowEntrance) * 40}px, 50px) rotateX(1deg) rotateY(-2deg)`,
            background: 'linear-gradient(145deg, rgba(0,212,251,0.06) 0%, rgba(10,15,28,0.94) 12%, rgba(10,15,28,0.97) 100%)',
            border: '1px solid rgba(0,212,251,0.18)',
            boxShadow: '0 0 80px rgba(0,212,251,0.08), 0 40px 80px rgba(0,0,0,0.35), 0 80px 120px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
            backdropFilter: 'blur(24px) saturate(1.1)',
            opacity: windowEntrance,
            willChange: 'transform, opacity',
            zIndex: 20,
          }}
        >
          {/* Glass reflection */}
          <div className="absolute inset-0 pointer-events-none rounded-[20px]" style={{ background: 'linear-gradient(170deg, rgba(255,255,255,0.05) 0%, transparent 22%)' }} />
          <AppWindow activeView={activeView} onViewChange={onViewChange} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MOBILE LAYOUT
   ═══════════════════════════════════════════════════════════════════════ */

function MobileHeroVisual({ activeView, onViewChange }: { activeView: ViewId; onViewChange: (v: ViewId) => void }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      {/* View tabs */}
      <div className="flex gap-1.5 mb-4 z-10 overflow-x-auto pb-1" style={{ maxWidth: '100%' }}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onViewChange(v.id)}
            className={`px-3 py-2 rounded-lg text-[13px] shrink-0 transition-all duration-150 border ${
              activeView === v.id
                ? 'bg-cyan-400/12 text-cyan-300 border-cyan-400/25'
                : 'bg-white/[0.03] text-white/35 border-white/[0.07] hover:text-white/55'
            }`}
          >
            <span className="mr-1.5">{v.icon}</span>
            {v.label}
          </button>
        ))}
      </div>

      {/* App window */}
      <div
        className="relative w-full max-w-[480px] rounded-2xl border border-cyan-400/15 overflow-hidden"
        style={{
          height: '400px',
          background: 'linear-gradient(145deg, rgba(0,212,251,0.06) 0%, rgba(10,15,28,0.92) 12%, rgba(10,15,28,0.96) 100%)',
          boxShadow: '0 0 50px rgba(0,212,251,0.05), 0 24px 48px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <AppWindow activeView={activeView} onViewChange={onViewChange} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FULL-BLEED ANIMATION SECTION (exported)
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [activeCardId, setActiveCardId] = useState('t1');
  const [entrancePhase, setEntrancePhase] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const shouldAnimate = !shouldReduceMotion;

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.85, 0]);
  const sectionScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.98, 0.94]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.05 });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Entrance animation (~1.2s)
  useEffect(() => {
    if (!shouldAnimate) { setEntrancePhase(2); return; }
    if (!isVisible) return;

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;
      if (elapsed <= 1.4) {
        setEntrancePhase(elapsed);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setEntrancePhase(2);
      }
    };

    const id = setTimeout(() => { rafRef.current = requestAnimationFrame(tick); }, 50);
    return () => { clearTimeout(id); cancelAnimationFrame(rafRef.current); };
  }, [shouldAnimate, isVisible]);

  useEffect(() => {
    const handler = () => { if (document.hidden) cancelAnimationFrame(rafRef.current); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDesktop || shouldReduceMotion) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMousePos({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 });
    },
    [isDesktop, shouldReduceMotion],
  );

  const handleCardClick = useCallback((card: TabCard) => {
    setActiveCardId(card.id);
    setActiveView(card.viewId);
  }, []);

  const handleViewChange = useCallback((v: ViewId) => {
    setActiveView(v);
    // Also update active card to first matching card
    const match = TAB_CARDS.find((c) => c.viewId === v);
    if (match) setActiveCardId(match.id);
  }, []);

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
      {/* CSS keyframe for light sweep */}
      <style>{`
        @keyframes lightSweep {
          0%, 100% { transform: translateX(-100%) rotate(15deg); }
          50% { transform: translateX(100%) rotate(15deg); }
        }
      `}</style>

      <GrainOverlay />

      {/* Background glows */}
      <div aria-hidden className="absolute inset-0">
        <div
          className="absolute top-[-10%] left-[-5%] w-[50%] h-[60%] rounded-full blur-[140px] opacity-[0.15]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.3), transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-5%] right-[-3%] w-[45%] h-[55%] rounded-full blur-[120px] opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.25), transparent 70%)' }}
        />
      </div>

      <MicrocopyCallouts shouldAnimate={shouldAnimate} />

      <div className="absolute inset-0">
        {isDesktop ? (
          <HeroComposition
            activeView={activeView}
            activeCardId={activeCardId}
            onCardClick={handleCardClick}
            onViewChange={handleViewChange}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
            shouldAnimate={shouldAnimate}
            entrancePhase={entrancePhase}
          />
        ) : (
          <MobileHeroVisual activeView={activeView} onViewChange={handleViewChange} />
        )}
      </div>

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
   HERO COPY SECTION — rendered BELOW the animation
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHeroCopy() {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion;

  return (
    <section className="relative py-20 lg:py-28">
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,251,0.18) 50%, transparent 100%)' }}
      />

      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slow } : { duration: 0 }}
          className="text-[12px] tracking-[0.3em] text-white/22 uppercase font-mono mb-6"
        >
          001 — Product
        </motion.div>

        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slow, delay: 0.1 } : { duration: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/[0.08] border border-cyan-500/22 mb-8 mx-auto"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-medium tracking-wide">Compliance Operating System</span>
        </motion.div>

        <motion.h1
          initial={shouldAnimate ? { opacity: 0, y: 24 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.15 } : { duration: 0 }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 leading-[1.05] tracking-tight text-white"
        >
          Your team&apos;s command center
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            for compliance.
          </span>
        </motion.h1>

        <motion.p
          initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.25 } : { duration: 0 }}
          className="text-lg sm:text-xl text-slate-400 mb-6 max-w-2xl mx-auto leading-relaxed"
        >
          Transform regulatory obligations into structured controls, owned actions, and audit-ready outcomes — in real time.
        </motion.p>

        <motion.p
          initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.3 } : { duration: 0 }}
          className="text-sm text-slate-500 mb-10 max-w-xl mx-auto"
        >
          Used by compliance teams. Aligned to ISO &amp; SOC frameworks. Built for audit defensibility.
        </motion.p>

        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.35 } : { duration: 0 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <motion.a
            href={`${appBase}/auth/signup`}
            whileHover={shouldAnimate ? { scale: 1.03, boxShadow: '0 0 40px rgba(6, 182, 212, 0.3)' } : undefined}
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-primary group px-10 py-4 text-base"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.a>
          <motion.a
            href="/contact"
            whileHover={shouldAnimate ? { scale: 1.03 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-secondary group px-10 py-4 text-base"
          >
            <span>Request Demo</span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slower, delay: 0.45 } : { duration: 0 }}
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

export { ProductHeroAnimation as ProductHero3D };
export default ProductHeroAnimation;
