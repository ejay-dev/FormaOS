'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  ChevronRight,
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Heart,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  LayoutDashboard,
  Sun,
} from 'lucide-react';
import type { ReactNode } from 'react';

/* ── Types ───────────────────────────────────────────── */

interface TableColumn {
  key: string;
  label: string;
  hideOnMobile?: boolean;
}

interface TableRow {
  id: string;
  cells: Record<string, string | ReactNode>;
  status: 'green' | 'amber' | 'red';
  expandedContent?: {
    label: string;
    items: { key: string; value: string }[];
  };
}

interface DashboardTab {
  id: string;
  label: string;
  count?: number;
}

interface StatusCount {
  label: string;
  count: number;
  color: 'green' | 'amber' | 'red';
}

export interface InteractiveDashboardProps {
  title: string;
  subtitle: string;
  tabs: DashboardTab[];
  statusCounts: StatusCount[];
  columns: TableColumn[];
  rows: TableRow[];
  notifications?: {
    message: string;
    time: string;
    type: 'alert' | 'info' | 'success';
  }[];
  exportLabel?: string;
  industry?: string;
}

/* ── Status styling ──────────────────────────────────── */

const statusDot: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

const statusBadge: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusCountBadge: Record<string, string> = {
  green: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
  amber: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
  red: 'bg-red-500/10 border border-red-500/20 text-red-400',
};

/* ── Sidebar nav items ──────────────────────────────── */

interface SidebarNavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: string;
  active?: boolean;
  rag?: string;
}

const SIDEBAR_ITEMS: SidebarNavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    section: 'OVERVIEW',
    active: true,
  },
  { label: 'Obligations', icon: Shield, section: 'COMPLIANCE', rag: 'green' },
  { label: 'Controls', icon: Shield, section: 'COMPLIANCE', rag: 'amber' },
  {
    label: 'Evidence',
    icon: ClipboardList,
    section: 'COMPLIANCE',
    rag: 'green',
  },
  { label: 'Care Plans', icon: Heart, section: 'CARE OPERATIONS' },
  { label: 'Staff Register', icon: Users, section: 'WORKFORCE' },
  { label: 'Credentials', icon: Shield, section: 'WORKFORCE', rag: 'red' },
  { label: 'Reports', icon: BarChart3, section: 'REPORTS' },
  { label: 'Settings', icon: Settings, section: 'SYSTEM' },
];

const ragDotColor: Record<string, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

/* ── Component ───────────────────────────────────────── */

