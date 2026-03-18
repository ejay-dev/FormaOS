const DEFAULT_APP_BASE = 'https://app.formaos.com.au';

const EMAIL_OTP_TYPES = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
] as const;

export type EmailOtpType = (typeof EMAIL_OTP_TYPES)[number];

type GenerateLinkProperties = {
  action_link?: string | null;
  hashed_token?: string | null;
  redirect_to?: string | null;
  verification_type?: string | null;
};

type BuildHostedAuthConfirmLinkInput = {
  appBase?: string | null;
  properties?: GenerateLinkProperties | null;
  fallbackType?: EmailOtpType | null;
  fallbackRedirectTo?: string | null;
};

type ParsedSupabaseActionLink = {
  tokenHash: string | null;
  type: EmailOtpType | null;
  redirectTo: string | null;
};

export function normalizeAppBase(rawValue?: string | null): string {
  const candidate = (rawValue || DEFAULT_APP_BASE).trim();
  try {
    return new URL(candidate).origin.replace(/\/$/, '');
  } catch {
    return DEFAULT_APP_BASE;
  }
}

export function coerceEmailOtpType(value?: string | null): EmailOtpType | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return (EMAIL_OTP_TYPES as readonly string[]).includes(normalized)
    ? (normalized as EmailOtpType)
    : null;
}

export function parseSupabaseActionLink(
  rawValue?: string | null,
): ParsedSupabaseActionLink | null {
  if (!rawValue) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawValue);
  } catch {
    return null;
  }

  const tokenHash =
    parsed.searchParams.get('token_hash') || parsed.searchParams.get('token');
  const type = coerceEmailOtpType(parsed.searchParams.get('type'));
  const redirectTo = parsed.searchParams.get('redirect_to');

  return {
    tokenHash: tokenHash?.trim() || null,
    type,
    redirectTo: redirectTo?.trim() || null,
  };
}

export function buildHostedAuthConfirmLink(
  input: BuildHostedAuthConfirmLinkInput,
): string | null {
  const appBase = normalizeAppBase(input.appBase);
  const properties = input.properties ?? undefined;
  const parsedActionLink = parseSupabaseActionLink(properties?.action_link);

  const tokenHash =
    properties?.hashed_token?.trim() || parsedActionLink?.tokenHash || null;
  const type =
    coerceEmailOtpType(properties?.verification_type) ||
    parsedActionLink?.type ||
    input.fallbackType ||
    null;
  const redirectTo =
    properties?.redirect_to?.trim() ||
    parsedActionLink?.redirectTo ||
    input.fallbackRedirectTo?.trim() ||
    null;

  if (tokenHash && type) {
    const url = new URL('/auth/confirm', appBase);
    url.searchParams.set('token_hash', tokenHash);
    url.searchParams.set('type', type);
    if (redirectTo) {
      url.searchParams.set('redirect_to', redirectTo);
    }
    return url.toString();
  }

  if (properties?.action_link) {
    const url = new URL('/auth/confirm', appBase);
    url.searchParams.set('confirmation_url', properties.action_link);
    if (input.fallbackType) {
      url.searchParams.set('type', input.fallbackType);
    }
    if (input.fallbackRedirectTo) {
      url.searchParams.set('redirect_to', input.fallbackRedirectTo);
    }
    return url.toString();
  }

  return null;
}
