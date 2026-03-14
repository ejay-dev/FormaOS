import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  consumeApprovedPlatformChange,
  getPlatformAdminAssignment,
} from '@/lib/admin/governance';
import {
  ALL_PLATFORM_ADMIN_PERMISSIONS,
  hasPlatformPermission,
  type PlatformAdminPermission,
  type PlatformAdminRole,
} from '@/lib/admin/rbac';

function parseEnvList(value?: string | null) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

export type PlatformAdminAccessContext = {
  user: {
    id: string;
    email?: string | null;
  };
  accessType: 'founder' | 'delegated';
  roleKey: PlatformAdminRole | 'founder';
  permissions: Set<PlatformAdminPermission>;
};

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('[requireFounderAccess] ❌ No user found');
    throw new Error('Unauthorized');
  }

  return user;
}

function isFounderUser(user: { id: string; email?: string | null }) {
  const allowedEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  const allowedIds = parseEnvList(process.env.FOUNDER_USER_IDS);

  if (!allowedEmails.size && !allowedIds.size) {
    return { configured: false, allowed: false };
  }

  const email = user.email?.trim().toLowerCase() ?? '';
  const hasEmailAccess = email ? allowedEmails.has(email) : false;
  const hasIdAccess = allowedIds.has(user.id.toLowerCase());
  return {
    configured: true,
    allowed: hasEmailAccess || hasIdAccess,
  };
}

export async function requireFounderAccess() {
  const user = await getAuthenticatedUser();
  const founder = isFounderUser(user);

  if (!founder.configured) {
    console.error('[requireFounderAccess] Founder env vars not configured');
    throw new Error('Founder access not configured');
  }

  if (!founder.allowed) {
    const email = user.email?.trim().toLowerCase() ?? '';
    const maskedEmail = email
      ? `${email.slice(0, 3)}***@${email.split('@')[1] ?? 'unknown'}`
      : 'none';
    console.warn('[requireFounderAccess] Founder check failed', {
      maskedEmail,
      hasUserId: Boolean(user.id),
      route: 'admin',
      reason: 'email-or-id-not-allowed',
    });
    throw new Error('Forbidden');
  }

  return { user };
}

export async function requireAdminAccess(options?: {
  permission?: PlatformAdminPermission | PlatformAdminPermission[];
}) {
  const user = await getAuthenticatedUser();
  const founder = isFounderUser(user);

  if (founder.allowed) {
    const context: PlatformAdminAccessContext = {
      user: {
        id: user.id,
        email: user.email,
      },
      accessType: 'founder',
      roleKey: 'founder',
      permissions: new Set(ALL_PLATFORM_ADMIN_PERMISSIONS),
    };

    if (options?.permission && !hasPlatformPermission(context.permissions, options.permission)) {
      throw new Error('Forbidden');
    }

    return context;
  }

  const assignment = await getPlatformAdminAssignment(user.id);
  if (!assignment || !assignment.is_active) {
    const maskedEmail = user.email
      ? `${user.email.slice(0, 3)}***@${user.email.split('@')[1] ?? 'unknown'}`
      : 'none';
    console.warn('[requireAdminAccess] Platform admin check failed', {
      maskedEmail,
      userId: user.id,
      reason: 'no_active_assignment',
    });
    throw new Error('Forbidden');
  }

  const context: PlatformAdminAccessContext = {
    user: {
      id: user.id,
      email: user.email,
    },
    accessType: 'delegated',
    roleKey: assignment.role_key,
    permissions: new Set(assignment.permissions),
  };

  if (options?.permission && !hasPlatformPermission(context.permissions, options.permission)) {
    throw new Error('Forbidden');
  }

  return context;
}

export async function requireAdminApproval(args: {
  context: PlatformAdminAccessContext;
  action: string;
  targetType: string;
  targetId?: string | null;
}) {
  if (args.context.accessType === 'founder') {
    return null;
  }

  const approval = await consumeApprovedPlatformChange({
    userId: args.context.user.id,
    action: args.action,
    targetType: args.targetType,
    targetId: args.targetId ?? null,
  });

  if (!approval) {
    throw new Error('Approved change required');
  }

  return approval;
}
