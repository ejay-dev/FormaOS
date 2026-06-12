'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Shield,
  Eye,
  User,
  UserCheck,
  Crown,
  ChevronRight,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { useSystemState } from '@/lib/system-state';
import { UserRole, ROLE_PERMISSIONS } from '@/lib/system-state/types';
import { useComplianceAction } from '@/components/compliance-system';
import { useModalA11y } from '@/lib/hooks/use-modal-a11y';

/**
 * =========================================================
 * ADMIN PERMISSION FLOW COMPONENT
 * =========================================================
 * Visualizes role-based permissions with real-time updates.
 * Shows permission matrix and role upgrade flows.
 */

const ROLE_CONFIG: Record<
  UserRole,
  {
    name: string;
    description: string;
    icon: LucideIcon;
  }
> = {
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to compliance data',
    icon: Eye,
  },
  member: {
    name: 'Member',
    description: 'Standard team member access',
    icon: User,
  },
  admin: {
    name: 'Admin',
    description: 'Administrative access to team settings',
    icon: UserCheck,
  },
  owner: {
    name: 'Owner',
    description: 'Full organization access',
    icon: Crown,
  },
};

const PERMISSION_LABELS: Record<
  keyof typeof ROLE_PERMISSIONS.viewer,
  {
    name: string;
    description: string;
  }
> = {
  canCreatePolicies: {
    name: 'Create Policies',
    description: 'Create and edit policies',
  },
  canManageTeam: {
    name: 'Manage Team',
    description: 'Invite and manage team members',
  },
  canViewAudit: { name: 'View Audit', description: 'View audit trails' },
  canExportReports: {
    name: 'Export Reports',
    description: 'Export compliance reports',
  },
  canManageBilling: {
    name: 'Billing',
    description: 'Manage billing and subscriptions',
  },
  canAccessAdmin: {
    name: 'Admin Access',
    description: 'Access admin dashboard',
  },
  canEditSettings: {
    name: 'Settings',
    description: 'Edit organization settings',
  },
};

interface RoleCardProps {
  role: UserRole;
  isCurrentRole: boolean;
  onSelect: (role: UserRole) => void;
  isChanging: boolean;
}

