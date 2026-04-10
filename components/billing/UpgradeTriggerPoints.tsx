'use client';

import { useTrialState } from '@/lib/trial/use-trial-state';
import { useFeatureUsage } from '@/lib/trial/use-feature-usage';
import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Zap,
  Crown,
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  Workflow,
} from 'lucide-react';
import { UpgradeIntelligenceModal } from './UpgradeIntelligenceModal';

/**
 * =========================================================
 * UpgradeTriggerPoints – 7 Smart Contextual Upgrade Prompts
 * =========================================================
 * Provides page-aware, behaviour-triggered upgrade prompts
 * that appear at the right moment based on user actions.
 *
 * Trigger points:
 * 1. Report export attempt (reports page)
 * 2. Workflow creation limit (workflows page)
 * 3. Team invite limit (team page)
 * 4. Vault storage limit (vault page)
 * 5. Audit report generation (audit page)
 * 6. Executive dashboard access (executive page)
 * 7. Feature usage milestone (any page, action threshold)
 *
 * Each trigger shows a minimal inline prompt with a CTA.
 * Mount once in app layout — triggers activate per-route.
 */

const TRIGGER_COOLDOWN_MS = 30 * 60 * 1000; // 30 min between same trigger

interface TriggerState {
  lastShown: Record<string, number>;
  dismissed: Record<string, boolean>;
}

function canShowTrigger(
  id: string,
  state: TriggerState,
  cooldownMs = TRIGGER_COOLDOWN_MS,
): boolean {
  if (state.dismissed[id]) return false;
  const last = state.lastShown[id] ?? 0;
  return Date.now() - last > cooldownMs;
}

/**
 * Inline upgrade nudge — small, non-blocking prompt
 */
function InlineUpgradeNudge({
  icon: Icon,
  message,
  featureId: _featureId,
  onDismiss,
  onUpgrade,
}: {
  icon: React.ElementType;
  message: string;
  featureId: string;
  onDismiss: () => void;
  onUpgrade: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sky-400/20 bg-sky-500/5 px-4 py-3 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="rounded-lg bg-sky-500/10 p-2">
        <Icon className="h-4 w-4 text-sky-400" />
      </div>
      <p className="flex-1 text-foreground/80">{message}</p>
      <button
        onClick={onUpgrade}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:scale-[1.02] transition-transform"
      >
        <Zap className="h-3 w-3" />
        Upgrade
      </button>
      <button
        onClick={onDismiss}
        className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Route-based trigger definitions
 */
const ROUTE_TRIGGERS: Array<{
  id: string;
  routes: string[];
  featureId: string;
  icon: React.ElementType;
  message: string;
  requiresExpired?: boolean;
}> = [
  {
    id: 'report-export',
    routes: ['/app/reports'],
    featureId: 'audit-reports',
    icon: FileText,
    message:
      'Generate audit-ready PDF reports for SOC 2, ISO 27001, HIPAA & more.',
  },
  {
    id: 'workflow-limit',
    routes: ['/app/workflows'],
    featureId: 'workflows',
    icon: Workflow,
    message:
      'Automate evidence collection, task creation & compliance monitoring.',
  },
  {
    id: 'team-limit',
    routes: ['/app/team', '/app/people'],
    featureId: 'team-management',
    icon: Users,
    message:
      'Add unlimited team members with role-based access and audit trails.',
  },
  {
    id: 'vault-storage',
    routes: ['/app/vault'],
    featureId: 'evidence-vault',
    icon: Crown,
    message:
      'Unlimited secure evidence storage with version history and checksums.',
  },
  {
    id: 'audit-generation',
    routes: ['/app/audit'],
    featureId: 'audits',
    icon: FileText,
    message:
      'Run comprehensive audit assessments with gap analysis and scoring.',
  },
  {
    id: 'executive-access',
    routes: ['/app/executive'],
    featureId: 'executive-dashboard',
    icon: TrendingUp,
    message:
      'C-level compliance visibility with risk trends and board-ready reports.',
  },
];

export function UpgradeTriggerPoints() {
  const {
    isTrialUser,
    isExpired,
    canManageBilling,
    isFeatureLocked,
    daysRemaining,
  } = useTrialState();
  const { totalActions } = useFeatureUsage();
  const pathname = usePathname();

  const [triggerState, setTriggerState] = useState<TriggerState>({
    lastShown: {},
    dismissed: {},
  });
  const [activeTriggerId, setActiveTriggerId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalFeature, setModalFeature] = useState('');

  // Don't render if not applicable
  if (!isTrialUser && !isExpired) return null;
  if (!canManageBilling) return null;

  const dismissTrigger = useCallback((id: string) => {
    setTriggerState((prev) => ({
      ...prev,
      dismissed: { ...prev.dismissed, [id]: true },
    }));
    setActiveTriggerId(null);
  }, []);

  const showUpgradeFor = useCallback((featureId: string) => {
    setModalFeature(featureId);
    setShowModal(true);
  }, []);

  // Determine which trigger to show for current route
  const matchedTrigger = ROUTE_TRIGGERS.find(
    (t) =>
      t.routes.some((r) => pathname === r || pathname.startsWith(r + '/')) &&
      canShowTrigger(t.id, triggerState) &&
      isFeatureLocked(t.featureId),
  );

  // Trigger 7: Usage milestone — fires on any page when total actions exceed threshold
  const showMilestoneTrigger =
    !matchedTrigger &&
    totalActions >= 20 &&
    canShowTrigger('usage-milestone', triggerState) &&
    (isExpired || (daysRemaining !== null && daysRemaining <= 3));

  // Mark route trigger as shown
  useEffect(() => {
    const triggerId =
      matchedTrigger?.id ?? (showMilestoneTrigger ? 'usage-milestone' : null);
    if (triggerId && triggerId !== activeTriggerId) {
      setActiveTriggerId(triggerId);
      setTriggerState((prev) => ({
        ...prev,
        lastShown: { ...prev.lastShown, [triggerId]: Date.now() },
      }));
    }
  }, [matchedTrigger?.id, showMilestoneTrigger, activeTriggerId]);

  if (!matchedTrigger && !showMilestoneTrigger) return null;

  if (matchedTrigger) {
    return (
      <>
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 pt-2">
          <InlineUpgradeNudge
            icon={matchedTrigger.icon}
            message={matchedTrigger.message}
            featureId={matchedTrigger.featureId}
            onDismiss={() => dismissTrigger(matchedTrigger.id)}
            onUpgrade={() => showUpgradeFor(matchedTrigger.featureId)}
          />
        </div>
        <UpgradeIntelligenceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          featureId={modalFeature}
        />
      </>
    );
  }

  // Usage milestone trigger
  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 pt-2">
        <InlineUpgradeNudge
          icon={AlertTriangle}
          message={`You've taken ${totalActions} actions across your trial. Upgrade now to keep your momentum.`}
          featureId="general"
          onDismiss={() => dismissTrigger('usage-milestone')}
          onUpgrade={() => showUpgradeFor('general')}
        />
      </div>
      <UpgradeIntelligenceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        featureId={modalFeature}
      />
    </>
  );
}
