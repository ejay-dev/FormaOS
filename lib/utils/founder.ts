/**
 * Centralized founder detection utility
 * This ensures consistent founder detection across the application
 */

export function isFounder(email: string | undefined, userId: string): boolean {
  // Return false immediately if no user info
  if (!email && !userId) {
    console.log('[isFounder] ❌ No email or userId provided');
    return false;
  }

  const parseEnvList = (value?: string | null): Set<string> => {
    const raw = value ?? '';
    if (!raw || raw.trim() === '') {
      console.log('[isFounder] ⚠️ Empty environment variable');
      return new Set();
    }

    const parsed = new Set(
      raw
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    );

    console.log('[isFounder] 📋 Parsed env list size:', parsed.size);
    return parsed;
  };

  const founderEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  const founderIds = parseEnvList(process.env.FOUNDER_USER_IDS);

  const normalizedEmail = (email ?? '').trim().toLowerCase();
  const normalizedId = (userId ?? '').trim().toLowerCase();

  // Log for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[isFounder] Debug info:', {
      normalizedEmail,
      normalizedId: normalizedId
        ? normalizedId.substring(0, 8) + '...'
        : 'none',
      founderEmailsSize: founderEmails.size,
      founderIdsSize: founderIds.size,
      emailMatch: founderEmails.has(normalizedEmail),
      idMatch: founderIds.has(normalizedId),
      FOUNDER_EMAILS_RAW: process.env.FOUNDER_EMAILS,
      FOUNDER_USER_IDS_RAW: process.env.FOUNDER_USER_IDS,
    });
  }

  // Check both email and ID
  const emailMatch = normalizedEmail
    ? founderEmails.has(normalizedEmail)
    : false;
  const idMatch = normalizedId ? founderIds.has(normalizedId) : false;

  return emailMatch || idMatch;
}
