'use client';

/**
 * ProductHeroShowcase — Premium interactive hero for /product
 *
 * Architecture:
 *   TabsRail (native scroll, CSS snap) | AppPanel (memoized, overflow-clipped)
 *   - Flexbox layout — no overlap at any breakpoint
 *   - Instant click: state updates synchronously, no portal/morph overlay
 *   - Native scroll: no custom RAF loop, no per-frame React re-renders
 *   - No per-tab blur/backdropFilter — only panel gets glass effect
 *   - AnimatePresence for content transitions (transform+opacity only)
 */

import { useRef, useEffect, useState, useCallback, memo, startTransition } from 'react';
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
   VIEW DATA
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
   TABS RAIL — native scroll, CSS snap, zero JS scroll logic
   ═══════════════════════════════════════════════════════════════════════ */

const TabsRail = memo(function TabsRail({
  activeTabId,
  onTabClick,
}: {
  activeTabId: string;
  onTabClick: (tab: Tab) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const active = el.querySelector('[data-active="true"]');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }, [activeTabId]);

  return (
    <div className="relative w-[340px] lg:w-[380px] shrink-0 self-stretch flex flex-col">
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(10,15,28,0.95), transparent)' }} />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-8 z-10 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(10,15,28,0.95), transparent)' }} />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-1 space-y-1.5"
        role="listbox"
        aria-label="Feature modules"
        style={{
          scrollSnapType: 'y proximity',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}
      >
        {TABS.map((tab) => {
          const vm = VIEW_MAP[tab.view];
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              role="option"
              aria-selected={isActive}
              data-active={isActive}
              onClick={() => onTabClick(tab)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left
                transition-all duration-150 ease-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40
                group relative overflow-hidden
                ${isActive
                  ? 'bg-white/[0.06] border border-white/[0.12] shadow-lg shadow-black/20'
                  : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.09]'
                }
              `}
              style={{ scrollSnapAlign: 'start' }}
            >
              {/* Active accent bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                  style={{ background: `rgba(${vm.glow},0.6)` }}
                />
              )}
              {/* Hover shimmer */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 49%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.03) 51%, transparent 60%)' }} />

              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[15px] shrink-0 ${vm.accent}`}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {vm.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-medium truncate leading-tight ${isActive ? 'text-white/85' : 'text-white/60'}`}>{tab.title}</div>
                <div className="text-[12px] text-white/30 truncate leading-tight mt-0.5">{tab.sub}</div>
              </div>
              <div className={`text-[16px] font-bold shrink-0 ${isActive ? vm.accent : 'text-white/40'}`}>{tab.stat}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════
   PANEL VIEW CONTENT — memoized per-view renderers
   ═══════════════════════════════════════════════════════════════════════ */

const ROW_CLS = 'flex items-center gap-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] px-4 py-2.5 hover:bg-white/[0.04] hover:border-white/[0.10] transition-colors cursor-default';

const DashboardView = memo(function DashboardView() {
  return (
    <>
      {DASHBOARD_ROWS.map((r) => (
        <div key={r.title} className={ROW_CLS}>
          <div className={`w-2 h-2 rounded-full ${r.dot} shrink-0`} />
          <div className="flex-1 min-w-0 text-[13px] text-white/60 truncate">{r.title}</div>
          <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0"><span className="text-[12px] font-semibold text-white/40">{r.assignee}</span></div>
          <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.badgeCls}`}>{r.badge}</div>
          {r.pct > 0 && r.pct < 100 && (
            <div className="w-14 h-1.5 rounded-full bg-white/[0.05] overflow-hidden shrink-0">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400/40 to-blue-400/25" style={{ width: `${r.pct}%` }} />
            </div>
          )}
        </div>
      ))}
    </>
  );
});

