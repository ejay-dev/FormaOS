'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Code,
  Database,
  Globe,
  Settings,
  FileSearch,
  Server,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Play,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Trash2,
  BarChart3,
  Activity,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuditScope = 'full' | 'security' | 'frontend' | 'backend' | 'database' | 'api' | 'config';

type CheckStatus = 'pass' | 'warn' | 'fail' | 'info';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Category = 'security' | 'frontend' | 'backend' | 'database' | 'api' | 'config' | 'performance';
type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

type CheckResult = {
  id: string;
  category: Category;
  name: string;
  status: CheckStatus;
  severity: Severity;
  message: string;
  details: string[];
  recommendation?: string;
};

type AuditSummary = {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  info: number;
  byCategory: Record<string, { pass: number; warn: number; fail: number; info: number }>;
};

type AuditResponse = {
  scope: string;
  timestamp: string;
  duration: number;
  score: number;
  grade: Grade;
  checks: CheckResult[];
  summary: AuditSummary;
};

type StoredRun = {
  id: string;
  scope: AuditScope;
  timestamp: string;
  duration: number;
  score: number;
  grade: Grade;
  summary: AuditSummary;
  checks: CheckResult[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCOPE_OPTIONS: {
  value: AuditScope;
  label: string;
  icon: typeof Shield;
  description: string;
}[] = [
  { value: 'full', label: 'Full Audit', icon: Shield, description: 'Comprehensive audit across all categories and checks' },
  { value: 'security', label: 'Security', icon: Shield, description: 'Authentication, authorization, secrets, and vulnerability scanning' },
  { value: 'frontend', label: 'Frontend', icon: Code, description: 'Component quality, accessibility, and UI consistency checks' },
  { value: 'backend', label: 'Backend', icon: Server, description: 'API routes, server actions, error handling, and data flow' },
  { value: 'database', label: 'Database', icon: Database, description: 'Schema integrity, migrations, indexes, and query patterns' },
  { value: 'api', label: 'API', icon: Globe, description: 'Endpoint validation, OpenAPI conformance, and rate limiting' },
  { value: 'config', label: 'Config', icon: Settings, description: 'Environment variables, build configuration, and dependencies' },
];

const CATEGORY_META: Record<Category, { icon: typeof Shield; label: string }> = {
  security: { icon: Shield, label: 'Security' },
  frontend: { icon: Code, label: 'Frontend' },
  backend: { icon: Server, label: 'Backend' },
  database: { icon: Database, label: 'Database' },
  api: { icon: Globe, label: 'API' },
  config: { icon: Settings, label: 'Config' },
  performance: { icon: Activity, label: 'Performance' },
};

const GRADE_COLORS: Record<Grade, { text: string; bg: string; border: string; gradient: string }> = {
  A: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', gradient: 'from-emerald-500/20 to-emerald-500/5' },
  B: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', gradient: 'from-blue-500/20 to-blue-500/5' },
  C: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', gradient: 'from-amber-500/20 to-amber-500/5' },
  D: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', gradient: 'from-orange-500/20 to-orange-500/5' },
  F: { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', gradient: 'from-red-500/20 to-red-500/5' },
};

const STATUS_CONFIG: Record<CheckStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  pass: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Passed' },
  warn: { icon: AlertTriangle, color: 'text-amber-400', label: 'Warnings' },
  fail: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
  info: { icon: Info, color: 'text-sky-400', label: 'Info' },
};

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  low: 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30',
  info: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
};

const HISTORY_KEY = 'formaos-audit-runner-history-v2';
const MAX_HISTORY = 5;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function loadHistory(): StoredRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredRun[];
  } catch {
    return [];
  }
}

function saveHistory(runs: StoredRun[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(runs.slice(0, MAX_HISTORY)));
  } catch {
    // localStorage may be full or unavailable
  }
}

// ---------------------------------------------------------------------------
// Animated Score Hook
// ---------------------------------------------------------------------------

