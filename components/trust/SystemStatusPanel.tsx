'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Clock, Shield, Zap } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';

interface SystemStatus {
  automationRunning: boolean;
  lastScanTime: string | null;
  subscriptionStatus: 'active' | 'trialing' | 'expired' | 'none';
  subscriptionDaysRemaining: number | null;
  uptime: string;
}

export function SystemStatusPanel() {
  const [status, setStatus] = useState<SystemStatus>({
    automationRunning: false,
    lastScanTime: null,
    subscriptionStatus: 'none',
    subscriptionDaysRemaining: null,
    uptime: '99.9%',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get user's organization
      const { data: membership } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership?.organization_id) {
        setIsLoading(false);
        return;
      }

      const orgId = membership.organization_id;

      // Get subscription status
      const { data: subscription } = await supabase
        .from('org_subscriptions')
        .select('status, current_period_end, trial_expires_at')
        .eq('organization_id', orgId)
        .maybeSingle();

      let subscriptionStatus: 'active' | 'trialing' | 'expired' | 'none' = 'none';
      let daysRemaining: number | null = null;

      if (subscription) {
        subscriptionStatus = subscription.status as 'active' | 'trialing' | 'expired';

        if (subscription.status === 'trialing' && subscription.trial_expires_at) {
          const expiryDate = new Date(subscription.trial_expires_at);
          const today = new Date();
          const diffTime = expiryDate.getTime() - today.getTime();
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      // automation_runs table is not yet provisioned — use defaults until migration is applied
      const automationRunning = false;
      const lastScanTime: string | null = null;

      setStatus({
        automationRunning,
        lastScanTime,
        subscriptionStatus,
        subscriptionDaysRemaining: daysRemaining,
        uptime: 'Monitored', // Changed from false claim to generic monitoring indicator
      });
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionBadge = () => {
    switch (status.subscriptionStatus) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success border border-success/20">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </span>
        );
      case 'trialing':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info border border-info/20">
            <Clock className="h-3 w-3" />
            Trial {status.subscriptionDaysRemaining ? `(${status.subscriptionDaysRemaining}d left)` : ''}
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive border border-destructive/20">
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const formatLastScan = () => {
    if (!status.lastScanTime) return 'Never';

    const scanDate = new Date(status.lastScanTime);
    const now = new Date();
    const diffMs = now.getTime() - scanDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-surface-2" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-surface-2" />
            <div className="h-3 w-3/4 rounded bg-surface-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-success" />
          <h3 className="text-lg font-semibold text-foreground">System Status</h3>
        </div>
        {getSubscriptionBadge()}
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Automation Status */}
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Zap className={`h-4 w-4 ${status.automationRunning ? 'text-success' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium text-muted-foreground">Automation</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {status.automationRunning ? 'Running' : 'Idle'}
          </p>
        </div>

        {/* Last Scan */}
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Last Scan</span>
          </div>
          <p className="text-sm font-semibold text-foreground tabular-nums">{formatLastScan()}</p>
        </div>

        {/* System Status */}
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-muted-foreground">Status</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{status.uptime}</p>
        </div>

        {/* Security Status */}
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-muted-foreground">Security</span>
          </div>
          <p className="text-sm font-semibold text-foreground">Protected</p>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span>Region-aware hosting</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span>Privacy-ready workflows</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span>Framework-aligned controls</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span>Enterprise Security</span>
        </div>
      </div>
    </div>
  );
}