const EvidenceView = memo(function EvidenceView() {
  return (
    <>
      {EVIDENCE_ROWS.map((r) => (
        <div key={r.name} className={ROW_CLS}>
          <div className="w-7 h-7 rounded-lg bg-violet-400/10 flex items-center justify-center shrink-0"><span className="text-[12px] text-violet-300 font-mono">{r.type}</span></div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-white/60 truncate">{r.name}</div>
            <div className="text-[12px] text-white/22">{r.size} · {r.date}</div>
          </div>
          <div className="text-[12px] px-2 py-0.5 rounded-full bg-violet-400/12 text-violet-300 shrink-0">{r.tag}</div>
        </div>
      ))}
    </>
  );
});

const ControlsView = memo(function ControlsView() {
  return (
    <>
      {CONTROLS_ROWS.map((r) => (
        <div key={r.code} className={ROW_CLS}>
          <div className="text-[12px] font-mono text-blue-300/70 w-12 shrink-0">{r.code}</div>
          <div className="flex-1 min-w-0 text-[13px] text-white/60 truncate">{r.name}</div>
          <div className="text-[12px] text-white/22 shrink-0">{r.framework}</div>
          <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.statusCls}`}>{r.status}</div>
        </div>
      ))}
    </>
  );
});

const ReportsView = memo(function ReportsView() {
  return (
    <>
      {REPORTS_ROWS.map((r) => (
        <div key={r.name} className={ROW_CLS}>
          <div className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center shrink-0"><span className="text-[13px] text-emerald-300">◈</span></div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-white/60 truncate">{r.name}</div>
            <div className="text-[12px] text-white/22">{r.date} · {r.pages} pages</div>
          </div>
          <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.statusCls}`}>{r.status}</div>
        </div>
      ))}
    </>
  );
});

const RiskView = memo(function RiskView() {
  return (
    <>
      {RISK_ROWS.map((r) => (
        <div key={r.name} className={ROW_CLS}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${r.sevDot}`} />
          <div className="flex-1 min-w-0 text-[13px] text-white/60 truncate">{r.name}</div>
          <div className="text-[12px] text-white/22 shrink-0">{r.age}</div>
          <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0"><span className="text-[12px] font-semibold text-white/40">{r.owner}</span></div>
          <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.sevCls}`}>{r.sev}</div>
        </div>
      ))}
    </>
  );
});

const PolicyView = memo(function PolicyView() {
  return (
    <>
      {POLICY_ROWS.map((r) => (
        <div key={r.name} className={ROW_CLS}>
          <div className="w-7 h-7 rounded-lg bg-rose-400/10 flex items-center justify-center shrink-0"><span className="text-[13px] text-rose-300">▣</span></div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-white/60 truncate">{r.name}</div>
            <div className="text-[12px] text-white/22">{r.ver} · {r.review} · {r.owner}</div>
          </div>
          <div className={`text-[12px] px-2 py-0.5 rounded-full shrink-0 ${r.statusCls}`}>{r.status}</div>
        </div>
      ))}
    </>
  );
});

const VIEW_COMPONENTS: Record<ViewId, React.ComponentType> = {
  dashboard: DashboardView,
  evidence: EvidenceView,
  controls: ControlsView,
  reports: ReportsView,
  risk: RiskView,
  policies: PolicyView,
};

const VIEW_LABELS: Record<ViewId, string> = {
  dashboard: 'Active Tasks',
  evidence: 'Recent Artifacts',
  controls: 'Control Mapping',
  reports: 'Recent Reports',
  risk: 'Open Risk Items',
  policies: 'Policy Library',
};

/* ═══════════════════════════════════════════════════════════════════════
   APP PANEL — big focal window, overflow-clipped
   ═══════════════════════════════════════════════════════════════════════ */

