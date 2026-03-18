import type { Session, User } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { authLogger } from '@/lib/observability/structured-logger';

export type MembershipRow = {
  organization_id: string | null;
  role: string | null;
  created_at?: string | null;
};

type FrameworkRow = {
  framework_slug: string | null;
};

type CallbackSessionData = {
  user: User | null;
  session: Session | null;
};

type CallbackErrorLike = Error | { code?: string; message?: string } | null;

type AuthSessionClient = {
  auth: {
    exchangeCodeForSession: (
      code: string,
    ) => Promise<{ data: CallbackSessionData; error: CallbackErrorLike }>;
    setSession: (tokens: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{ data: CallbackSessionData; error: CallbackErrorLike }>;
  };
};

type CookieSnapshotItem = {
  name: string;
  value: string;
};

type OAuthExchangeParams = {
  appBase: string;
  code: string;
  cookieDomain: string | undefined;
  cookieNames: string[];
  cookieSnapshot: CookieSnapshotItem[];
  hasPkceVerifier: boolean;
  requestHost: string;
  serviceRoleKey: string;
  supabase: AuthSessionClient;
  supabaseAnonKey: string;
  supabaseUrl: string;
};

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

function getErrorCode(error: CallbackErrorLike): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  return 'code' in error && typeof error.code === 'string'
    ? error.code
    : undefined;
}

function getErrorMessage(error: CallbackErrorLike): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if ('message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return undefined;
}

function isTokenPayload(
  value: unknown,
): value is { access_token: string; refresh_token: string } {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.access_token === 'string' &&
    typeof record.refresh_token === 'string'
  );
}

