import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  coerceEmailOtpType,
  normalizeAppBase,
  parseSupabaseActionLink,
} from '@/lib/auth/hosted-auth-link';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_SUCCESS_PATH = '/onboarding';
const ERROR_PATH = '/auth/confirm/error';

function buildErrorRedirect(requestUrl: URL, message: string): NextResponse {
  const target = new URL(ERROR_PATH, requestUrl.origin);
  target.searchParams.set('message', message);
  return NextResponse.redirect(target.toString());
}

function resolvePostVerifyDestination(
  requestUrl: URL,
  redirectToRaw: string | null,
): string {
  const fallback = new URL(DEFAULT_SUCCESS_PATH, requestUrl.origin).toString();

  if (!redirectToRaw) return fallback;
  const trimmed = redirectToRaw.trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('/')) {
    return new URL(trimmed, requestUrl.origin).toString();
  }

  try {
    const parsed = new URL(trimmed);
    const configuredAppBase = normalizeAppBase(
      process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin,
    );
    const allowedOrigins = new Set([requestUrl.origin, configuredAppBase]);
    if (allowedOrigins.has(parsed.origin)) {
      return parsed.toString();
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const params = requestUrl.searchParams;

  let tokenHash = params.get('token_hash') || params.get('token');
  let type = coerceEmailOtpType(params.get('type'));
  let redirectTo = params.get('redirect_to');

  const wrappedConfirmationUrl = params.get('confirmation_url');
  if ((!tokenHash || !type) && wrappedConfirmationUrl) {
    const parsed = parseSupabaseActionLink(wrappedConfirmationUrl);
    if (!tokenHash && parsed?.tokenHash) tokenHash = parsed.tokenHash;
    if (!type && parsed?.type) type = parsed.type;
    if (!redirectTo && parsed?.redirectTo) redirectTo = parsed.redirectTo;
  }

  if (!tokenHash || !type) {
    return buildErrorRedirect(
      requestUrl,
      'This confirmation link is invalid or incomplete. Please request a fresh email.',
    );
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  if (!supabaseUrl || !supabaseAnonKey) {
    return buildErrorRedirect(
      requestUrl,
      'Authentication is temporarily unavailable. Please try again shortly.',
    );
  }

  const cookieStore = await cookies();
  let cookieSnapshot = cookieStore.getAll();
  const cookieDomain = getCookieDomain(requestUrl.hostname);
  const isHttps = requestUrl.protocol === 'https:';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieSnapshot,
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          const normalizedOptions = {
            ...options,
            sameSite: options?.sameSite ?? (isHttps ? 'none' : 'lax'),
            path: options?.path ?? '/',
            secure: isHttps ? true : options?.secure,
            ...(cookieDomain && isHttps ? { domain: cookieDomain } : {}),
          };
          cookieStore.set(name, value, normalizedOptions);
          cookieSnapshot = [
            ...cookieSnapshot.filter((cookie) => cookie.name !== name),
            { name, value },
          ];
        });
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    console.warn('[auth/confirm] verifyOtp failed:', {
      type,
      message: error.message,
    });
    return buildErrorRedirect(
      requestUrl,
      'This confirmation link has expired or has already been used. Request a new one and try again.',
    );
  }

  return NextResponse.redirect(
    resolvePostVerifyDestination(requestUrl, redirectTo),
  );
}
