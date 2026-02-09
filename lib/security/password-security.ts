/**
 * Password Security Module
 *
 * - HaveIBeenPwned integration for leaked password checking
 * - Strong password enforcement
 * - Password strength validation
 */

import crypto from 'crypto';

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

    const response = await fetch(`${HIBP_API_URL}/${prefix}`, {
      headers: {
        'User-Agent': 'FormaOS-Security-Check',
      },
    });

    if (!response.ok) {
      console.warn('[HIBP] API request failed:', response.status);
      return { breached: false, count: 0 }; // Fail-open for availability
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
    console.error('[HIBP] Error checking password:', error);
    return { breached: false, count: 0 }; // Fail-open for availability
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
