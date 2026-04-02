'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Cpu, AlertTriangle } from 'lucide-react';

interface UsageData {
  currentPeriod: { messages: number; tokens: number; cost: number };
  remaining: { messages: number; tokens: number };
  percentUsed: number;
}

export function AiUsageDashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/ai/usage')
      .then((r) => r.json())
      .then((d) => setUsage(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
        Unable to load AI usage data.
      </div>
    );
  }

  const isNearLimit = usage.percentUsed >= 80;
  const isOverLimit = usage.percentUsed >= 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BarChart3}
          label="Messages This Month"
          value={usage.currentPeriod.messages.toLocaleString()}
          sub={
            usage.remaining.messages === -1
              ? 'Unlimited'
              : `${usage.remaining.messages.toLocaleString()} remaining`
          }
        />
        <StatCard
          icon={Cpu}
          label="Tokens Used"
          value={formatTokens(usage.currentPeriod.tokens)}
          sub={
            usage.remaining.tokens === -1
              ? 'Unlimited'
              : `${formatTokens(usage.remaining.tokens)} remaining`
          }
        />
        <StatCard
          icon={TrendingUp}
          label="Usage"
          value={`${usage.percentUsed}%`}
          sub="of monthly allowance"
          alert={isNearLimit}
        />
        <StatCard
          icon={AlertTriangle}
          label="Estimated Cost"
          value={`$${usage.currentPeriod.cost.toFixed(2)}`}
          sub="this period"
        />
      </div>

      {/* Usage bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Monthly Usage</span>
          <span className="text-muted-foreground">{usage.percentUsed}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              isOverLimit
                ? 'bg-red-500'
                : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
          />
        </div>
        {isNearLimit && !isOverLimit && (
          <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
            Approaching usage limit. Consider upgrading your plan.
          </p>
        )}
        {isOverLimit && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Usage limit reached. Upgrade to continue using AI features.
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${alert ? 'text-yellow-500' : 'text-muted-foreground'}`}
        />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
