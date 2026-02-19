'use client';

/**
 * ProductHeroLargeObject — Full-bleed interactive hero for /product
 *
 * Architecture:
 *   - Full-viewport 3D composition with vertically-stacked panels
 *   - Each panel shows real UI content instantly (no blank shapes)
 *   - Panels are clickable — clicking one morphs it into the main app window
 *   - App window is interactive: sidebar nav, tabs, hover states, scrollable content
 *   - 5 views: Dashboard, Evidence, Controls, Reports, Risk
 *   - Microcopy callouts placed in empty areas around the composition
 *   - Copy section (headline + CTAs) is a separate export rendered below
 *
 * Performance:
 *   - All content rendered on first paint (0ms data delay)
 *   - CSS 3D transforms only — GPU-composited
 *   - rAF timer for entrance animation only (~3s), then stops
 *   - prefers-reduced-motion: static final state, all content visible
 *   - IntersectionObserver pauses offscreen, visibilitychange pauses tab-hidden
 *   - No network calls, no WebGL, no canvas
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/* ═══════════════════════════════════════════════════════════════════════
   VIEW TYPES & DATA — each panel maps to a view
   ═══════════════════════════════════════════════════════════════════════ */

type ViewId = 'dashboard' | 'evidence' | 'controls' | 'reports' | 'risk';

interface ViewConfig {
  id: ViewId;
  label: string;
  icon: string;
  panelTitle: string;
  panelStat: string;
  panelSubtext: string;
  accentColor: string;
  gradient: string;
  borderColor: string;
}

const VIEWS: ViewConfig[] = [
  {
    id: 'dashboard', label: 'Dashboard', icon: '◫',
    panelTitle: 'Compliance Dashboard', panelStat: '94%', panelSubtext: 'Overall posture score',
    accentColor: 'cyan', gradient: 'linear-gradient(135deg, rgba(0,212,251,0.14) 0%, rgba(51,153,255,0.08) 100%)',
    borderColor: 'rgba(0,212,251,0.14)',
  },
  {
    id: 'evidence', label: 'Evidence', icon: '◉',
    panelTitle: 'Evidence Vault', panelStat: '1,247', panelSubtext: 'Artifacts collected',
    accentColor: 'violet', gradient: 'linear-gradient(135deg, rgba(160,131,255,0.14) 0%, rgba(51,153,255,0.08) 100%)',
    borderColor: 'rgba(160,131,255,0.12)',
  },
  {
    id: 'controls', label: 'Controls', icon: '⬡',
    panelTitle: 'Control Mapping', panelStat: '142/156', panelSubtext: 'Controls mapped',
    accentColor: 'blue', gradient: 'linear-gradient(135deg, rgba(51,153,255,0.14) 0%, rgba(0,212,251,0.08) 100%)',
    borderColor: 'rgba(51,153,255,0.12)',
  },
  {
    id: 'reports', label: 'Reports', icon: '◈',
    panelTitle: 'Audit Reports', panelStat: '12', panelSubtext: 'Reports generated this quarter',
    accentColor: 'emerald', gradient: 'linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(51,153,255,0.08) 100%)',
    borderColor: 'rgba(52,211,153,0.10)',
  },
  {
    id: 'risk', label: 'Risk', icon: '△',
    panelTitle: 'Risk Posture', panelStat: 'Low', panelSubtext: '3 items require attention',
    accentColor: 'amber', gradient: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(51,153,255,0.08) 100%)',
    borderColor: 'rgba(251,191,36,0.10)',
  },
];

const VIEW_MAP = Object.fromEntries(VIEWS.map((v) => [v.id, v])) as Record<ViewId, ViewConfig>;

/* ── Fake data for each view ── */

const DASHBOARD_TASKS = [
  { title: 'Review SOC 2 Type II controls',  assignee: 'AK', status: 'In Progress', color: 'cyan',   pct: 72 },
  { title: 'Upload penetration test report',  assignee: 'SM', status: 'Pending',     color: 'amber',  pct: 0 },
  { title: 'Map ISO 27001 Annex A controls',  assignee: 'JR', status: 'Complete',    color: 'emerald', pct: 100 },
  { title: 'Vendor risk assessment — Stripe',  assignee: 'LW', status: 'In Review',  color: 'blue',   pct: 88 },
  { title: 'Incident response plan update',   assignee: 'TP', status: 'In Progress', color: 'cyan',   pct: 45 },
];

