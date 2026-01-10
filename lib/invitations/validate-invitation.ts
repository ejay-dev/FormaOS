/**
 * FormaOS Security Module - Invitation Validation
 * 
 * Validates team invitations with expiration enforcement.
 * Prevents use of expired or invalid invitation tokens.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Invitation validation result
 */
export interface InvitationValidationResult {
  valid: boolean;
  error?: string;
  invitation?: {
    id: string;
    email: string;
    organization_id: string;
    role: string;
    expires_at: Date;
    status: string;
    organization_name?: string;
  };
}

/**
 * Default invitation expiration (7 days in milliseconds)
 */
export const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Validate an invitation token
 * Checks expiration, status, and retrieves organization details
 */
export async function validateInvitation(token: string): Promise<InvitationValidationResult> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Look up invitation by token
    const { data: invitation, error } = await supabase
      .from("team_invitations")
      .select(`
        id,
        email,
        organization_id,
        role,
        expires_at,
        status
      `)
      .eq("token", token)
      .maybeSingle();
    
    if (error) {
      console.error("[InvitationValidator] Lookup error:", error);
      return {
        valid: false,
        error: "Invalid invitation token",
      };
    }
    
    if (!invitation) {
      return {
        valid: false,
        error: "Invitation not found",
      };
    }
    
    // Check if invitation is already accepted
    if (invitation.status === "accepted") {
      return {
        valid: false,
        error: "This invitation has already been accepted",
      };
    }
    
    // Check if invitation is revoked
    if (invitation.status === "revoked") {
      return {
        valid: false,
        error: "This invitation has been revoked",
      };
    }
    
    // Check expiration
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      return {
        valid: false,
        error: "This invitation has expired",
      };
    }
    
    // Fetch organization name separately
    const { data: orgData } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", invitation.organization_id)
      .maybeSingle();
    
    const orgName = orgData?.name;
    
    return {
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        organization_id: invitation.organization_id,
        role: invitation.role,
        expires_at: expiresAt,
        status: invitation.status,
        organization_name: orgName,
      },
    };
  } catch (error) {
    console.error("[InvitationValidator] Unexpected error:", error);
    return {
      valid: false,
      error: "Failed to validate invitation",
    };
  }
}

/**
 * Mark invitation as accepted
 * Updates status and optionally cleans up old invitations
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // First validate the invitation
    const validation = await validateInvitation(token);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const invitation = validation.invitation!;
    
    // Update invitation status
    const { error: updateError } = await supabase
      .from("team_invitations")
      .update({
        status: "accepted",
        accepted_by: userId,
        accepted_at: new Date().toISOString(),
      })
      .eq("token", token);
    
    if (updateError) {
      console.error("[InvitationValidator] Accept error:", updateError);
      return { success: false, error: "Failed to accept invitation" };
    }
    
    return { success: true };
  } catch (error) {
    console.error("[InvitationValidator] Accept unexpected error:", error);
    return { success: false, error: "Internal error accepting invitation" };
  }
}

/**
 * Check invitation status without accepting
 */
export async function getInvitationStatus(
  token: string
): Promise<{
  status: "valid" | "expired" | "revoked" | "accepted" | "not_found";
  expires_at?: Date;
  days_remaining?: number;
}> {
  const result = await validateInvitation(token);
  
  if (!result.valid) {
    if (result.error?.includes("expired")) {
      return { status: "expired" };
    }
    if (result.error?.includes("revoked")) {
      return { status: "revoked" };
    }
    if (result.error?.includes("accepted")) {
      return { status: "accepted" };
    }
    return { status: "not_found" };
  }
  
  const invitation = result.invitation!;
  const now = new Date();
  const daysRemaining = Math.ceil(
    (invitation.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return {
    status: "valid",
    expires_at: invitation.expires_at,
    days_remaining: Math.max(0, daysRemaining),
  };
}

/**
 * Create a new invitation with expiration
 */
export async function createInvitationWithExpiry(
  organizationId: string,
  email: string,
  role: string,
  invitedBy: string,
  expiryMs: number = INVITATION_EXPIRY_MS
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { randomBytes } = await import("crypto");
    
    // Generate secure token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiryMs);
    
    // Check for existing pending invitation
    const { data: existing } = await supabase
      .from("team_invitations")
      .select("id, status")
      .eq("organization_id", organizationId)
      .eq("email", email.toLowerCase())
      .in("status", ["pending"])
      .maybeSingle();
    
    if (existing) {
      // Revoke existing invitation
      await supabase
        .from("team_invitations")
        .update({ status: "revoked", revoked_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
    
    // Create new invitation
    const { data: invitation, error } = await supabase
      .from("team_invitations")
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role,
        token,
        invited_by: invitedBy,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("[InvitationValidator] Create error:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, token };
  } catch (error) {
    console.error("[InvitationValidator] Create unexpected error:", error);
    return { success: false, error: "Failed to create invitation" };
  }
}

/**
 * Revoke an existing invitation
 */
export async function revokeInvitation(
  invitationId: string,
  organizationId: string,
  revokedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from("team_invitations")
      .update({
        status: "revoked",
        revoked_by: revokedBy,
        revoked_at: new Date().toISOString(),
      })
      .eq("id", invitationId)
      .eq("organization_id", organizationId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("[InvitationValidator] Revoke error:", error);
    return { success: false, error: "Failed to revoke invitation" };
  }
}

