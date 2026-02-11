import { createSupabaseServerClient } from '@/lib/supabase/server';

function parseEnvList(value?: string | null) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireFounderAccess() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error('[requireFounderAccess] ❌ No user found');
    throw new Error('Unauthorized');
  }

  const allowedEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  allowedEmails.add('ejazhussaini313@gmail.com');
  const allowedIds = parseEnvList(process.env.FOUNDER_USER_IDS);

  if (!allowedEmails.size && !allowedIds.size) {
    console.error('[requireFounderAccess] Founder env vars not configured');
    throw new Error('Founder access not configured');
  }

  const email = user.email?.trim().toLowerCase() ?? '';
  const hasEmailAccess = email ? allowedEmails.has(email) : false;
  const hasIdAccess = allowedIds.has(user.id.toLowerCase());

  if (!hasEmailAccess && !hasIdAccess) {
    const maskedEmail = email
      ? `${email.slice(0, 3)}***@${email.split('@')[1] ?? 'unknown'}`
      : 'none';
    console.warn('[requireFounderAccess] Founder check failed', {
      maskedEmail,
      hasUserId: Boolean(user.id),
      route: 'admin',
      reason: 'email-or-id-not-allowed',
    });
    throw new Error('Forbidden');
  }

  return { user };
}
