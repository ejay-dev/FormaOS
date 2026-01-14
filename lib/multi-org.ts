/**
 * =========================================================
 * Multi-Organization Management System
 * =========================================================
 * Support for users belonging to multiple organizations
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { getCached, CacheKeys, invalidateCache } from './cache';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  settings?: Record<string, any>;
  subscription_tier?: 'free' | 'starter' | 'pro' | 'enterprise';
  subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled';
  created_at: string;
  owner_id: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'invited' | 'suspended';
  joined_at?: string;
  invited_by?: string;
  organization: Organization;
}

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(
  userId: string,
): Promise<OrganizationMembership[]> {
  const cacheKey = `user:${userId}:organizations`;

  return getCached(
    cacheKey,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('team_members')
        .select(
          `
          id,
          organization_id,
          user_id,
          role,
          status,
          joined_at,
          invited_by,
          organizations:organization_id (
            id,
            name,
            slug,
            description,
            logo_url,
            settings,
            subscription_tier,
            subscription_status,
            created_at,
            owner_id
          )
        `,
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching user organizations:', error);
        return [];
      }

      return (data || []).map((membership: any) => ({
        id: membership.id,
        organization_id: membership.organization_id,
        user_id: membership.user_id,
        role: membership.role,
        status: membership.status,
        joined_at: membership.joined_at,
        invited_by: membership.invited_by,
        organization: membership.organizations,
      }));
    },
    300, // 5 minutes cache
  );
}

/**
 * Get current organization from context/session
 */
export async function getCurrentOrganization(
  userId: string,
): Promise<Organization | null> {
  const supabase = await createClient();

  // Try to get from user preferences
  const { data: preference } = await supabase
    .from('user_preferences')
    .select('current_organization_id')
    .eq('user_id', userId)
    .single();

  let orgId = preference?.current_organization_id;

  // If no preference, get first organization
  if (!orgId) {
    const orgs = await getUserOrganizations(userId);
    if (orgs.length > 0) {
      orgId = orgs[0].organization_id;

      // Save as default
      await setCurrentOrganization(userId, orgId);
    }
  }

  if (!orgId) return null;

  // Fetch organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  return org;
}

/**
 * Set current organization for user
 */
export async function setCurrentOrganization(
  userId: string,
  organizationId: string,
): Promise<void> {
  const supabase = await createClient();

  // Verify user has access to this org
  const orgs = await getUserOrganizations(userId);
  const hasAccess = orgs.some((o) => o.organization_id === organizationId);

  if (!hasAccess) {
    throw new Error('User does not have access to this organization');
  }

  // Update preference
  await supabase.from('user_preferences').upsert(
    {
      user_id: userId,
      current_organization_id: organizationId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    },
  );

  // Invalidate cache
  await invalidateCache(`user:${userId}:organizations`);
}

/**
 * Create a new organization
 */
export async function createOrganization(
  userId: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    logo_url?: string;
  },
): Promise<Organization> {
  const supabase = await createClient();

  // Check if slug is available
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', data.slug)
    .single();

  if (existing) {
    throw new Error('Organization slug already taken');
  }

  // Create organization
  const { data: org, error } = await supabase
    .from('organizations')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description,
      logo_url: data.logo_url,
      owner_id: userId,
      subscription_tier: 'free',
      subscription_status: 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create organization: ${error.message}`);
  }

  // Add creator as owner
  await supabase.from('team_members').insert({
    organization_id: org.id,
    user_id: userId,
    role: 'owner',
    status: 'active',
    joined_at: new Date().toISOString(),
  });

  // Set as current organization
  await setCurrentOrganization(userId, org.id);

  // Invalidate cache
  await invalidateCache(`user:${userId}:organizations`);

  return org;
}

/**
 * Update organization
 */
export async function updateOrganization(
  organizationId: string,
  userId: string,
  updates: Partial<Organization>,
): Promise<Organization> {
  const supabase = await createClient();

  // Verify user is owner/admin
  const { data: membership } = await supabase
    .from('team_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Insufficient permissions');
  }

  // Update organization
  const { data: org, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update organization: ${error.message}`);
  }

  // Invalidate cache for all members
  const { data: members } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('organization_id', organizationId);

  if (members) {
    await Promise.all(
      members.map((m: any) =>
        invalidateCache(`user:${m.user_id}:organizations`),
      ),
    );
  }

  return org;
}

