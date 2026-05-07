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
  const email = params.email.toLowerCase();
  const now = new Date().toISOString();

  // Revoke any existing pending invitation atomically. The previous
  // select-then-revoke-then-insert flow had a race where two concurrent
  // invites for the same address could both pass the existence check and
  // both insert; the partial unique index added in 20260622_001 backstops
  // the bad case but we revoke first to keep the UX clean.
  const { error: revokeError } = await supabase
    .from('team_invitations')
    .update({ status: 'revoked', revoked_at: now })
    .eq('organization_id', params.organizationId)
    .eq('email', email)
    .eq('status', 'pending');

  if (revokeError) {
    console.error('[createInvitation] revoke error:', revokeError);
    return { success: false, error: revokeError };
  }

  // Generate secure token after revoking so we never leak a token for an
  // invite the DB rejected.
  const token = randomBytes(32).toString('hex');

  const { data: invitation, error } = await supabase
    .from('team_invitations')
    .insert({
      organization_id: params.organizationId,
      email,
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
