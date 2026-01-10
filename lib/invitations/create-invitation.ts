import { createSupabaseServerClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export interface CreateInvitationParams {
  organizationId: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitedBy: string;
  expiresInMs?: number; // Optional custom expiration, defaults to 7 days
}

/**
 * Default invitation expiration: 7 days in milliseconds
 */
export const DEFAULT_INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export async function createInvitation(params: CreateInvitationParams) {
  const supabase = await createSupabaseServerClient();
  
  const expiryMs = params.expiresInMs ?? DEFAULT_INVITATION_EXPIRY_MS;
  const expiresAt = new Date(Date.now() + expiryMs).toISOString();

  // Generate secure token
  const token = randomBytes(32).toString('hex');

  // Check for existing pending invitation and revoke it
  const { data: existing } = await supabase
    .from('team_invitations')
    .select('id')
    .eq('organization_id', params.organizationId)
    .eq('email', params.email.toLowerCase())
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) {
    // Revoke existing invitation
    await supabase
      .from('team_invitations')
      .update({ 
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq('id', existing.id);
  }

  // Create invitation with expiration
  const { data: invitation, error } = await supabase
    .from('team_invitations')
    .insert({
      organization_id: params.organizationId,
      email: params.email.toLowerCase(),
      role: params.role,
      token,
      invited_by: params.invitedBy,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('*, organizations(name)')
    .single();

  if (error) {
    console.error('[createInvitation] Error:', error);
    return { success: false, error };
  }

  return { 
    success: true, 
    data: invitation,
    expiresAt,
  };
}