/**
 * Delete organization (owner only)
 */
export async function deleteOrganization(
  organizationId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();

  // Verify user is owner
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', organizationId)
    .single();

  if (!org || org.owner_id !== userId) {
    throw new Error('Only the organization owner can delete the organization');
  }

  // Delete organization (cascade will handle related records)
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId);

  if (error) {
    throw new Error(`Failed to delete organization: ${error.message}`);
  }

  // Invalidate cache
  await invalidateCache(`user:${userId}:organizations`);
}

/**
 * Invite user to organization
 */
export async function inviteToOrganization(
  organizationId: string,
  invitedBy: string,
  email: string,
  role: 'admin' | 'member' | 'viewer' = 'member',
): Promise<void> {
  const supabase = await createClient();

  // Verify inviter has permission
  const { data: inviter } = await supabase
    .from('team_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', invitedBy)
    .single();

  if (!inviter || !['owner', 'admin'].includes(inviter.role)) {
    throw new Error('Insufficient permissions');
  }

  // Check if user exists
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (!user) {
    // Send invitation email (to be implemented)
    throw new Error('User not found. Email invitation not yet implemented.');
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    throw new Error('User is already a member of this organization');
  }

  // Create membership
  await supabase.from('team_members').insert({
    organization_id: organizationId,
    user_id: user.id,
    role,
    status: 'invited',
    invited_by: invitedBy,
  });

  // TODO: Send invitation email
}

/**
 * Accept organization invitation
 */
export async function acceptInvitation(
  membershipId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();

  // Update membership status
  const { error } = await supabase
    .from('team_members')
    .update({
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    .eq('id', membershipId)
    .eq('user_id', userId)
    .eq('status', 'invited');

  if (error) {
    throw new Error(`Failed to accept invitation: ${error.message}`);
  }

  // Invalidate cache
  await invalidateCache(`user:${userId}:organizations`);
}

/**
 * Remove member from organization
 */
export async function removeMember(
  organizationId: string,
  memberId: string,
  removedBy: string,
): Promise<void> {
  const supabase = await createClient();

  // Verify remover has permission
  const { data: remover } = await supabase
    .from('team_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', removedBy)
    .single();

  if (!remover || !['owner', 'admin'].includes(remover.role)) {
    throw new Error('Insufficient permissions');
  }

  // Cannot remove owner
  const { data: member } = await supabase
    .from('team_members')
    .select('role, user_id')
    .eq('id', memberId)
    .single();

  if (member?.role === 'owner') {
    throw new Error('Cannot remove organization owner');
  }

  // Remove member
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`);
  }

  // Invalidate cache
  if (member) {
    await invalidateCache(`user:${member.user_id}:organizations`);
  }
}

/**
 * Get organization statistics
 */
export async function getOrganizationStats(organizationId: string): Promise<{
  members: number;
  tasks: number;
  certificates: number;
  evidence: number;
}> {
  const cacheKey = `org:${organizationId}:stats`;

  return getCached(
    cacheKey,
    async () => {
      const supabase = await createClient();

      const [members, tasks, certificates, evidence] = await Promise.all([
        supabase
          .from('team_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status', 'active'),
        supabase
          .from('compliance_tasks')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('certifications')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('evidence_documents')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
      ]);

      return {
        members: members.count || 0,
        tasks: tasks.count || 0,
        certificates: certificates.count || 0,
        evidence: evidence.count || 0,
      };
    },
    600, // 10 minutes cache
  );
}
