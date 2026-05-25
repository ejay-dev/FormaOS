/**
 * Password Security Module
 *
 * - HaveIBeenPwned integration for leaked password checking
 * - Strong password enforcement
 * - Password strength validation
 */

import crypto from 'crypto';
import { consoleShim } from '@/lib/monitoring/console-shim';

const HIBP_API_URL = 'https://api.pwnedpasswords.com/range';

/**
 * Check if password has been exposed in data breaches
 * Uses k-anonymity - only first 5 chars of hash are sent to API
 */
export async function checkPasswordBreached(password: string): Promise<{
  breached: boolean;
  count: number;
}> {
  try {
    const sha1 = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    // v4-026: previously a single unbounded fetch — an attacker
    // could DoS HIBP and signup would accept breached passwords
    // (fail-open). Now: 3-second timeout, single retry, and a
    // HIBP_FAIL_CLOSED env so security-sensitive deployments can
    // refuse signups when HIBP is down. Default stays fail-open
    // for availability but emits a noisy warning + tracks the
    // bypass count so ops can correlate spikes.
    // v4-031: default fail-closed in production so a HIBP outage / DoS
    // can't be used to land breached passwords into prod accounts.
    // Dev/test environments stay fail-open for offline development.
    // Operators that need fail-open in prod set HIBP_FAIL_CLOSED=false
    // explicitly.
    const failClosedEnv = process.env.HIBP_FAIL_CLOSED;
    const failClosed =
      failClosedEnv === undefined
        ? process.env.NODE_ENV === 'production'
        : failClosedEnv === 'true';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    let response: Response | null = null;
    try {
      response = await fetch(`${HIBP_API_URL}/${prefix}`, {
        headers: { 'User-Agent': 'FormaOS-Security-Check' },
        signal: controller.signal,
      });
    } catch {
      // Single retry on network error / abort.
      try {
        const retry = new AbortController();
        const retryTimeout = setTimeout(() => retry.abort(), 3000);
        response = await fetch(`${HIBP_API_URL}/${prefix}`, {
          headers: { 'User-Agent': 'FormaOS-Security-Check' },
          signal: retry.signal,
        });
        clearTimeout(retryTimeout);
      } catch {
        response = null;
      }
    } finally {
      clearTimeout(timeout);
    }

    if (!response?.ok) {
      const status = response?.status ?? 0;
      consoleShim.warn(
        `[HIBP] API request failed (status=${status}, failClosed=${failClosed})`,
      );
      if (failClosed) {
        // Treat as a probable breach so the caller rejects the
        // password. count=-1 signals "unknown, refused".
        return { breached: true, count: -1 };
      }
      return { breached: false, count: 0 };
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(':');
      if (hashSuffix.trim() === suffix) {
        return { breached: true, count: parseInt(countStr.trim(), 10) };
      }
    }

    return { breached: false, count: 0 };
  } catch (error) {
    consoleShim.error('[HIBP] Error checking password:', error);
    if (process.env.HIBP_FAIL_CLOSED === 'true') {
      return { breached: true, count: -1 };
    }
    return { breached: false, count: 0 };
  }
}

/**
 * Password strength requirements
 */
export interface PasswordStrengthResult {
  valid: boolean;
  score: number; // 0-4
  errors: string[];
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(
  password: string,
): PasswordStrengthResult {
  const errors: string[] = [];
  let score = 0;

  // Minimum length
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  } else {
    score += 1;
    if (password.length >= 16) score += 1;
  }

  // Uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 0.5;
  }

  // Lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 0.5;
  }

  // Numbers
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 0.5;
  }

  // Special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 0.5;
  }

  // Common password patterns
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
    /^welcome/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains a common pattern');
      score = Math.max(0, score - 1);
      break;
    }
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters');
    score = Math.max(0, score - 0.5);
  }

  return {
    valid: errors.length === 0,
    score: Math.min(4, Math.floor(score)),
    errors,
  };
}

/**
 * Full password validation including breach check
 */
export async function validatePassword(password: string): Promise<{
  valid: boolean;
  errors: string[];
  breached: boolean;
  breachCount: number;
}> {
  const strength = validatePasswordStrength(password);
  const breach = await checkPasswordBreached(password);

  const errors = [...strength.errors];
  if (breach.breached) {
    errors.push(
      `This password has been exposed in ${breach.count.toLocaleString()} data breaches. Choose a different password.`,
    );
  }

  return {
    valid: strength.valid && !breach.breached,
    errors,
    breached: breach.breached,
    breachCount: breach.count,
  };
}