const AppPanel = memo(function AppPanel({
  activeView,
  onViewChange,
  glowColor,
}: {
  activeView: ViewId;
  onViewChange: (v: ViewId) => void;
  glowColor: string;
}) {
  const view = VIEW_MAP[activeView];
  const stats = STATS[activeView];
  const ViewContent = VIEW_COMPONENTS[activeView];

  return (
    <div
      className="relative overflow-hidden rounded-[20px] w-full h-full"
      style={{
        background: 'linear-gradient(145deg, rgba(15,22,40,0.98) 0%, rgba(10,15,28,0.99) 100%)',
        border: `1px solid rgba(${glowColor},0.18)`,
        boxShadow: `0 0 40px rgba(${glowColor},0.04), 0 24px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
        backdropFilter: 'blur(16px)',
        transition: 'border-color 0.25s ease-out, box-shadow 0.25s ease-out',
      }}
    >
      {/* Glass top */}
      <div className="absolute inset-0 pointer-events-none rounded-[20px]" style={{ background: 'linear-gradient(170deg, rgba(255,255,255,0.04) 0%, transparent 18%)' }} />

      <div className="absolute inset-0 flex flex-col overflow-hidden">
        {/* Chrome bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-white/[0.015] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/50" />
              <div className="w-3 h-3 rounded-full bg-amber-400/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/50" />
            </div>
            <div className="text-[12px] text-white/25 font-mono tracking-wider">app.formaos.com.au / {activeView}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center px-3">
              <span className="text-[12px] text-white/20">Search…</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400/25 to-blue-500/15 flex items-center justify-center">
              <span className="text-[12px] font-bold text-white/55">FO</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <div className="w-[150px] shrink-0 border-r border-white/[0.05] bg-white/[0.01] py-3 px-2 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400/25 to-blue-500/15 flex items-center justify-center">
                <span className="text-[12px] font-bold text-cyan-400/80">FO</span>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-white/50">FormaOS</div>
                <div className="text-[12px] text-white/18">Enterprise</div>
              </div>
            </div>
            <div className="space-y-0.5">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onViewChange(v.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-left transition-colors duration-100 ${
                    activeView === v.id
                      ? 'bg-cyan-400/[0.08] text-cyan-300 border border-cyan-400/12'
                      : 'text-white/28 hover:text-white/50 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span className="text-[13px] opacity-70 w-3.5 text-center">{v.icon}</span>
                  <span className="truncate">{v.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto pt-3 border-t border-white/[0.05]">
              <div className="flex items-center gap-2 px-2 mt-1">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400/25 to-blue-400/15 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12px] text-white/30 truncate">Nancy M.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 min-w-0 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <div className="text-[16px] font-semibold text-white/85">{view.label}</div>
                <div className="text-[12px] text-white/22">Last synced 2 min ago</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[12px] text-white/28 cursor-pointer hover:bg-white/[0.05] transition-colors">Export</div>
                <div className="px-3 py-1 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-[12px] text-cyan-300 cursor-pointer hover:bg-cyan-400/15 transition-colors">+ New</div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2 mb-4 shrink-0">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-3">
                  <div className="text-[12px] text-white/22 uppercase tracking-wider">{s.label}</div>
                  <div className="text-[18px] font-bold text-white/80 mt-0.5">{s.value}</div>
                  <div className="text-[12px] text-white/18">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Content area */}
            <div className="text-[12px] text-white/22 font-medium uppercase tracking-wider mb-2 shrink-0">
              {VIEW_LABELS[activeView]}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="space-y-1.5"
                >
                  <ViewContent />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════
   DESKTOP SCENE — flexbox layout, no overlap
   ═══════════════════════════════════════════════════════════════════════ */

function DesktopScene({
  activeView,
  activeTabId,
  glowColor,
  onTabClick,
  onViewChange,
  mouseX,
  mouseY,
  shouldAnimate,
}: {
  activeView: ViewId;
  activeTabId: string;
  glowColor: string;
  onTabClick: (tab: Tab) => void;
  onViewChange: (v: ViewId) => void;
  mouseX: number;
  mouseY: number;
  shouldAnimate: boolean;
}) {
  const rx = shouldAnimate ? mouseX * 2.5 : 0;
  const ry = shouldAnimate ? mouseY * 1.5 : 0;

  return (
    <div className="relative w-full h-full">
      {/* Ambient glows — lightweight, no blur filter stack */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[2%] w-[40%] h-[50%] rounded-full opacity-[0.12]" style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.3), transparent 65%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[30%] right-[5%] w-[35%] h-[40%] rounded-full opacity-[0.10]" style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.25), transparent 65%)', filter: 'blur(80px)' }} />
      </div>

      {/* Dot grid */}
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 0.5px, transparent 0)', backgroundSize: '44px 44px' }} />

      {/* Flex layout — tabs left, panel right, guaranteed no overlap */}
      <div
        className="absolute inset-0 flex items-center justify-center px-8 gap-6 lg:gap-10"
        style={{
          perspective: '1400px',
        }}
      >
        {/* Tabs column */}
        <div
          style={{
            transform: `rotateY(${4 + rx}deg) rotateX(${-2 + ry}deg)`,
            transition: shouldAnimate ? 'transform 0.12s linear' : 'none',
            transformStyle: 'preserve-3d',
            height: 'min(80vh, 640px)',
          }}
        >
          <TabsRail activeTabId={activeTabId} onTabClick={onTabClick} />
        </div>

        {/* Panel column */}
        <div
          className="flex-1 min-w-0"
          style={{
            maxWidth: '820px',
            height: 'min(80vh, 640px)',
            transform: `rotateY(${-2 + rx * 0.4}deg) rotateX(${1 + ry * 0.3}deg)`,
            transition: shouldAnimate ? 'transform 0.12s linear' : 'none',
            transformStyle: 'preserve-3d',
          }}
        >
          <AppPanel activeView={activeView} onViewChange={onViewChange} glowColor={glowColor} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MOBILE LAYOUT
   ═══════════════════════════════════════════════════════════════════════ */

function MobileLayout({ activeView, glowColor, onViewChange }: { activeView: ViewId; glowColor: string; onViewChange: (v: ViewId) => void }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 gap-3">
      <div className="flex gap-1.5 z-10 overflow-x-auto pb-1 shrink-0" style={{ maxWidth: '100%', scrollbarWidth: 'none' }}>
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
      <div className="w-full max-w-[520px] flex-1 min-h-0" style={{ maxHeight: '440px' }}>
        <AppPanel activeView={activeView} onViewChange={onViewChange} glowColor={glowColor} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT — ProductHeroAnimation
   ═══════════════════════════════════════════════════════════════════════ */

export function ProductHeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [activeTabId, setActiveTabId] = useState('t01');

  const shouldAnimate = !shouldReduceMotion;
  const glowColor = VIEW_MAP[activeView].glow;

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.85, 0]);
  const sectionScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.98, 0.94]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDesktop || shouldReduceMotion) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMousePos({ x: (e.clientX - rect.left) / rect.width - 0.5, y: (e.clientY - rect.top) / rect.height - 0.5 });
  }, [isDesktop, shouldReduceMotion]);

  // Instant tab click — update state synchronously, no blocking
  const handleTabClick = useCallback((tab: Tab) => {
    setActiveTabId(tab.id);
    startTransition(() => {
      setActiveView(tab.view);
    });
  }, []);

  const handleViewChange = useCallback((v: ViewId) => {
    startTransition(() => {
      setActiveView(v);
    });
    const match = TABS.find((t) => t.view === v);
    if (match) setActiveTabId(match.id);
  }, []);

  return (
    <motion.section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        height: isDesktop ? '94vh' : '82vh',
        minHeight: isDesktop ? '720px' : '520px',
        maxHeight: '1080px',
        opacity: sectionOpacity,
        scale: sectionScale,
      }}
      onMouseMove={handleMouseMove}
      role="presentation"
    >
      <div className="absolute inset-0">
        {isDesktop ? (
          <DesktopScene
            activeView={activeView}
            activeTabId={activeTabId}
            glowColor={glowColor}
            onTabClick={handleTabClick}
            onViewChange={handleViewChange}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
            shouldAnimate={shouldAnimate}
          />
        ) : (
          <MobileLayout activeView={activeView} glowColor={glowColor} onViewChange={handleViewChange} />
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20">
        <div className="text-[12px] tracking-[0.25em] text-white/12 uppercase">Scroll</div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className="animate-bounce opacity-15">
          <path d="M7 2v10M3 8l4 4 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
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