function useAnimatedScore(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setValue(current);
    }, 25);
    return () => clearInterval(timer);
  }, [target, active]);
  return value;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScopeSelector({
  scope,
  onSelect,
  disabled,
}: {
  scope: AuditScope;
  onSelect: (s: AuditScope) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Audit Scope
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {SCOPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = scope === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              disabled={disabled}
              className={`group relative flex items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] ${
                isActive
                  ? 'bg-primary/10 border-2 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb,99,102,241),0.15)]'
                  : 'bg-card border border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              <div
                className={`flex-shrink-0 mt-0.5 p-2 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className={`text-sm font-semibold ${isActive ? 'text-foreground' : 'text-foreground/80'}`}>
                  {option.label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {option.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HealthScoreCard({ data }: { data: AuditResponse }) {
  const animatedScore = useAnimatedScore(data.score, true);
  const colors = GRADE_COLORS[data.grade];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.gradient} p-6`}>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Score Circle */}
        <div className="relative flex-shrink-0">
          <div className={`w-32 h-32 rounded-full border-4 ${colors.border} flex items-center justify-center bg-card/50 backdrop-blur-sm`}>
            <div className="text-center">
              <div className={`text-5xl font-bold tabular-nums ${colors.text}`}>
                {animatedScore}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5">/ 100</div>
            </div>
          </div>
          <div className={`absolute -top-1 -right-1 w-10 h-10 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}>
            <span className={`text-lg font-black ${colors.text}`}>{data.grade}</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">Health Score</h3>
            <p className="text-sm text-muted-foreground">
              {data.grade === 'A' && 'Excellent — production-ready quality'}
              {data.grade === 'B' && 'Good — minor improvements recommended'}
              {data.grade === 'C' && 'Fair — several issues need attention'}
              {data.grade === 'D' && 'Poor — significant issues detected'}
              {data.grade === 'F' && 'Critical — immediate action required'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(data.duration)}
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              {data.summary.total} checks
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatTimestamp(data.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBar({ summary }: { summary: AuditSummary }) {
  const total = summary.total || 1;
  const segments: { key: CheckStatus; count: number; color: string }[] = [
    { key: 'pass', count: summary.pass, color: 'bg-emerald-500' },
    { key: 'warn', count: summary.warn, color: 'bg-amber-500' },
    { key: 'fail', count: summary.fail, color: 'bg-red-500' },
    { key: 'info', count: summary.info, color: 'bg-sky-500' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-muted/50">
        {segments.map((seg) =>
          seg.count > 0 ? (
            <div
              key={seg.key}
              className={`${seg.color} transition-all duration-500`}
              style={{ width: `${(seg.count / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      {/* Counts */}
      <div className="flex flex-wrap gap-4">
        {segments.map((seg) => {
          const cfg = STATUS_CONFIG[seg.key];
          const Icon = cfg.icon;
          return (
            <div key={seg.key} className="flex items-center gap-1.5">
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              <span className={`text-sm font-semibold ${cfg.color}`}>{seg.count}</span>
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: CheckResult }) {
  const [expanded, setExpanded] = useState(false);
  const hasExpandable = check.details.length > 0 || !!check.recommendation;
  const statusCfg = STATUS_CONFIG[check.status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="border border-border rounded-xl bg-card/50 overflow-hidden">
      <button
        type="button"
        onClick={() => hasExpandable && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${
          hasExpandable ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default'
        }`}
      >
        <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusCfg.color}`} />
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${SEVERITY_STYLES[check.severity]}`}
        >
          {check.severity}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-foreground">{check.name}</span>
          <span className="text-sm text-muted-foreground ml-2">{check.message}</span>
        </div>
        {hasExpandable && (
          <div className="flex-shrink-0 text-muted-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/10">
          {check.details.length > 0 && (
            <ul className="space-y-1">
              {check.details.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                  <code className="font-mono break-all">{d}</code>
                </li>
              ))}
            </ul>
          )}
          {check.recommendation && (
            <div className="flex items-start gap-2 rounded-lg border border-sky-500/20 bg-sky-500/5 px-3 py-2.5">
              <Info className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-sky-300 leading-relaxed">{check.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryCard({
  category,
  checks,
  animDelay,
}: {
  category: Category;
  checks: CheckResult[];
  animDelay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;

  const counts = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const c of checks) counts[c.status]++;

  return (
    <div
      className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/20 transition-all duration-200"
      >
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-foreground">{meta.label}</span>
          <span className="text-xs text-muted-foreground ml-2">({checks.length} checks)</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {counts.pass > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {counts.pass}
            </span>
          )}
          {counts.warn > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              {counts.warn}
            </span>
          )}
          {counts.fail > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400">
              <XCircle className="h-3 w-3" />
              {counts.fail}
            </span>
          )}
          {counts.info > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400">
              <Info className="h-3 w-3" />
              {counts.info}
            </span>
          )}
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {checks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryBreakdown({ checks }: { checks: CheckResult[] }) {
  const grouped: Partial<Record<Category, CheckResult[]>> = {};
  for (const c of checks) {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category]!.push(c);
  }

  const categoryOrder: Category[] = ['security', 'frontend', 'backend', 'database', 'api', 'config', 'performance'];
  const orderedCategories = categoryOrder.filter((cat) => grouped[cat] && grouped[cat]!.length > 0);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <FileSearch className="h-4 w-4" />
        Category Breakdown
      </h3>
      <div className="space-y-2">
        {orderedCategories.map((cat, i) => (
          <CategoryCard key={cat} category={cat} checks={grouped[cat]!} animDelay={i * 80} />
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Running checks...</p>
          <p className="text-xs text-muted-foreground mt-0.5">This may take a moment</p>
        </div>
      </div>
      {/* Pulsing placeholders */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-3 w-48 rounded bg-muted/60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentRuns({
  history,
  onLoad,
  onClear,
}: {
  history: StoredRun[];
  onLoad: (run: StoredRun) => void;
  onClear: () => void;
}) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Recent Runs
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear History
        </button>
      </div>
      <div className="space-y-2">
        {history.map((run) => {
          const gradeColors = GRADE_COLORS[run.grade];
          const scopeLabel = SCOPE_OPTIONS.find((s) => s.value === run.scope)?.label ?? run.scope;

          return (
            <button
              key={run.id}
              type="button"
              onClick={() => onLoad(run)}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-card text-left hover:bg-muted/20 hover:border-muted-foreground/20 transition-all duration-200"
            >
              <div className={`w-9 h-9 rounded-lg ${gradeColors.bg} border ${gradeColors.border} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-sm font-black ${gradeColors.text}`}>{run.grade}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{scopeLabel}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{formatTimestamp(run.timestamp)}</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-lg font-bold tabular-nums ${gradeColors.text}`}>{run.score}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-400 font-medium">{run.summary.pass}P</span>
                  <span className="text-amber-400 font-medium">{run.summary.warn}W</span>
                  <span className="text-red-400 font-medium">{run.summary.fail}F</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AuditRunnerClient() {
  const [scope, setScope] = useState<AuditScope>('full');
  const [running, setRunning] = useState(false);
  const [currentData, setCurrentData] = useState<AuditResponse | null>(null);
  const [history, setHistory] = useState<StoredRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setError(null);
    setCurrentData(null);

    try {
      const res = await fetch('/api/admin/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const data: AuditResponse = await res.json();
      setCurrentData(data);

      const stored: StoredRun = {
        id: crypto.randomUUID(),
        scope,
        timestamp: data.timestamp,
        duration: data.duration,
        score: data.score,
        grade: data.grade,
        summary: data.summary,
        checks: data.checks,
      };

      const updated = [stored, ...history].slice(0, MAX_HISTORY);
      setHistory(updated);
      saveHistory(updated);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRunning(false);
    }
  }, [scope, history]);

  const handleLoadRun = useCallback((run: StoredRun) => {
    setCurrentData({
      scope: run.scope,
      timestamp: run.timestamp,
      duration: run.duration,
      score: run.score,
      grade: run.grade,
      checks: run.checks,
      summary: run.summary,
    });
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Quality Assurance Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Run automated compliance and quality checks across the platform
            </p>
          </div>
        </div>
      </div>

      {/* Scope Selector */}
      <ScopeSelector scope={scope} onSelect={setScope} disabled={running} />

      {/* Run Button */}
      <button
        type="button"
        onClick={handleRun}
        disabled={running}
        className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary/20"
      >
        {running ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Running Audit...
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            Run Audit
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Audit Failed</p>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {running && <LoadingSkeleton />}

      {/* Results */}
      {currentData && !running && (
        <div ref={resultsRef} className="space-y-6">
          <HealthScoreCard data={currentData} />
          <SummaryBar summary={currentData.summary} />
          <CategoryBreakdown checks={currentData.checks} />
        </div>
      )}

      {/* Recent Runs */}
      <RecentRuns history={history} onLoad={handleLoadRun} onClear={handleClearHistory} />
    </div>
  );
}
