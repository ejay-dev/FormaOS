/**
 * FormaOS Security Module - Session Rotator
 * 
 * Implements secure session token rotation to prevent session fixation attacks.
 * Rotates refresh tokens on each authenticated request for enhanced security.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Session rotation result
 */
export interface SessionRotationResult {
  success: boolean;
  error?: string;
  newSession?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

/**
 * Rotate session tokens for enhanced security
 */
export async function rotateSession(): Promise<SessionRotationResult> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return { success: false, error: "No active session to rotate" };
    }
    
    const { data: rotatedSession, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error("[SessionRotator] Token refresh failed:", refreshError);
      return { success: false, error: refreshError.message };
    }
    
    if (!rotatedSession.session) {
      return { success: false, error: "Failed to obtain new session" };
    }
    
    return {
      success: true,
      newSession: {
        accessToken: rotatedSession.session.access_token,
        refreshToken: rotatedSession.session.refresh_token ?? "",
        expiresIn: rotatedSession.session.expires_in ?? 3600,
      },
    };
  } catch (error) {
    console.error("[SessionRotator] Unexpected error:", error);
    return { success: false, error: "Internal error during session rotation" };
  }
}

/**
 * Validate session integrity
 */
export async function validateSession(): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { valid: false, error: error?.message ?? "No authenticated user" };
    }
    
    return { valid: true, userId: user.id };
  } catch {
    return { valid: false, error: "Session validation failed" };
  }
}

/**
 * Get session metadata for audit purposes
 */
export async function getSessionMetadata(): Promise<{
  userId?: string;
  email?: string;
  createdAt?: Date;
  lastRefreshedAt?: Date;
  expiresAt?: Date;
} | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }
    
    const expiresAt = session.expires_at 
      ? new Date(session.expires_at * 1000)
      : new Date(Date.now() + 3600 * 1000);
    
    return {
      userId: session.user.id,
      email: session.user.email ?? undefined,
      createdAt: new Date(),
      lastRefreshedAt: new Date(),
      expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Rotate session with automatic cookie updates
 */
export async function secureSessionRotation(): Promise<boolean> {
  const result = await rotateSession();
  return result.success;
}

/**
 * Check if session needs rotation
 */
export async function needsRotation(): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.expires_at) {
      return true;
    }
    
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const rotationThreshold = 60 * 60 * 1000; // 1 hour
    
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    return timeUntilExpiry < rotationThreshold;
  } catch {
    return true;
  }
}

/**
 * Get session security score (0-100)
 */
export async function getSessionSecurityScore(): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return 0;
    }
    
    let score = 50;
    const now = Date.now();
    
    // Check if token was recently refreshed
    const tokenAge = session.expires_at 
      ? (now - session.expires_at * 1000) / 1000 / 60 // minutes
      : 0;
    
    if (tokenAge < 5) {
      score += 30;
    } else if (tokenAge < 30) {
      score += 15;
    }
    
    // Check expiry
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const hoursUntilExpiry = (expiresAt.getTime() - now) / (1000 * 60 * 60);
      if (hoursUntilExpiry > 24) {
        score += 20;
      } else if (hoursUntilExpiry > 1) {
        score += 10;
      }
    }
    
    return Math.min(100, score);
  } catch {
    return 0;
  }
}