export function InteractiveDashboard({
  title,
  subtitle,
  tabs,
  statusCounts,
  columns,
  rows,
  notifications = [],
  exportLabel = 'Export',
  industry = 'NDIS Provider',
}: InteractiveDashboardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      !searchQuery ||
      Object.values(row.cells).some(
        (cell) =>
          typeof cell === 'string' &&
          cell.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    const matchesFilter = !selectedFilter || row.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleExport = useCallback(() => {
    // Visual feedback only - this is a marketing demo
  }, []);

  const anim = (delay = 0) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.35,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  const sections = [...new Set(SIDEBAR_ITEMS.map((i) => i.section))];

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.01, boxShadow: '0 0 60px rgba(0,212,251,0.08)' }}
      className="rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 bg-[#0a0f1e] select-none"
      style={{ cursor: 'default' }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 h-9 bg-[#060d1a] border-b border-white/[0.08]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-4 h-5 rounded bg-white/5 flex items-center px-3">
          <span className="text-[10px] text-white/40 font-mono">
            app.formaos.com.au / dashboard
          </span>
        </div>
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">FO</span>
        </div>
      </div>

      {/* App shell: sidebar + main */}
      <div className="flex h-[480px]">
        {/* Sidebar */}
        <motion.div
          {...anim(0.1)}
          className="hidden sm:flex w-40 flex-shrink-0 bg-[#060d1a] border-r border-white/[0.08] flex-col overflow-hidden"
        >
          {/* Logo */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                <span className="text-[7px] font-bold text-white">FO</span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-white block leading-none">
                  FormaOS
                </span>
                <span className="text-[6px] text-white/30 uppercase tracking-[0.08em] leading-none">
                  Compliance Operating System
                </span>
              </div>
            </div>
          </div>
          <div className="px-3 pb-2">
            <span className="inline-flex items-center rounded-full bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-[7px] font-medium text-cyan-400">
              {industry}
            </span>
          </div>
          <nav className="flex-1 overflow-hidden px-1.5 space-y-1">
            {sections.map((section) => {
              const items = SIDEBAR_ITEMS.filter((i) => i.section === section);
              return (
                <div key={section}>
                  <div className="px-1.5 pt-1 pb-0.5 text-[6px] font-bold uppercase tracking-[0.1em] text-white/20">
                    {section}
                  </div>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className={`flex items-center gap-1.5 h-6 px-1.5 rounded text-[8px] font-medium ${
                          item.active
                            ? 'border-l-2 border-l-cyan-400 bg-cyan-500/10 text-cyan-400'
                            : 'text-white/50'
                        }`}
                      >
                        <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="truncate flex-1">{item.label}</span>
                        {item.rag && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${ragDotColor[item.rag]} flex-shrink-0`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </motion.div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Topbar */}
          <motion.div {...anim(0.15)} className="flex-shrink-0">
            <div className="flex items-center justify-between h-8 px-3 bg-[#0a0f1e] border-b border-white/[0.08]">
              <div className="flex items-center gap-1 text-[7px] text-white/40 font-mono">
                <span className="uppercase tracking-wider">Organization</span>
                <span className="text-white/20">&rsaquo;</span>
                <span className="text-white/60">greenfield-care</span>
                <span className="text-white/20">&rsaquo;</span>
                <span className="text-cyan-400/60 uppercase tracking-wider">
                  Owner
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5">
                  <Search className="w-2 h-2 text-white/30" />
                  <span className="text-[6px] text-white/20">Search...</span>
                </div>
                <Bell className="w-2.5 h-2.5 text-white/30" />
                <Settings className="w-2.5 h-2.5 text-white/30" />
                <Sun className="w-2.5 h-2.5 text-white/30" />
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                  <span className="text-[6px] font-bold text-white">E</span>
                </div>
                <span className="rounded bg-amber-500/15 border border-amber-500/25 px-1 py-0.5 text-[6px] font-medium text-amber-400">
                  14d left
                </span>
              </div>
            </div>
            {/* Compliance strip */}
            <div className="flex items-center gap-3 h-5 px-3 bg-[#080c18] border-b border-white/[0.06]">
              <span className="flex items-center gap-1 text-[7px]">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-white/40">0 Overdue</span>
              </span>
              <span className="flex items-center gap-1 text-[7px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span className="text-white/40">0 Due Soon</span>
              </span>
              <span className="flex items-center gap-1 text-[7px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-white/40">0 Completed</span>
              </span>
            </div>
          </motion.div>

          {/* Dashboard content */}
          <div className="flex-1 overflow-hidden">
            {/* Dashboard header */}
            <motion.div {...anim(0.2)} className="px-3 sm:px-4 pt-3 pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-white/30 mb-0.5">
                    {subtitle}
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {title}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {statusCounts.map((sc) => (
                    <span
                      key={sc.label}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${statusCountBadge[sc.color]}`}
                    >
                      {sc.count} {sc.label}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Toolbar */}
            <motion.div
              {...anim(0.25)}
              className="px-3 sm:px-4 pb-2 flex items-center justify-between gap-2"
            >
              {/* Tabs */}
              <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1.5 text-[9px] opacity-60">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(!searchOpen);
                    setSearchQuery('');
                  }}
                  className={`p-1.5 rounded-lg transition-all ${
                    searchOpen
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
                  }`}
                >
                  <Search className="h-3.5 w-3.5" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFilterOpen(!filterOpen)}
                    className={`p-1.5 rounded-lg transition-all ${
                      filterOpen || selectedFilter
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5" />
                  </button>
                  <AnimatePresence>
                    {filterOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-white/[0.08] bg-[#0d1428] p-1.5 shadow-xl min-w-[120px]"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFilter(null);
                            setFilterOpen(false);
                          }}
                          className={`block w-full text-left px-2.5 py-1.5 rounded text-[11px] transition-colors ${
                            !selectedFilter
                              ? 'text-cyan-400 bg-cyan-500/10'
                              : 'text-white/50 hover:bg-white/[0.04]'
                          }`}
                        >
                          All
                        </button>
                        {['green', 'amber', 'red'].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => {
                              setSelectedFilter(f);
                              setFilterOpen(false);
                            }}
                            className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded text-[11px] transition-colors ${
                              selectedFilter === f
                                ? 'text-cyan-400 bg-cyan-500/10'
                                : 'text-white/50 hover:bg-white/[0.04]'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusDot[f]}`}
                            />
                            {f === 'green'
                              ? 'Valid'
                              : f === 'amber'
                                ? 'Expiring'
                                : 'Expired'}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {notifications.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setNotifOpen(!notifOpen)}
                      className={`relative p-1.5 rounded-lg transition-all ${
                        notifOpen
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#0d1428]" />
                    </button>
                    <AnimatePresence>
                      {notifOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-white/[0.08] bg-[#0d1428] p-2 shadow-xl w-[220px]"
                        >
                          <div className="text-[8px] uppercase tracking-wider text-white/30 px-1 mb-1.5">
                            Notifications
                          </div>
                          {notifications.map((n, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 px-1.5 py-1.5 rounded text-[11px] hover:bg-white/[0.03]"
                            >
                              {n.type === 'alert' ? (
                                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-red-400" />
                              ) : n.type === 'success' ? (
                                <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-emerald-400" />
                              ) : (
                                <Clock className="h-3 w-3 shrink-0 mt-0.5 text-amber-400" />
                              )}
                              <div>
                                <div className="text-white/60 leading-tight">
                                  {n.message}
                                </div>
                                <div className="text-[9px] text-white/30 mt-0.5">
                                  {n.time}
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExport}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all"
                >
                  <Download className="h-3 w-3" />
                  {exportLabel}
                </button>
              </div>
            </motion.div>

            {/* Search bar */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 sm:px-4 pb-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search records..."
                        className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] pl-8 pr-8 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Table */}
            <motion.div {...anim(0.3)} className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-y border-white/[0.06] bg-white/[0.015]">
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className={`px-3 sm:px-4 py-2 font-medium text-[8px] uppercase tracking-wider text-white/30 ${
                            col.hideOnMobile ? 'hidden sm:table-cell' : ''
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row, idx) => (
                      <motion.tr
                        key={row.id}
                        {...(shouldReduceMotion
                          ? {}
                          : {
                              initial: { opacity: 0 },
                              animate: { opacity: 1 },
                              transition: {
                                duration: 0.2,
                                delay: 0.35 + idx * 0.05,
                              },
                            })}
                        onMouseEnter={() => setHoveredRow(row.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() =>
                          row.expandedContent &&
                          setExpandedRow(expandedRow === row.id ? null : row.id)
                        }
                        className={`border-b border-white/[0.04] last:border-0 transition-colors ${
                          row.expandedContent ? 'cursor-pointer' : ''
                        } ${hoveredRow === row.id ? 'bg-white/[0.02]' : ''} ${
                          expandedRow === row.id ? 'bg-cyan-500/[0.02]' : ''
                        }`}
                        style={{ height: 32 }}
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-3 sm:px-4 py-1.5 ${
                              col.hideOnMobile ? 'hidden sm:table-cell' : ''
                            }`}
                          >
                            {col.key === 'status' ? (
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${statusDot[row.status]}`}
                                />
                                <span
                                  className={`text-[10px] ${
                                    row.status === 'green'
                                      ? 'text-emerald-400'
                                      : row.status === 'amber'
                                        ? 'text-amber-400'
                                        : 'text-red-400'
                                  }`}
                                >
                                  {row.cells[col.key]}
                                </span>
                              </span>
                            ) : col.key === columns[0]?.key ? (
                              <span className="text-white font-medium text-[10px]">
                                {row.cells[col.key]}
                              </span>
                            ) : (
                              <span className="text-white/40 text-[10px] font-mono">
                                {row.cells[col.key]}
                              </span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-1.5">
                          {row.expandedContent && (
                            <ChevronRight
                              className={`h-3 w-3 text-white/30 transition-transform duration-200 ${
                                expandedRow === row.id ? 'rotate-90' : ''
                              }`}
                            />
                          )}
                        </td>
                      </motion.tr>
                    ))}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={columns.length + 1}
                          className="px-4 py-8 text-center text-xs text-white/30"
                        >
                          No matching records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Expanded row detail */}
            <AnimatePresence>
              {expandedRow && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-white/[0.06]"
                >
                  {(() => {
                    const row = rows.find((r) => r.id === expandedRow);
                    if (!row?.expandedContent) return null;
                    return (
                      <div className="px-4 py-3 bg-cyan-500/[0.02]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[8px] uppercase tracking-wider text-cyan-500/60">
                            {row.expandedContent.label}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRow(null);
                            }}
                            className="text-white/30 hover:text-white/50"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {row.expandedContent.items.map((item) => (
                            <div
                              key={item.key}
                              className="rounded-lg border border-white/[0.04] bg-[#0d1428] px-3 py-2"
                            >
                              <div className="text-[7px] uppercase tracking-wider text-white/30 mb-0.5">
                                {item.key}
                              </div>
                              <div className="text-[11px] text-white">
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer bar */}
          <motion.div
            {...anim(0.35)}
            className="flex items-center justify-between px-3 sm:px-4 py-2 border-t border-white/[0.06] bg-white/[0.015] flex-shrink-0"
          >
            <span className="text-[10px] text-white/30">
              {filteredRows.length} of {rows.length} records
              {selectedFilter && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter(null)}
                  className="ml-2 text-cyan-500 hover:text-cyan-400"
                >
                  Clear filter
                </button>
              )}
            </span>
            <div className="flex items-center gap-3 text-[10px] text-white/30">
              <span className="hidden sm:inline font-mono">
                Last synced 2 min ago
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
