'use client';

import type { ReactNode } from 'react';
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
 * Every empty table/list should use this instead of ad-hoc text — including
 * the mobile card lists, which render it through EmptyRecordState.
 *
 * Rules the presets below follow:
 * - a truly-empty state carries exactly one primary action, and that action
 *   performs the thing it names (no links to pages that only describe it)
 * - a filtered-to-nothing state offers "clear filters", never a create action
 * - copy uses the words the user's industry uses (participant / patient /
 *   resident / child), not internal vocabulary
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

export type EmptyStateTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

// Status tones route to the functional tokens. The title always states the
// meaning, so the tint is reinforcement rather than the only signal.
const TONE_TILE: Record<EmptyStateTone, string> = {
  primary:
    'bg-[hsl(var(--app-primary))]/10 ring-[hsl(var(--app-primary))]/10 text-[hsl(var(--app-primary))]',
  success: 'bg-success/10 ring-success/10 text-success',
  warning: 'bg-warning/10 ring-warning/10 text-warning',
  danger: 'bg-destructive/10 ring-destructive/10 text-destructive',
  neutral: 'bg-muted ring-muted text-muted-foreground',
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
  /**
   * Pre-composed action node, for when the affordance already exists as a
   * component (an upload dialog trigger, an invite modal button). Use instead
   * of `action`; a server component can pass a node, a callback it cannot.
   */
  actions?: ReactNode;
  /** Suggested owner/assignee text */
  ownerSuggestion?: string;
  /** Color accent for the icon tile */
  tone?: EmptyStateTone;
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
  actions,
  ownerSuggestion,
  tone = 'primary',
  className,
  compact = false,
}: EmptyStateProps) {
  const Icon = CustomIcon || MODULE_ICONS[module] || MODULE_ICONS.default;

  // A button with neither handler nor href is a dead control: it reads as an
  // affordance and does nothing. Drop it rather than render it.
  const primary = action?.onClick || action?.href ? action : undefined;
  const secondary =
    secondaryAction?.onClick || secondaryAction?.href
      ? secondaryAction
      : undefined;

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
          'flex items-center justify-center rounded-full ring-[6px] mb-4',
          TONE_TILE[tone],
          compact ? 'h-12 w-12' : 'h-14 w-14',
        )}
      >
        <Icon
          className={cn(compact ? 'h-5 w-5' : 'h-6 w-6')}
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

      {(primary || secondary || actions) && (
        <div
          className={cn('flex items-center gap-3', compact ? 'mt-4' : 'mt-6')}
        >
          {actions}
          {primary && (
            <Button
              variant={primary.variant || 'default'}
              size={compact ? 'sm' : 'default'}
              onClick={primary.onClick}
              {...(primary.href ? { asChild: true } : {})}
            >
              {primary.href ? (
                <a href={primary.href}>{primary.label}</a>
              ) : (
                primary.label
              )}
            </Button>
          )}
          {secondary && (
            <Button
              variant={secondary.variant || 'outline'}
              size={compact ? 'sm' : 'default'}
              onClick={secondary.onClick}
              {...(secondary.href ? { asChild: true } : {})}
            >
              {secondary.href ? (
                <a href={secondary.href}>{secondary.label}</a>
              ) : (
                secondary.label
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

/**
 * The upload button is passed in rather than built here: uploading opens a
 * dialog that only the vault owns, and the vault page is a server component,
 * so a callback cannot cross the boundary. Requiring the node keeps this
 * state from shipping as a dead end.
 */
export function EvidenceEmptyState({
  uploadButton,
}: {
  uploadButton: ReactNode;
}) {
  return (
    <EmptyState
      module="evidence"
      title="No evidence uploaded yet"
      description="Evidence is the proof behind a control: a policy, a certificate, a signed form, a photo. Upload a file to start the record."
      actions={uploadButton}
      ownerSuggestion="Compliance lead, or whoever owns the control"
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
      description="Policies set out how your organisation works and what staff have to follow. Write the first one and add the rest as you go."
      action={
        onCreateAction
          ? { label: 'Write a policy', onClick: onCreateAction }
          : { label: 'Write a policy', href: '/app/policies/new' }
      }
      ownerSuggestion="Compliance lead or department head"
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
      title="No tasks yet"
      description="Most tasks come from the frameworks you turn on, and you can add your own on top. Turning on a framework creates the first set."
      action={
        onCreateAction
          ? { label: 'Create a task', onClick: onCreateAction }
          : { label: 'Choose a framework', href: '/app/compliance/frameworks' }
      }
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
      // Without a handler the page owns the invite affordance in its header,
      // so no button is rendered here rather than a button that does nothing.
      description="Invite the people who do the work. Each person gets a role that decides what they can see and change."
      action={{
        label: 'Invite a team member',
        onClick: onInviteAction,
      }}
    />
  );
}

export function IncidentsEmptyState() {
  return (
    <EmptyState
      module="incidents"
      title="No incidents recorded"
      tone="neutral"
      description="A quiet log is a good sign. When something happens, record it here and it keeps a full audit trail."
      action={{ label: 'Report an incident', href: '/app/incidents/new' }}
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
      description="Track staff certifications, licences and clearances in one place, and get warned before any of them expire."
      action={
        onAddAction
          ? { label: 'Add a certificate', onClick: onAddAction }
          : { label: 'Add a certificate', href: '/app/staff-compliance/new' }
      }
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
      // Bulk import is not built yet, so this state does not advertise it.
      description={`Add your first ${l.singular} to start tracking care records, goals, and visit schedules.`}
      action={{ label: `Add first ${l.singular}`, href: '/app/participants/new' }}
      ownerSuggestion="Intake coordinator"
    />
  );
}