const EVIDENCE_ITEMS = [
  { name: 'SOC2-AuditLog-2026Q1.pdf',      type: 'PDF',  size: '2.4 MB', date: 'Feb 14', tag: 'SOC 2' },
  { name: 'PenTest-Report-External.pdf',    type: 'PDF',  size: '5.1 MB', date: 'Feb 10', tag: 'ISO 27001' },
  { name: 'AccessReview-Jan2026.xlsx',       type: 'XLSX', size: '890 KB', date: 'Feb 8',  tag: 'Access' },
  { name: 'IncidentResponse-Runbook-v3.md', type: 'MD',   size: '124 KB', date: 'Feb 5',  tag: 'IR' },
  { name: 'VendorDueDiligence-Stripe.pdf',  type: 'PDF',  size: '1.8 MB', date: 'Feb 1',  tag: 'Vendor' },
];

const CONTROLS_LIST = [
  { code: 'CC6.1', name: 'Logical Access Controls',      status: 'Mapped',   framework: 'SOC 2' },
  { code: 'CC7.2', name: 'System Monitoring',             status: 'Mapped',   framework: 'SOC 2' },
  { code: 'A.8.1', name: 'Asset Inventory',               status: 'Partial',  framework: 'ISO 27001' },
  { code: 'A.12.4', name: 'Logging & Monitoring',         status: 'Mapped',   framework: 'ISO 27001' },
  { code: 'CC3.1', name: 'Risk Assessment Process',       status: 'Unmapped', framework: 'SOC 2' },
];

const REPORT_ITEMS = [
  { name: 'Board Readiness Report — Q1 2026', status: 'Final',    date: 'Feb 15', pages: 24 },
  { name: 'SOC 2 Type II Gap Analysis',        status: 'Draft',    date: 'Feb 12', pages: 18 },
  { name: 'Vendor Risk Summary',                status: 'Final',    date: 'Feb 8',  pages: 12 },
  { name: 'Incident Response Metrics',          status: 'In Review', date: 'Feb 5', pages: 9 },
];

const RISK_ITEMS = [
  { name: 'Unpatched CVE in auth service',    severity: 'High',   age: '3d',  owner: 'SM' },
  { name: 'Expired vendor NDA — Acme Corp',   severity: 'Medium', age: '7d',  owner: 'LW' },
  { name: 'Missing MFA for 2 admin accounts', severity: 'High',   age: '1d',  owner: 'AK' },
  { name: 'Overdue access review — Q4',        severity: 'Low',    age: '14d', owner: 'JR' },
];

const STATS_BY_VIEW: Record<ViewId, { label: string; value: string; sub: string }[]> = {
  dashboard: [
    { label: 'Controls',   value: '142', sub: '/ 156 mapped' },
    { label: 'Evidence',   value: '94%', sub: 'coverage' },
    { label: 'Audit Risk', value: 'Low', sub: '3 open items' },
  ],
  evidence: [
    { label: 'Artifacts', value: '1,247', sub: 'total collected' },
    { label: 'Coverage', value: '94%', sub: 'of controls' },
    { label: 'Stale',   value: '8',    sub: 'need refresh' },
  ],
  controls: [
    { label: 'Mapped',   value: '142', sub: '/ 156 total' },
    { label: 'Partial',  value: '11',  sub: 'need work' },
    { label: 'Unmapped', value: '3',   sub: 'remaining' },
  ],
  reports: [
    { label: 'Generated', value: '12', sub: 'this quarter' },
    { label: 'Final',     value: '8',  sub: 'approved' },
    { label: 'Pending',   value: '4',  sub: 'in review' },
  ],
  risk: [
    { label: 'Open Risks', value: '4',    sub: 'active items' },
    { label: 'High',       value: '2',    sub: 'critical' },
    { label: 'Posture',    value: 'Low', sub: 'overall risk' },
  ],
};

