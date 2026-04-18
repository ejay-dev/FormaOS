'use client';

import { cn } from '@/lib/utils';
import {
  FileText,
  Shield,
  Users,
  ClipboardCheck,
  FolderOpen,
  AlertTriangle,
  CheckCircle,
  Upload,
  Search,
  HeartPulse,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * =========================================================
 * EMPTY STATE COMPONENT LIBRARY
 * =========================================================
 *
 * Unified zero-state framework for FormaOS.
 * Every empty table/list should use this instead of ad-hoc text.
 *
 * Features:
 * - Contextual icons per module
 * - Suggested next action (primary CTA)
 * - Template suggestion (secondary CTA)
 * - Owner suggestion text
 * - Responsive, accessible, theme-aware
 */

// Preset icons mapped to module contexts
const MODULE_ICONS: Record<string, LucideIcon> = {
  evidence: FolderOpen,
  policies: FileText,
  compliance: Shield,
  team: Users,
  tasks: ClipboardCheck,
  incidents: AlertTriangle,
  certificates: CheckCircle,
  uploads: Upload,
  search: Search,
  carePlans: HeartPulse,
  participants: UserPlus,
  default: FolderOpen,
};

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface EmptyStateProps {
  /** Module context for icon selection */
  module?: keyof typeof MODULE_ICONS | string;
  /** Custom icon override */
  icon?: LucideIcon;
  /** Main heading */
  title: string;
  /** Supporting description */
  description?: string;
  /** Primary action CTA */
  action?: EmptyStateAction;
  /** Secondary/template action */
  secondaryAction?: EmptyStateAction;
  /** Suggested owner/assignee text */
  ownerSuggestion?: string;
  /** Additional class names */
  className?: string;
  /** Compact mode for inline use */
  compact?: boolean;
}

export function EmptyState({
  module = 'default',
  icon: CustomIcon,
  title,
  description,
  action,
  secondaryAction,
  ownerSuggestion,
  className,
  compact = false,
}: EmptyStateProps) {
  const Icon = CustomIcon || MODULE_ICONS[module] || MODULE_ICONS.default;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className,
      )}
      role="status"
      aria-label={title}
    >
      <div
        className={cn(
          'rounded-2xl bg-muted/50 flex items-center justify-center mb-4',
          compact ? 'h-12 w-12' : 'h-16 w-16',
        )}
      >
        <Icon
          className={cn(
            'text-muted-foreground',
            compact ? 'h-6 w-6' : 'h-8 w-8',
          )}
          aria-hidden="true"
        />
      </div>

      <h3
        className={cn(
          'font-semibold text-foreground',
          compact ? 'text-sm' : 'text-lg',
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-muted-foreground mt-2 max-w-md',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {description}
        </p>
      )}

      {ownerSuggestion && (
        <p className="text-xs text-muted-foreground/70 mt-2 italic">
          Suggested owner: {ownerSuggestion}
        </p>
      )}

      {(action || secondaryAction) && (
        <div
          className={cn('flex items-center gap-3', compact ? 'mt-4' : 'mt-6')}
        >
          {action && (
            <Button
              variant={action.variant || 'default'}
              size={compact ? 'sm' : 'default'}
              onClick={action.onClick}
              {...(action.href ? { asChild: true } : {})}
            >
              {action.href ? (
                <a href={action.href}>{action.label}</a>
              ) : (
                action.label
              )}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'outline'}
              size={compact ? 'sm' : 'default'}
              onClick={secondaryAction.onClick}
              {...(secondaryAction.href ? { asChild: true } : {})}
            >
              {secondaryAction.href ? (
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              ) : (
                secondaryAction.label
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured empty states for common modules
 */

export function EvidenceEmptyState({
  onUploadAction,
}: {
  onUploadAction?: () => void;
}) {
  return (
    <EmptyState
      module="evidence"
      title="No evidence collected yet"
      description="Start collecting evidence to demonstrate compliance. Upload documents, screenshots, or connect integrations."
      action={{
        label: 'Upload Evidence',
        onClick: onUploadAction,
      }}
      secondaryAction={{
        label: 'Use Template',
        href: '/app/evidence?template=true',
      }}
      ownerSuggestion="Compliance Lead or assigned control owner"
    />
  );
}

export function PoliciesEmptyState({
  onCreateAction,
}: {
  onCreateAction?: () => void;
}) {
  return (
    <EmptyState
      module="policies"
      title="Your policy library is empty"
      description="Policies define your governance posture. Draft with AI, start from a template, or upload an existing document."
      action={
        onCreateAction
          ? { label: 'Draft with AI', onClick: onCreateAction }
          : { label: 'Draft with AI', href: '/app/policies/new' }
      }
      secondaryAction={{
        label: 'Use a template',
        href: '/app/policies?templates=true',
      }}
      ownerSuggestion="Compliance Lead or department head"
    />
  );
}

export function TasksEmptyState({
  onCreateAction,
}: {
  onCreateAction?: () => void;
}) {
  return (
    <EmptyState
      module="tasks"
      title="No tasks assigned"
      description="Tasks help your team stay on track with compliance activities. Create tasks manually or let automation handle it."
      action={{
        label: 'Create Task',
        onClick: onCreateAction,
      }}
      ownerSuggestion="Team lead or compliance manager"
    />
  );
}

export function TeamEmptyState({
  onInviteAction,
}: {
  onInviteAction?: () => void;
}) {
  return (
    <EmptyState
      module="team"
      title="No team members yet"
      description="Invite your team to collaborate on compliance. Each member can be assigned a specific role."
      action={{
        label: 'Invite Team Member',
        onClick: onInviteAction,
      }}
    />
  );
}

export function SearchEmptyState({ query }: { query?: string }) {
  return (
    <EmptyState
      module="search"
      title={query ? `No results for "${query}"` : 'No results found'}
      description="Try adjusting your search terms or filters to find what you're looking for."
      compact
    />
  );
}

export function ComplianceEmptyState() {
  return (
    <EmptyState
      module="compliance"
      title="No frameworks enabled"
      description="Enable a compliance framework to start tracking controls, evidence, and audit readiness."
      action={{
        label: 'Enable Framework',
        href: '/app/compliance',
      }}
      secondaryAction={{
        label: 'View Available Frameworks',
        href: '/app/compliance?browse=true',
      }}
    />
  );
}

export function IncidentsEmptyState() {
  return (
    <EmptyState
      module="incidents"
      title="No incidents recorded"
      description="When incidents occur, they'll appear here with full audit trail. This is a good sign — your organization is running smoothly."
    />
  );
}

export function CertificatesEmptyState({
  onAddAction,
}: {
  onAddAction?: () => void;
}) {
  return (
    <EmptyState
      module="certificates"
      title="No certificates tracked"
      description="Track team certifications, licenses, and credentials with automatic expiry alerts."
      action={{
        label: 'Add Certificate',
        onClick: onAddAction,
      }}
    />
  );
}

type CareIndustry = 'ndis' | 'healthcare' | 'aged_care' | 'childcare' | null;

export function CarePlansEmptyState({
  industry,
  filtered = false,
}: {
  industry?: CareIndustry;
  filtered?: boolean;
}) {
  const planLabel =
    industry === 'ndis'
      ? 'support plan'
      : industry === 'healthcare'
        ? 'clinical plan'
        : industry === 'childcare'
          ? 'learning plan'
          : 'care plan';

  if (filtered) {
    return (
      <EmptyState
        module="search"
        title={`No ${planLabel}s matched your filters`}
        description="Try clearing filters or adjusting the date range."
        action={{ label: 'Clear filters', href: '/app/care-plans', variant: 'outline' }}
        compact
      />
    );
  }

  return (
    <EmptyState
      module="carePlans"
      title={`No ${planLabel}s yet`}
      description={`${planLabel.charAt(0).toUpperCase() + planLabel.slice(1)}s turn assessed needs into daily routines your team can run against — with goals, supports, and review schedules.`}
      action={{ label: `Create first ${planLabel}`, href: '/app/care-plans/new' }}
      secondaryAction={{
        label: 'Browse templates',
        href: '/app/care-plans?templates=true',
      }}
      ownerSuggestion="Care coordinator or clinical lead"
    />
  );
}

export function ParticipantsEmptyState({
  industry,
  filtered = false,
}: {
  industry?: CareIndustry;
  filtered?: boolean;
}) {
  const labels = {
    ndis: { singular: 'participant', plural: 'participants' },
    healthcare: { singular: 'patient', plural: 'patients' },
    aged_care: { singular: 'resident', plural: 'residents' },
    childcare: { singular: 'child', plural: 'children' },
  } as const;

  const l =
    (industry && labels[industry as keyof typeof labels]) ??
    ({ singular: 'client', plural: 'clients' } as const);

  if (filtered) {
    return (
      <EmptyState
        module="search"
        title={`No ${l.plural} matched your filters`}
        description="Adjust or clear your filters to see all records."
        action={{ label: 'Clear filters', href: '/app/participants', variant: 'outline' }}
        compact
      />
    );
  }

  return (
    <EmptyState
      module="participants"
      title={`No ${l.plural} yet`}
      description={`Add your first ${l.singular} to start tracking care records, goals, and visit schedules. You can also import a CSV.`}
      action={{ label: `Add first ${l.singular}`, href: '/app/participants/new' }}
      secondaryAction={{
        label: 'Import CSV',
        href: '/app/participants/import',
      }}
      ownerSuggestion="Intake coordinator"
    />
  );
}

export function EvidenceExpiringEmptyState() {
  return (
    <EmptyState
      module="evidence"
      icon={CheckCircle}
      title="Nothing expiring soon"
      description="All collected evidence is current. We'll alert you 30 days before any item expires."
      compact
    />
  );
}
