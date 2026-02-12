/**
 * Centralized founder detection utility
 * This ensures consistent founder detection across the application
 */

export function isFounder(email: string | undefined, userId: string): boolean {
  // Return false immediately if no user info
  if (!email && !userId) {
    return false;
  }

  const parseEnvList = (value?: string | null): Set<string> => {
    const raw = value ?? '';
    if (!raw || raw.trim() === '') {
      return new Set();
    }

    return new Set(
      raw
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    );
  };

  const founderEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  // Founder emails configured exclusively via FOUNDER_EMAILS env variable
  // No hardcoded fallback emails — all founder access managed through environment config
  const founderIds = parseEnvList(process.env.FOUNDER_USER_IDS);

  const normalizedEmail = (email ?? '').trim().toLowerCase();
  const normalizedId = (userId ?? '').trim().toLowerCase();

  // Check both email and ID
  const emailMatch = normalizedEmail
    ? founderEmails.has(normalizedEmail)
    : false;
  const idMatch = normalizedId ? founderIds.has(normalizedId) : false;

  // Log for debugging - always log founder checks on server for troubleshooting
  // Mask email for privacy but show enough to verify
  const maskedEmail = normalizedEmail
    ? normalizedEmail.substring(0, 3) + '***@' + normalizedEmail.split('@')[1]
    : 'none';

  // Only log when checking protected routes (reduce noise)
  if (typeof window === 'undefined') {
    console.log('[isFounder] Check:', {
      maskedEmail,
      hasId: !!normalizedId,
      founderEmailsConfigured: founderEmails.size,
      founderIdsConfigured: founderIds.size,
      emailMatch,
      idMatch,
      result: emailMatch || idMatch,
    });
  }

  return emailMatch || idMatch;
}