const statusBadge: Record<string, string> = {
  Complete: 'bg-emerald-400/10 text-emerald-400/70',
  Pending: 'bg-amber-400/10 text-amber-400/70',
  'In Progress': 'bg-cyan-400/10 text-cyan-400/70',
  'In Review': 'bg-blue-400/10 text-blue-400/70',
  Mapped: 'bg-emerald-400/10 text-emerald-400/70',
  Partial: 'bg-amber-400/10 text-amber-400/70',
  Unmapped: 'bg-red-400/10 text-red-400/70',
  Final: 'bg-emerald-400/10 text-emerald-400/70',
  Draft: 'bg-slate-400/10 text-slate-400/70',
  High: 'bg-red-400/10 text-red-400/70',
  Medium: 'bg-amber-400/10 text-amber-400/70',
  Low: 'bg-emerald-400/10 text-emerald-400/70',
};

const statusDot: Record<string, string> = {
  cyan: 'bg-cyan-400/60', amber: 'bg-amber-400/60', emerald: 'bg-emerald-400/60', blue: 'bg-blue-400/60',
};

/* ═══════════════════════════════════════════════════════════════════════
   GRAIN OVERLAY
   ═══════════════════════════════════════════════════════════════════════ */

function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[60] opacity-[0.02] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PANEL CONTENT — real readable UI for each stacked panel
   ═══════════════════════════════════════════════════════════════════════ */

