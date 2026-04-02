'use client';

import {
  AlertTriangle,
  TrendingDown,
  Clock,
  Ban,
  AlertCircle,
} from 'lucide-react';

interface ChurnOrg {
  id: string;
  name: string;
  plan: string;
  riskScore: number;
  signals: { signal: string; severity: string; detail: string }[];
  lastLogin?: string;
  engagementScore?: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  medium:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const SIGNAL_ICONS: Record<string, typeof AlertTriangle> = {
  login_decline: TrendingDown,
  no_recent_activity: Ban,
  support_spike: AlertCircle,
  stalled_onboarding: Clock,
};

function getRiskBadge(score: number) {
  if (score >= 70)
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  if (score >= 40)
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
  if (score >= 20)
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
  return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
}

export function ChurnRiskPanel({ orgs }: { orgs: ChurnOrg[] }) {
  const sorted = [...orgs].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="space-y-3">
      {sorted.map((org) => (
        <div
          key={org.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                {org.name}
              </h4>
              <span className="text-xs text-muted-foreground">{org.plan}</span>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-bold ${getRiskBadge(org.riskScore)}`}
            >
              Risk: {org.riskScore}
            </span>
          </div>

          {/* Signals */}
          <div className="space-y-1.5 mb-3">
            {org.signals.map((s, i) => {
              const Icon = SIGNAL_ICONS[s.signal] || AlertTriangle;
              return (
                <div key={i} className="flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${SEVERITY_COLORS[s.severity]}`}
                  >
                    {s.severity}
                  </span>
                  <span className="text-xs text-foreground">{s.detail}</span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90">
              Reach Out
            </button>
            <button className="px-3 py-1 text-xs rounded border border-border text-foreground hover:bg-muted">
              Extend Trial
            </button>
            <button className="px-3 py-1 text-xs rounded border border-border text-foreground hover:bg-muted">
              Offer Discount
            </button>
          </div>
        </div>
      ))}
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No orgs at risk of churn
        </p>
      )}
    </div>
  );
}

interface TrialFunnelData {
  signedUp: number;
  activated: number;
  firstControl: number;
  firstEvidence: number;
  invitedTeam: number;
  subscribed: number;
}

export function TrialFunnel({ data }: { data: TrialFunnelData }) {
  const stages = [
    { label: 'Signed Up', value: data.signedUp },
    { label: 'Activated', value: data.activated },
    { label: 'First Control', value: data.firstControl },
    { label: 'First Evidence', value: data.firstEvidence },
    { label: 'Invited Team', value: data.invitedTeam },
    { label: 'Subscribed', value: data.subscribed },
  ];

  const maxVal = stages[0]?.value || 1;

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const width = Math.max(10, (stage.value / maxVal) * 100);
        const conversionRate =
          i > 0
            ? ((stage.value / (stages[i - 1]?.value || 1)) * 100).toFixed(1)
            : '100.0';
        const dropOff = i > 0 ? stages[i - 1]!.value - stage.value : 0;

        return (
          <div key={stage.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">
                {stage.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {stage.value} ({conversionRate}%)
                {i > 0 && dropOff > 0 && (
                  <span className="text-red-500 ml-1">-{dropOff}</span>
                )}
              </span>
            </div>
            <div className="h-8 w-full bg-muted/30 rounded overflow-hidden">
              <div
                className="h-full bg-primary/80 rounded transition-all flex items-center justify-center"
                style={{ width: `${width}%` }}
              >
                <span className="text-[10px] font-bold text-primary-foreground">
                  {stage.value}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
