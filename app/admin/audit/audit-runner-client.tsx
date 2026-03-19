'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  Loader2,
  Clock,
  Shield,
  Code,
  Database,
  FileSearch,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

type AuditScope =
  | 'full'
  | 'typescript'
  | 'frontend'
  | 'backend'
  | 'security'
  | 'dependencies';

type CheckStatus = 'pass' | 'warn' | 'fail';

type CheckResult = {
  status: CheckStatus;
  name: string;
  message: string;
  details?: string;
};

type AuditRun = {
  id: string;
  scope: AuditScope;
  timestamp: string;
  results: CheckResult[];
  summary: { passed: number; warnings: number; failed: number };
};

const SCOPE_OPTIONS: {
  value: AuditScope;
  label: string;
  icon: typeof Shield;
  description: string;
}[] = [
  {
    value: 'full',
    label: 'Full Audit',
    icon: Shield,
    description: 'Runs everything',
  },
  {
    value: 'typescript',
    label: 'TypeScript',
    icon: Code,
    description: 'Type checking',
  },
  {
    value: 'frontend',
    label: 'Frontend',
    icon: FileSearch,
    description: 'ESLint on components/app',
  },
  {
    value: 'backend',
    label: 'Backend',
    icon: Database,
    description: 'ESLint on lib/api',
  },
  {
    value: 'security',
    label: 'Security',
    icon: Shield,
    description: 'npm audit',
  },
  {
    value: 'dependencies',
    label: 'Dependencies',
    icon: Database,
    description: 'Dep analysis',
  },
];

const HISTORY_KEY = 'formaos-audit-runner-history';
const MAX_HISTORY = 5;

function getStatusIcon(status: CheckStatus) {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case 'warn':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case 'fail':
      return <XCircle className="h-4 w-4 text-red-400" />;
  }
}

function formatTimestamp(ts: string) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function loadHistory(): AuditRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuditRun[];
  } catch {
    return [];
  }
}

function saveHistory(runs: AuditRun[]) {
  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(runs.slice(0, MAX_HISTORY)),
    );
  } catch {
    // localStorage may be full or unavailable
  }
}

function ResultRow({ result }: { result: CheckResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg bg-card">
      <button
        type="button"
        onClick={() => result.details && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${
          result.details
            ? 'cursor-pointer hover:bg-muted/50 transition-colors'
            : 'cursor-default'
        }`}
      >
        <div className="flex-shrink-0">{getStatusIcon(result.status)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">
            {result.name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {result.message}
          </div>
        </div>
        {result.details && (
          <div className="flex-shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        )}
      </button>
      {expanded && result.details && (
        <div className="border-t border-border px-4 py-3 bg-muted/30">
          <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words overflow-x-auto max-h-64 overflow-y-auto">
            {result.details}
          </pre>
        </div>
      )}
    </div>
  );
}

function RunSummary({ run }: { run: AuditRun }) {
  const [expanded, setExpanded] = useState(false);
  const scopeLabel =
    SCOPE_OPTIONS.find((s) => s.value === run.scope)?.label ?? run.scope;

  return (
    <div className="border border-border rounded-lg bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">
            {scopeLabel}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatTimestamp(run.timestamp)}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs flex-shrink-0">
          <span className="text-emerald-400">{run.summary.passed} passed</span>
          <span className="text-amber-400">{run.summary.warnings} warn</span>
          <span className="text-red-400">{run.summary.failed} failed</span>
        </div>
        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          {run.results.map((result, i) => (
            <ResultRow key={`${run.id}-${i}`} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AuditRunnerClient() {
  const [scope, setScope] = useState<AuditScope>('full');
  const [running, setRunning] = useState(false);
  const [currentRun, setCurrentRun] = useState<AuditRun | null>(null);
  const [history, setHistory] = useState<AuditRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setError(null);
    setCurrentRun(null);

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

      const data = await res.json();

      const results: CheckResult[] = data.results ?? [];
      const summary = {
        passed: results.filter((r: CheckResult) => r.status === 'pass').length,
        warnings: results.filter((r: CheckResult) => r.status === 'warn')
          .length,
        failed: results.filter((r: CheckResult) => r.status === 'fail').length,
      };

      const run: AuditRun = {
        id: crypto.randomUUID(),
        scope,
        timestamp: new Date().toISOString(),
        results,
        summary,
      };

      setCurrentRun(run);

      const updatedHistory = [run, ...history].slice(0, MAX_HISTORY);
      setHistory(updatedHistory);
      saveHistory(updatedHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setRunning(false);
    }
  }, [scope, history]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Quality Assurance Runner
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Run automated checks across the codebase
        </p>
      </div>

      {/* Scope Selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Audit Scope
        </label>
        <div className="flex flex-wrap gap-2">
          {SCOPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = scope === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                disabled={running}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/70'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {SCOPE_OPTIONS.find((s) => s.value === scope)?.description}
        </p>
      </div>

      {/* Run Button */}
      <button
        type="button"
        onClick={handleRun}
        disabled={running}
        className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {currentRun && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Results</h3>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(currentRun.timestamp)}
            </span>
          </div>

          {/* Summary Bar */}
          <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">
                {currentRun.summary.passed} passed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">
                {currentRun.summary.warnings} warnings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">
                {currentRun.summary.failed} failed
              </span>
            </div>
          </div>

          {/* Check Results */}
          <div className="space-y-2">
            {currentRun.results.map((result, i) => (
              <ResultRow key={`current-${i}`} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Runs
          </h3>
          <div className="space-y-2">
            {history.map((run) => (
              <RunSummary key={run.id} run={run} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