function PanelContent({ view }: { view: ViewConfig }) {
  const accentMap: Record<string, string> = {
    cyan: 'text-cyan-400/70', violet: 'text-violet-400/70', blue: 'text-blue-400/70',
    emerald: 'text-emerald-400/70', amber: 'text-amber-400/70',
  };
  const dotMap: Record<string, string> = {
    cyan: 'bg-cyan-400/50', violet: 'bg-violet-400/50', blue: 'bg-blue-400/50',
    emerald: 'bg-emerald-400/50', amber: 'bg-amber-400/50',
  };
  return (
    <div className="flex items-center gap-3 px-4 h-full select-none">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0 ${accentMap[view.accentColor] ?? 'text-white/50'}`}
        style={{ background: `rgba(255,255,255,0.03)`, border: '1px solid rgba(255,255,255,0.06)' }}>
        {view.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] text-white/50 font-medium truncate">{view.panelTitle}</div>
        <div className="text-[7px] text-white/25 truncate">{view.panelSubtext}</div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-[13px] font-bold ${accentMap[view.accentColor] ?? 'text-white/60'}`}>{view.panelStat}</div>
      </div>
      <div className={`w-2 h-2 rounded-full shrink-0 ${dotMap[view.accentColor] ?? 'bg-white/30'}`} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   APP WINDOW — fully interactive, switches views
   ═══════════════════════════════════════════════════════════════════════ */

function AppWindow({ activeView, onViewChange }: { activeView: ViewId; onViewChange: (v: ViewId) => void }) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const view = VIEW_MAP[activeView];
  const stats = STATS_BY_VIEW[activeView];

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
          </div>
          <div className="text-[9px] text-white/20 font-mono tracking-wider ml-1">
            app.formaos.com.au / {activeView}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-5 rounded-md bg-white/[0.03] border border-white/[0.05] flex items-center px-1.5 cursor-pointer hover:border-white/[0.10] transition-colors">
            <div className="text-[7px] text-white/15">Search…</div>
          </div>
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400/25 to-blue-500/15 flex items-center justify-center">
            <span className="text-[7px] font-bold text-white/50">FO</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-[140px] shrink-0 border-r border-white/[0.05] bg-white/[0.012] py-3 px-2.5 flex flex-col">
          <div className="flex items-center gap-1.5 px-2 mb-4">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400/20 to-blue-500/15 flex items-center justify-center">
              <span className="text-[6px] font-bold text-cyan-400/70">FO</span>
            </div>
            <div>
              <div className="text-[8px] font-semibold text-white/45">FormaOS</div>
              <div className="text-[6px] text-white/15">Enterprise</div>
            </div>
          </div>

          <div className="space-y-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onViewChange(v.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[8px] text-left transition-all duration-150 ${
                  activeView === v.id
                    ? 'bg-cyan-400/[0.08] text-cyan-400/80 border border-cyan-400/10'
                    : 'text-white/25 hover:text-white/45 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <span className="text-[10px] opacity-70 w-3 text-center">{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-white/[0.05]">
            {[{ name: 'Settings', icon: '⚙' }, { name: 'Help', icon: '?' }].map((item) => (
              <div key={item.name} className="flex items-center gap-2 px-2 py-1 rounded-md text-[7px] text-white/20 hover:text-white/35 cursor-pointer transition-colors">
                <span className="text-[9px] opacity-50 w-3 text-center">{item.icon}</span>
                <span>{item.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 px-2 mt-2.5 pt-2.5 border-t border-white/[0.05]">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400/25 to-blue-400/15" />
              <div>
                <div className="text-[7px] text-white/30">Nancy M.</div>
                <div className="text-[6px] text-white/12">Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[12px] font-semibold text-white/75 mb-0.5">{view.label}</div>
              <div className="text-[7px] text-white/20">Last synced 2 min ago</div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[7px] text-white/25 cursor-pointer hover:bg-white/[0.05] transition-colors">
                Export
              </div>
              <div className="px-2 py-0.5 rounded-md bg-cyan-400/10 border border-cyan-400/20 text-[7px] text-cyan-400/70 cursor-pointer hover:bg-cyan-400/15 transition-colors">
                + New
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-2.5 hover:border-white/[0.10] transition-colors cursor-default">
                <div className="text-[6px] text-white/18 mb-1 uppercase tracking-wider">{stat.label}</div>
                <div className="text-[14px] font-bold text-white/75 mb-0.5">{stat.value}</div>
                <div className="text-[6px] text-white/12">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* View-specific content */}
          <div className="text-[8px] text-white/20 mb-2 font-medium uppercase tracking-wider">
            {activeView === 'dashboard' && 'Active Tasks'}
            {activeView === 'evidence' && 'Recent Artifacts'}
            {activeView === 'controls' && 'Control Mapping'}
            {activeView === 'reports' && 'Recent Reports'}
            {activeView === 'risk' && 'Open Risk Items'}
          </div>

          <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: '180px' }}>
            {activeView === 'dashboard' && DASHBOARD_TASKS.map((task) => (
              <div
                key={task.title}
                className={`flex items-center gap-2 rounded-md border px-3 py-1.5 cursor-pointer transition-all duration-150 ${
                  hoveredTask === task.title ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-white/[0.012] border-white/[0.03]'
                }`}
                onMouseEnter={() => setHoveredTask(task.title)}
                onMouseLeave={() => setHoveredTask(null)}
                role="presentation"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${statusDot[task.color]} shrink-0`} />
                <div className="flex-1 min-w-0"><div className="text-[8px] text-white/45 truncate">{task.title}</div></div>
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-500/25 to-slate-700/25 flex items-center justify-center shrink-0 border border-white/[0.04]">
                  <span className="text-[5px] font-semibold text-white/35">{task.assignee}</span>
                </div>
                <div className={`text-[6px] px-1.5 py-0.5 rounded-full shrink-0 ${statusBadge[task.status] ?? ''}`}>{task.status}</div>
                {task.pct > 0 && task.pct < 100 && (
                  <div className="w-10 h-1 rounded-full bg-white/[0.04] overflow-hidden shrink-0">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400/30 to-blue-400/20" style={{ width: `${task.pct}%` }} />
                  </div>
                )}
              </div>
            ))}

            {activeView === 'evidence' && EVIDENCE_ITEMS.map((item) => (
              <div key={item.name}
                className="flex items-center gap-2 rounded-md bg-white/[0.012] border border-white/[0.03] px-3 py-1.5 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-150">
                <div className="w-5 h-5 rounded bg-violet-400/10 flex items-center justify-center shrink-0">
                  <span className="text-[6px] text-violet-400/60 font-mono">{item.type}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-white/45 truncate">{item.name}</div>
                  <div className="text-[6px] text-white/15">{item.size} · {item.date}</div>
                </div>
                <div className="text-[6px] px-1.5 py-0.5 rounded-full bg-violet-400/10 text-violet-400/60 shrink-0">{item.tag}</div>
              </div>
            ))}

            {activeView === 'controls' && CONTROLS_LIST.map((c) => (
              <div key={c.code}
                className="flex items-center gap-2 rounded-md bg-white/[0.012] border border-white/[0.03] px-3 py-1.5 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-150">
                <div className="text-[7px] font-mono text-blue-400/50 w-10 shrink-0">{c.code}</div>
                <div className="flex-1 min-w-0"><div className="text-[8px] text-white/45 truncate">{c.name}</div></div>
                <div className="text-[6px] text-white/15 shrink-0">{c.framework}</div>
                <div className={`text-[6px] px-1.5 py-0.5 rounded-full shrink-0 ${statusBadge[c.status] ?? ''}`}>{c.status}</div>
              </div>
            ))}

            {activeView === 'reports' && REPORT_ITEMS.map((r) => (
              <div key={r.name}
                className="flex items-center gap-2 rounded-md bg-white/[0.012] border border-white/[0.03] px-3 py-1.5 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-150">
                <div className="w-5 h-5 rounded bg-emerald-400/10 flex items-center justify-center shrink-0">
                  <span className="text-[6px] text-emerald-400/60">◈</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[8px] text-white/45 truncate">{r.name}</div>
                  <div className="text-[6px] text-white/15">{r.date} · {r.pages} pages</div>
                </div>
                <div className={`text-[6px] px-1.5 py-0.5 rounded-full shrink-0 ${statusBadge[r.status] ?? ''}`}>{r.status}</div>
              </div>
            ))}

            {activeView === 'risk' && RISK_ITEMS.map((r) => (
              <div key={r.name}
                className="flex items-center gap-2 rounded-md bg-white/[0.012] border border-white/[0.03] px-3 py-1.5 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-150">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  r.severity === 'High' ? 'bg-red-400/60' : r.severity === 'Medium' ? 'bg-amber-400/60' : 'bg-emerald-400/60'
                }`} />
                <div className="flex-1 min-w-0"><div className="text-[8px] text-white/45 truncate">{r.name}</div></div>
                <div className="text-[6px] text-white/15 shrink-0">{r.age}</div>
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-500/25 to-slate-700/25 flex items-center justify-center shrink-0">
                  <span className="text-[5px] font-semibold text-white/35">{r.owner}</span>
                </div>
                <div className={`text-[6px] px-1.5 py-0.5 rounded-full shrink-0 ${statusBadge[r.severity] ?? ''}`}>{r.severity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MICROCOPY CALLOUTS — positioned around the composition
   ═══════════════════════════════════════════════════════════════════════ */

const CALLOUTS = [
  { text: 'Immutable evidence chains', x: '4%', y: '18%', align: 'left' as const },
  { text: 'ISO / SOC framework mapped', x: '3%', y: '75%', align: 'left' as const },
  { text: 'Live posture monitoring', x: '82%', y: '12%', align: 'right' as const },
  { text: 'Role-based access controls', x: '80%', y: '82%', align: 'right' as const },
];

function MicrocopyCallouts({ shouldAnimate }: { shouldAnimate: boolean }) {
  return (
    <>
      {CALLOUTS.map((c, i) => (
        <motion.div
          key={c.text}
          initial={shouldAnimate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={shouldAnimate ? { duration: 0.8, delay: 0.5 + i * 0.15 } : { duration: 0 }}
          className="absolute hidden lg:flex items-center gap-2 pointer-events-none z-10"
          style={{ left: c.x, top: c.y }}
        >
          {c.align === 'left' && <div className="w-1 h-1 rounded-full bg-cyan-400/30 shrink-0" />}
          <span className="text-[10px] tracking-wide text-white/15 whitespace-nowrap">{c.text}</span>
          {c.align === 'right' && <div className="w-1 h-1 rounded-full bg-violet-400/30 shrink-0" />}
        </motion.div>
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PANEL STACK — vertically stacked, each panel is clickable
   ═══════════════════════════════════════════════════════════════════════ */

/** Panel layout positions in vertical stack */
const PANEL_POSITIONS = [
  { y: -170, x: 3,  z: -6 },
  { y: -85,  x: -2, z: -3 },
  { y: 0,    x: 4,  z: 0 },
  { y: 85,   x: -3, z: -3 },
  { y: 170,  x: 2,  z: -6 },
];

function HeroComposition({
  activeView,
  onPanelClick,
  mouseX,
  mouseY,
  shouldAnimate,
  isDesktop,
  entrancePhase,
}: {
  activeView: ViewId;
  onPanelClick: (v: ViewId) => void;
  mouseX: number;
  mouseY: number;
  shouldAnimate: boolean;
  isDesktop: boolean;
  entrancePhase: number;
}) {
  const parallaxX = shouldAnimate && isDesktop ? mouseX * 5 : 0;
  const parallaxY = shouldAnimate && isDesktop ? mouseY * 3 : 0;

  const ease3 = (t: number) => 1 - Math.pow(1 - t, 3);

  // Entrance progress: panels slide in from below (0-1 over ~0.6s)
  const panelEntrance = shouldAnimate
    ? ease3(Math.min(1, entrancePhase / 0.6))
    : 1;

  // App window entrance: appears after panels settle
  const windowEntrance = shouldAnimate
    ? ease3(Math.min(1, Math.max(0, (entrancePhase - 0.3) / 0.5)))
    : 1;

  return (
    <div className="relative w-full h-full" style={{ perspective: '1600px' }}>
      {/* Ambient glows */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[25%] left-[15%] w-[35%] h-[45%] rounded-full blur-[100px] opacity-[0.18]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.3), transparent 70%)' }} />
        <div className="absolute top-[45%] left-[60%] w-[30%] h-[35%] rounded-full blur-[80px] opacity-[0.14]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.25), transparent 70%)' }} />
      </div>

      {/* Dot grid */}
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 0.5px, transparent 0)', backgroundSize: '36px 36px' }} />

      {/* 3D scene container */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${10 + parallaxY}deg) rotateY(${-12 + parallaxX}deg)`,
          transition: shouldAnimate ? 'transform 0.1s linear' : 'none',
        }}
      >
        {/* ── Stacked panels (left side on desktop) ── */}
        {VIEWS.map((view, i) => {
          const pos = PANEL_POSITIONS[i];
          const isActive = view.id === activeView;
          // Panels positioned to the left, app window to the right
          const baseX = isDesktop ? -200 + pos.x : -80 + pos.x;
          const entranceY = (1 - panelEntrance) * (100 + i * 20);

          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onPanelClick(view.id)}
              className="absolute overflow-hidden focus:outline-none group"
              style={{
                width: isDesktop ? '340px' : '240px',
                height: isDesktop ? '72px' : '56px',
                left: '50%',
                top: '50%',
                borderRadius: '14px',
                transform: `translate(-50%, -50%) translate3d(${baseX}px, ${pos.y + entranceY}px, ${pos.z}px) rotateX(2deg) rotateY(-8deg)`,
                background: view.gradient,
                border: `1px solid ${isActive ? 'rgba(0,212,251,0.3)' : view.borderColor}`,
                boxShadow: isActive
                  ? '0 0 30px rgba(0,212,251,0.1), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                  : '0 0 15px rgba(0,0,0,0.1), 0 6px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
                opacity: panelEntrance,
                backdropFilter: 'blur(8px)',
                willChange: 'transform',
                zIndex: isActive ? 15 : 10,
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Glass reflection */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(168deg, rgba(255,255,255,0.05) 0%, transparent 35%)' }} />

              {/* Hover ring */}
              <div className={`absolute inset-0 rounded-[14px] pointer-events-none transition-opacity duration-200 ${
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
                style={{ boxShadow: 'inset 0 0 0 1px rgba(0,212,251,0.15)' }} />

              {/* Real UI content */}
              <PanelContent view={view} />
            </button>
          );
        })}

        {/* ── Floating app window (right side) ── */}
        <div
          className="absolute overflow-hidden"
          style={{
            width: isDesktop ? '640px' : '420px',
            height: isDesktop ? '460px' : '320px',
            left: '50%',
            top: '50%',
            borderRadius: '18px',
            transform: `translate(-50%, -50%) translate3d(${isDesktop ? 190 : 80}px, ${(1 - windowEntrance) * 40}px, 40px) rotateX(1deg) rotateY(-3deg)`,
            background: 'linear-gradient(145deg, rgba(0,212,251,0.06) 0%, rgba(10,15,28,0.92) 15%, rgba(10,15,28,0.96) 100%)',
            border: '1px solid rgba(0,212,251,0.15)',
            boxShadow: '0 0 60px rgba(0,212,251,0.06), 0 30px 60px rgba(0,0,0,0.3), 0 60px 100px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px) saturate(1.1)',
            opacity: windowEntrance,
            willChange: 'transform, opacity',
            zIndex: 20,
          }}
        >
          {/* Glass reflection */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ background: 'linear-gradient(170deg, rgba(255,255,255,0.04) 0%, transparent 25%)' }} />

          {/* Full interactive app UI */}
          <AppWindow activeView={activeView} onViewChange={onPanelClick} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MOBILE LAYOUT
   ═══════════════════════════════════════════════════════════════════════ */

function MobileHeroVisual({ activeView, onPanelClick }: { activeView: ViewId; onPanelClick: (v: ViewId) => void }) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4">
      {/* Panel tabs */}
      <div className="flex gap-1.5 mb-4 z-10 overflow-x-auto pb-1" style={{ maxWidth: '100%' }}>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onPanelClick(v.id)}
            className={`px-3 py-1.5 rounded-lg text-[9px] shrink-0 transition-all duration-150 border ${
              activeView === v.id
                ? 'bg-cyan-400/10 text-cyan-400/80 border-cyan-400/20'
                : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/50'
            }`}
          >
            <span className="mr-1">{v.icon}</span>
            {v.label}
          </button>
        ))}
      </div>

      {/* App window */}
      <div
        className="relative w-full max-w-[420px] rounded-2xl border border-cyan-400/12 overflow-hidden"
        style={{
          height: '360px',
          background: 'linear-gradient(145deg, rgba(0,212,251,0.06) 0%, rgba(10,15,28,0.9) 15%, rgba(10,15,28,0.95) 100%)',
          boxShadow: '0 0 40px rgba(0,212,251,0.04), 0 20px 40px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <AppWindow activeView={activeView} onViewChange={onPanelClick} />
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
  const [entrancePhase, setEntrancePhase] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const shouldAnimate = !shouldReduceMotion;

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const sectionOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.8, 0]);
  const sectionScale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 0.98, 0.95]);

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

  // Short entrance animation (~1s), then stop
  useEffect(() => {
    if (!shouldAnimate) {
      setEntrancePhase(2);
      return;
    }
    if (!isVisible) return;

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = (now - startTimeRef.current) / 1000;
      if (elapsed <= 1.2) {
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

  const handlePanelClick = useCallback((v: ViewId) => setActiveView(v), []);

  return (
    <motion.section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        height: isDesktop ? '94vh' : '80vh',
        minHeight: isDesktop ? '720px' : '540px',
        maxHeight: '1080px',
        opacity: sectionOpacity,
        scale: sectionScale,
      }}
      onMouseMove={handleMouseMove}
      role="presentation"
    >
      <GrainOverlay />

      <div aria-hidden className="absolute inset-0">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[55%] rounded-full blur-[120px] opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,251,0.25), transparent 70%)' }} />
        <div className="absolute bottom-[-5%] right-[-3%] w-[40%] h-[50%] rounded-full blur-[100px] opacity-[0.10]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(160,131,255,0.2), transparent 70%)' }} />
      </div>

      {/* Microcopy callouts */}
      <MicrocopyCallouts shouldAnimate={shouldAnimate} />

      {/* 3D visual */}
      <div className="absolute inset-0">
        {isDesktop ? (
          <HeroComposition
            activeView={activeView}
            onPanelClick={handlePanelClick}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
            shouldAnimate={shouldAnimate}
            isDesktop={isDesktop}
            entrancePhase={entrancePhase}
          />
        ) : (
          <MobileHeroVisual activeView={activeView} onPanelClick={handlePanelClick} />
        )}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={shouldAnimate ? { duration: 0.8, delay: 1 } : { duration: 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20"
      >
        <div className="text-[9px] tracking-[0.25em] text-white/12 uppercase">Scroll</div>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden className="animate-bounce opacity-15">
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
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,251,0.15) 50%, transparent 100%)' }}
      />

      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={shouldAnimate ? { opacity: 0 } : false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slow } : { duration: 0 }}
          className="text-[11px] tracking-[0.3em] text-white/20 uppercase font-mono mb-6"
        >
          001 — Product
        </motion.div>

        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={shouldAnimate ? { duration: duration.slow, delay: 0.1 } : { duration: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/[0.07] border border-cyan-500/20 mb-8 mx-auto"
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
            <span key={chip.label} className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
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
