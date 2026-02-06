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
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { useSystemState } from '@/lib/system-state';
import { UserRole, ROLE_PERMISSIONS } from '@/lib/system-state/types';
import { useComplianceAction } from '@/components/compliance-system';

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
    color: string;
    gradient: string;
  }
> = {
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to compliance data',
    icon: Eye,
    color: 'slate',
    gradient: 'from-slate-500/20 to-gray-500/20',
  },
  member: {
    name: 'Member',
    description: 'Standard team member access',
    icon: User,
    color: 'blue',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  admin: {
    name: 'Admin',
    description: 'Administrative access to team settings',
    icon: UserCheck,
    color: 'violet',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  owner: {
    name: 'Owner',
    description: 'Full organization access',
    icon: Crown,
    color: 'amber',
    gradient: 'from-amber-500/20 to-orange-500/20',
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
          ? `border-${config.color}-400/50 bg-gradient-to-br ${config.gradient}`
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
        !isCurrentRole &&
          !isChanging &&
          'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
        isChanging && 'opacity-50 cursor-not-allowed',
      )}
    >
      {isCurrentRole && (
        <div className="absolute -top-2 left-4">
          <div
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
              `bg-${config.color}-500/20 text-${config.color}-300 border border-${config.color}-400/30`,
            )}
          >
            Current
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
            `bg-${config.color}-500/20 border border-${config.color}-400/30`,
          )}
        >
          <Icon className={`h-5 w-5 text-${config.color}-400`} />
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              'font-bold',
              isCurrentRole ? `text-${config.color}-300` : 'text-white',
            )}
          >
            {config.name}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">{config.description}</p>
          <p className={cn('text-xs mt-2', `text-${config.color}-400`)}>
            {permissionCount} permissions
          </p>
        </div>

        {!isCurrentRole && (
          <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
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
              isGaining && 'border-emerald-400/30 bg-emerald-500/10',
              isLosing && 'border-red-400/30 bg-red-500/10',
              !isGaining &&
                !isLosing &&
                (hasCurrent
                  ? 'border-white/10 bg-white/5'
                  : 'border-slate-700/50 bg-slate-800/50'),
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center',
                  hasCurrent ? 'bg-emerald-500/20' : 'bg-slate-700/50',
                )}
              >
                {hasCurrent ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 text-slate-500" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    'text-sm font-medium',
                    hasCurrent ? 'text-white' : 'text-slate-500',
                  )}
                >
                  {label.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {label.description}
                </p>
              </div>
            </div>

            {/* Change indicator */}
            {isGaining && (
              <div className="flex items-center gap-1 text-emerald-400">
                <Unlock className="h-4 w-4" />
                <span className="text-xs font-medium">Gaining</span>
              </div>
            )}
            {isLosing && (
              <div className="flex items-center gap-1 text-red-400">
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
  const { state, changeRole, getRole, hasPermission } = useSystemState();
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
    } catch (error) {
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

  const roles: UserRole[] = ['viewer', 'member', 'admin', 'owner'];

  return (
    <div className="space-y-8">
      {/* Role Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Role Management</h3>
            <p className="text-sm text-slate-400">
              Select a role to view or change permissions
            </p>
          </div>
          {!canManageRoles && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30">
              <Lock className="h-3 w-3 text-amber-400" />
              <span className="text-xs text-amber-300">View only</span>
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
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full mx-auto animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Confirm Role Change
                </h3>
                <p className="text-sm text-slate-400">
                  This will update permissions
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-center flex-1">
                  <p className="text-xs text-slate-500 mb-1">From</p>
                  <p className="font-bold text-white">
                    {ROLE_CONFIG[currentRole].name}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-500" />
                <div className="text-center flex-1">
                  <p className="text-xs text-slate-500 mb-1">To</p>
                  <p className="font-bold text-violet-300">
                    {ROLE_CONFIG[selectedRole].name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelChange}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChange}
                disabled={isChanging}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
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
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Current Role</p>
            <p className="font-bold text-white">
              {ROLE_CONFIG[currentRole].name}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-slate-400">Permissions</p>
            <p className="font-bold text-emerald-400">
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