function RoleCard({
  role,
  isCurrentRole,
  onSelect,
  isChanging,
}: RoleCardProps) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;
  const permissions = ROLE_PERMISSIONS[role];
  const permissionCount = Object.values(permissions).filter(Boolean).length;

  return (
    <button
      onClick={() => !isCurrentRole && !isChanging && onSelect(role)}
      disabled={isCurrentRole || isChanging}
      className={cn(
        'group relative p-4 rounded-2xl border-2 transition-all duration-300 text-left',
        isCurrentRole
          ? 'border-primary bg-surface-2'
          : 'border-border bg-surface-1 hover:border-edge-3 hover:bg-surface-2',
        !isCurrentRole &&
          !isChanging &&
          'cursor-pointer motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]',
        isChanging && 'opacity-50 cursor-not-allowed',
      )}
    >
      {isCurrentRole && (
        <div className="absolute -top-2 left-4">
          <div className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground border border-primary">
            Current
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-surface-2 border border-border">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground">{config.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
          <p className="text-xs mt-2 text-muted-foreground">
            {permissionCount} permissions
          </p>
        </div>

        {!isCurrentRole && (
          <ChevronRight className="h-5 w-5 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
        )}
      </div>
    </button>
  );
}

interface PermissionMatrixProps {
  currentRole: UserRole;
  selectedRole?: UserRole;
}

function PermissionMatrix({
  currentRole,
  selectedRole,
}: PermissionMatrixProps) {
  const currentPermissions = ROLE_PERMISSIONS[currentRole];
  const comparePermissions = selectedRole
    ? ROLE_PERMISSIONS[selectedRole]
    : null;

  return (
    <div className="space-y-2">
      {(
        Object.entries(PERMISSION_LABELS) as Array<
          [
            keyof typeof ROLE_PERMISSIONS.viewer,
            { name: string; description: string },
          ]
        >
      ).map(([key, label]) => {
        const hasCurrent = currentPermissions[key];
        const hasCompare = comparePermissions?.[key];
        const isGaining = comparePermissions && !hasCurrent && hasCompare;
        const isLosing = comparePermissions && hasCurrent && !hasCompare;

        return (
          <div
            key={key}
            className={cn(
              'flex items-center justify-between p-3 rounded-xl border transition-all duration-300',
              isGaining && 'border-success/20 bg-success/10',
              isLosing && 'border-destructive/20 bg-destructive/10',
              !isGaining &&
                !isLosing &&
                (hasCurrent
                  ? 'border-border bg-surface-1'
                  : 'border-edge-1 bg-surface-1'),
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center',
                  hasCurrent ? 'bg-success/10' : 'bg-surface-2',
                )}
              >
                {hasCurrent ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground/60" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    'text-sm font-medium',
                    hasCurrent ? 'text-foreground' : 'text-muted-foreground/60',
                  )}
                >
                  {label.name}
                </p>
                <p className="text-xs text-muted-foreground/60">{label.description}</p>
              </div>
            </div>

            {/* Change indicator */}
            {isGaining && (
              <div className="flex items-center gap-1 text-success">
                <Unlock className="h-4 w-4" />
                <span className="text-xs font-medium">Gaining</span>
              </div>
            )}
            {isLosing && (
              <div className="flex items-center gap-1 text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Losing</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface AdminPermissionFlowProps {
  onRoleChange?: (newRole: UserRole) => void;
}

export function AdminPermissionFlow({
  onRoleChange,
}: AdminPermissionFlowProps) {
  const { changeRole, getRole, hasPermission } = useSystemState();
  const { reportSuccess, reportWarning, reportInfo, reportError } =
    useComplianceAction();

  const [isChanging, setIsChanging] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentRole = getRole();
  const canManageRoles = hasPermission('canManageTeam'); // canManageTeam includes role management

  const handleRoleSelect = useCallback(
    (role: UserRole) => {
      if (!canManageRoles) {
        reportWarning({
          title: 'Permission denied',
          message: "You don't have permission to change roles",
        });
        return;
      }

      setSelectedRole(role);
      setShowConfirm(true);
    },
    [canManageRoles, reportWarning],
  );

  const handleConfirmChange = useCallback(async () => {
    if (!selectedRole) return;

    setIsChanging(true);
    setShowConfirm(false);

    try {
      reportInfo({
        title: 'Updating permissions',
        message: 'Reconfiguring access levels...',
      });

      await changeRole(selectedRole);

      reportSuccess({
        title: 'Role updated',
        message: `Permissions updated to ${ROLE_CONFIG[selectedRole].name}`,
        impactArea: 'System access',
        impactDelta:
          selectedRole === 'owner' ? 30 : selectedRole === 'admin' ? 20 : 10,
      });

      if (onRoleChange) {
        onRoleChange(selectedRole);
      }
    } catch (_error) {
      reportError({
        title: 'Update failed',
        message: 'Could not update role. Please try again.',
      });
    } finally {
      setIsChanging(false);
      setSelectedRole(null);
    }
  }, [
    selectedRole,
    changeRole,
    reportSuccess,
    reportInfo,
    reportError,
    onRoleChange,
  ]);

  const handleCancelChange = useCallback(() => {
    setShowConfirm(false);
    setSelectedRole(null);
  }, []);

  const confirmPanelRef = useModalA11y<HTMLDivElement>(
    showConfirm && !!selectedRole,
    handleCancelChange,
  );

  const roles: UserRole[] = ['viewer', 'member', 'admin', 'owner'];

  return (
    <div className="space-y-8">
      {/* Role Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Role Management</h3>
            <p className="text-sm text-muted-foreground">
              Select a role to view or change permissions
            </p>
          </div>
          {!canManageRoles && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20">
              <Lock className="h-3 w-3 text-warning" />
              <span className="text-xs text-warning">View only</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((role) => (
            <RoleCard
              key={role}
              role={role}
              isCurrentRole={currentRole === role}
              onSelect={handleRoleSelect}
              isChanging={isChanging}
            />
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-3">
          {selectedRole
            ? `Compare: ${ROLE_CONFIG[currentRole].name} → ${ROLE_CONFIG[selectedRole].name}`
            : 'Current Permissions'}
        </h4>
        <PermissionMatrix
          currentRole={currentRole}
          selectedRole={selectedRole || undefined}
        />
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div
            ref={confirmPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-role-change-title"
            className="bg-popover border border-border rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full mx-auto animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-surface-2 flex items-center justify-center">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3
                  id="confirm-role-change-title"
                  className="text-lg font-bold text-foreground"
                >
                  Confirm Role Change
                </h3>
                <p className="text-sm text-muted-foreground">
                  This will update permissions
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-1 border border-border mb-6">
              <div className="flex items-center gap-3">
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground/60 mb-1">From</p>
                  <p className="font-bold text-foreground">
                    {ROLE_CONFIG[currentRole].name}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
                <div className="text-center flex-1">
                  <p className="text-xs text-muted-foreground/60 mb-1">To</p>
                  <p className="font-bold text-foreground">
                    {ROLE_CONFIG[selectedRole].name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelChange}
                className="flex-1 py-3 rounded-xl border border-border text-foreground font-medium hover:bg-surface-1 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChange}
                disabled={isChanging}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all motion-safe:active:scale-95 flex items-center justify-center gap-2"
              >
                {isChanging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Role Summary */}
      <div className="p-4 rounded-2xl bg-surface-1 border border-edge-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-surface-2 flex items-center justify-center">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Role</p>
            <p className="font-bold text-foreground">
              {ROLE_CONFIG[currentRole].name}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">Permissions</p>
            <p className="font-bold text-foreground">
              {
                Object.values(ROLE_PERMISSIONS[currentRole]).filter(Boolean)
                  .length
              }
              /7
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