export function normalizeFrameworks(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(
    new Set(
      input
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );
}

export function selectPrimaryMembership(
  memberships: MembershipRow[],
): MembershipRow | null {
  if (!memberships.length) return null;

  const weight = (role?: string | null) => {
    const normalized = (role ?? '').toLowerCase();
    if (normalized === 'owner') return 3;
    if (normalized === 'admin') return 2;
    return 1;
  };

  return (
    memberships
      .slice()
      .sort((a, b) => {
        const roleDelta = weight(b.role) - weight(a.role);
        if (roleDelta !== 0) return roleDelta;
        const aTime = a.created_at ? Date.parse(a.created_at) : 0;
        const bTime = b.created_at ? Date.parse(b.created_at) : 0;
        return bTime - aTime;
      })
      .at(0) ?? memberships[0]
  );
}

export async function resolveFrameworksForOrganization(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  organizationId: string,
  organizationFrameworks: unknown,
) {
  const directFrameworks = normalizeFrameworks(organizationFrameworks);
  if (directFrameworks.length > 0) {
    return {
      frameworks: directFrameworks,
      repairedFromOrgFrameworks: false,
    };
  }

  const { data: frameworkRows } = await admin
    .from('org_frameworks')
    .select('framework_slug')
    .eq('organization_id', organizationId)
    .limit(100);

  const fallbackFrameworks = normalizeFrameworks(
    (frameworkRows as FrameworkRow[] | null)?.map((row) => row.framework_slug),
  );

  if (!fallbackFrameworks.length) {
    return {
      frameworks: [],
      repairedFromOrgFrameworks: false,
    };
  }

  const { error: backfillError } = await admin
    .from('organizations')
    .update({ frameworks: fallbackFrameworks })
    .eq('id', organizationId);

  return {
    frameworks: fallbackFrameworks,
    repairedFromOrgFrameworks: !backfillError,
  };
}

export function isPkceExchangeError(error: CallbackErrorLike): boolean {
  const code = getErrorCode(error) ?? '';
  const message = getErrorMessage(error) ?? '';
  return (
    code.includes('pkce') ||
    message.includes('code verifier') ||
    message.includes('verifier')
  );
}

export async function exchangeOAuthCode({
  appBase,
  code,
  cookieDomain,
  cookieNames,
  cookieSnapshot,
  hasPkceVerifier,
  requestHost,
  serviceRoleKey,
  supabase,
  supabaseAnonKey,
  supabaseUrl,
}: OAuthExchangeParams): Promise<{
  exchangeData: CallbackSessionData | null;
  exchangeError: CallbackErrorLike;
}> {
  let exchangeData: CallbackSessionData | null = null;
  let exchangeError: CallbackErrorLike = null;

  try {
    const result = await supabase.auth.exchangeCodeForSession(code);
    exchangeData = result.data;
    exchangeError = result.error;
  } catch (error) {
    exchangeError = toError(error);
  }

  if (!exchangeError || !isPkceExchangeError(exchangeError)) {
    return { exchangeData, exchangeError };
  }

  authLogger.warn('pkce_verifier_missing_attempting_fallback', {
    errorCode: getErrorCode(exchangeError),
    errorMessage: getErrorMessage(exchangeError),
    hasPkceVerifier,
    cookieNames: cookieNames.filter((name) => name.startsWith('sb-')),
    allCookieNames: cookieNames,
    cookieDomain,
    requestHost,
  });

  const possibleVerifierCookies = cookieSnapshot.filter(
    (cookie) =>
      cookie.name.includes('code-verifier') ||
      cookie.name.includes('code_verifier'),
  );

  if (possibleVerifierCookies.length > 0) {
    for (const verifierCookie of possibleVerifierCookies) {
      try {
        authLogger.info('trying_pkce_verifier_cookie', {
          cookieName: verifierCookie.name,
        });
        const tokenRes = await fetch(
          `${supabaseUrl}/auth/v1/token?grant_type=pkce`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseAnonKey,
            },
            body: JSON.stringify({
              auth_code: code,
              code_verifier: verifierCookie.value,
            }),
          },
        );

        if (!tokenRes.ok) {
          continue;
        }

        const tokenData: unknown = await tokenRes.json();
        if (!isTokenPayload(tokenData)) {
          continue;
        }

        const { data: sessionData, error: setErr } =
          await supabase.auth.setSession({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
          });

        if (setErr || !sessionData?.user) {
          continue;
        }

        exchangeData = sessionData;
        exchangeError = null;
        authLogger.info('pkce_verifier_exchange_succeeded', {
          email: sessionData.user.email,
        });
        break;
      } catch (error) {
        authLogger.error(
          'pkce_verifier_exchange_failed',
          toError(error),
          { cookieName: verifierCookie.name },
        );
      }
    }
  }

  if (exchangeData?.user) {
    return { exchangeData, exchangeError };
  }

  try {
    const adminTokenRes = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=authorization_code`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          code,
          redirect_uri: `${appBase}/auth/callback`,
        }),
      },
    );

    if (!adminTokenRes.ok) {
      authLogger.error(
        'admin_token_exchange_failed',
        {
          code: 'AUTHORIZATION_CODE_EXCHANGE_FAILED',
          message: `Admin token exchange failed with status ${adminTokenRes.status}`,
        },
        {
          status: adminTokenRes.status,
          body: await adminTokenRes.text(),
        },
      );
      return { exchangeData, exchangeError };
    }

    const tokenData: unknown = await adminTokenRes.json();
    if (!isTokenPayload(tokenData)) {
      authLogger.error(
        'admin_token_exchange_invalid_payload',
        {
          code: 'INVALID_AUTH_TOKEN_PAYLOAD',
          message: 'Admin token exchange returned an invalid payload',
        },
      );
      return { exchangeData, exchangeError };
    }

    const { data: sessionData, error: setErr } = await supabase.auth.setSession(
      {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      },
    );

    if (!setErr && sessionData?.user) {
      exchangeData = sessionData;
      exchangeError = null;
      authLogger.info('admin_token_exchange_succeeded', {
        email: sessionData.user.email,
      });
    }
  } catch (error) {
    authLogger.error('oauth_server_side_fallback_failed', toError(error));
  }

  return { exchangeData, exchangeError };
}
