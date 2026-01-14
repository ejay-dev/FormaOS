/**
 * =========================================================
 * API PERMISSION GUARDS
 * =========================================================
 * Server-side helpers to enforce role-based access control
 * at the API layer using RLS + role checks
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DatabaseRole, hasPermission, Permission } from '@/lib/roles';
import { NextResponse } from 'next/server';

/**
 * User context fetched from database
 */
export interface UserContext {
  userId: string;
  orgId: string;
  role: DatabaseRole;
  email: string;
}

/**
 * Fetch user context from database
 */
export async function getUserContext(): Promise<UserContext | null> {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return null;

    // Get org membership
    const { data: membership } = await supabase
      .from('org_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership?.organization_id) return null;

    return {
      userId: user.id,
      orgId: membership.organization_id,
      role: (membership.role as DatabaseRole) || 'viewer',
      email: user.email || '',
    };
  } catch (error) {
    console.error('Failed to fetch user context:', error);
    return null;
  }
}

/**
 * Verify user has required permission
 */
export function requirePermission(
  context: UserContext | null,
  permission: Permission,
): { allowed: boolean; reason?: string } {
  if (!context) {
    return { allowed: false, reason: 'Not authenticated' };
  }

  if (!hasPermission(context.role, permission)) {
    return {
      allowed: false,
      reason: `Role ${context.role} does not have permission: ${permission}`,
    };
  }

  return { allowed: true };
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(reason: string = 'Unauthorized') {
  return NextResponse.json({ error: reason }, { status: 403 });
}

/**
 * Create not found response
 */
export function notFoundResponse() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

/**
 * Verify user belongs to organization
 */
export async function verifyOrgAccess(
  userId: string,
  orgId: string,
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('org_members')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .maybeSingle();

    return !error && !!data;
  } catch (error) {
    console.error('Failed to verify org access:', error);
    return false;
  }
}

/**
 * Verify user can access other user's data (only org admins)
 */
export function canAccessUserData(
  context: UserContext,
  targetUserId: string,
  sameOrgOnly: boolean = true,
): boolean {
  // Users can always access their own data
  if (context.userId === targetUserId) {
    return true;
  }

  // Only admins can access other users' data
  if (context.role !== 'owner' && context.role !== 'admin') {
    return false;
  }

  return true;
}

/**
 * Verify user can modify resource
 */
export function canModifyResource(
  context: UserContext,
  resourceType: 'team' | 'cert' | 'evidence' | 'task' | 'settings',
): boolean {
  const permissionMap: Record<string, Permission[]> = {
    team: ['team:invite_members', 'team:remove_members', 'team:change_roles'],
    cert: ['cert:create', 'cert:edit', 'cert:delete'],
    evidence: ['evidence:approve', 'evidence:reject'],
    task: ['task:assign', 'task:create_for_others'],
    settings: ['org:manage_settings'],
  };

  const requiredPermissions = permissionMap[resourceType] || [];
  return requiredPermissions.some((p) => hasPermission(context.role, p));
}

/**
 * Query builder: Add org filter based on context
 */
export async function getOrgFilteredQuery<T>(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: string,
  context: UserContext,
) {
  // RLS will automatically filter based on org_id for user's org
  // This is a helper to make it explicit
  return supabase.from(table).select('*').eq('organization_id', context.orgId);
}

/**
 * Query builder: Add org + user filter
 */
export async function getUserFilteredQuery<T>(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: string,
  context: UserContext,
  userId?: string,
) {
  const targetUserId = userId || context.userId;

  // If targeting another user and not an admin, deny
  if (
    userId &&
    userId !== context.userId &&
    context.role !== 'owner' &&
    context.role !== 'admin'
  ) {
    return null; // Access denied
  }

  return supabase
    .from(table)
    .select('*')
    .eq('organization_id', context.orgId)
    .eq('user_id', targetUserId);
}

/**
 * Middleware for API endpoints - validates auth and permissions
 */
export async function requireAuth(permission?: Permission) {
  const context = await getUserContext();

  if (!context) {
    return { error: unauthorizedResponse('Not authenticated'), context: null };
  }

  if (permission) {
    const check = requirePermission(context, permission);
    if (!check.allowed) {
      return { error: unauthorizedResponse(check.reason), context };
    }
  }

  return { error: null, context };
}

/**
 * Extract org ID from request context
 */
export function getOrgIdFromPath(pathname: string): string | null {
  // Example: /api/org/[orgId]/... → extract orgId
  const match = pathname.match(/\/api\/org\/([^/]+)\//);
  return match ? match[1] : null;
}
