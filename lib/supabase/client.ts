import { createBrowserClient } from '@supabase/ssr';
import { getCookieDomain } from '@/lib/supabase/cookie-domain';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

type SupabaseClient = ReturnType<typeof createBrowserClient>;

let cachedClient: SupabaseClient | null = null;

function resolveBrowserCookieOptions() {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  const domain = getCookieDomain(hostname);

  // Force Secure for every host that isn't local. Without this, Safari ITP
  // refuses to send the PKCE verifier cookie back across the Google OAuth
  // round trip, which is a dominant cause of the "first attempt fails,
  // second works" symptom. We can't trust window.location.protocol because
  // the module-level cachedClient may be initialised in an SSR or
  // pre-redirect context where the protocol is briefly http: even on
  // production. Localhost development still works because we explicitly opt
  // out below.
  const isLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost');

  const options: {
    domain?: string;
    path: string;
    sameSite: 'lax' | 'none';
    secure?: boolean;
  } = {
    path: '/',
    sameSite: 'lax',
  };
  if (domain) options.domain = domain;
  if (!isLocal) options.secure = true;
  return options;
}

function getSupabaseKey() {
  // Use ONLY the anon key — the publishable key (sb_publishable_*) is NOT a
  // valid Supabase JWT and will silently break all client-side auth including
  // signInWithOAuth if it takes priority.
  return getSupabaseAnonKey();
}

function createFallbackClient() {
  const error = { message: 'Supabase is not configured.' };
  const emptyResult: { data: unknown; error: { message: string } } = {
    data: null,
    error,
  };
  const emptyListResult: { data: unknown[]; error: { message: string } } = {
    data: [],
    error,
  };

  const buildQuery = (
    result: { data: unknown; error: { message: string } } = emptyListResult,
  ): Record<string, unknown> => {
    const builder: Record<string, unknown> = {
      select: () => buildQuery(emptyListResult),
      insert: () => buildQuery(emptyResult),
      update: () => buildQuery(emptyResult),
      delete: () => buildQuery(emptyResult),
      upsert: () => buildQuery(emptyResult),
      eq: () => builder,
      ilike: () => builder,
      limit: () => builder,
      order: () => builder,
      match: () => builder,
      in: () => builder,
      not: () => builder,
      gt: () => builder,
      gte: () => builder,
      lt: () => builder,
      lte: () => builder,
      single: () => Promise.resolve(emptyResult),
      maybeSingle: () => Promise.resolve(emptyResult),
      then: (resolve: (value: typeof result) => void) =>
        Promise.resolve(result).then(resolve),
      catch: (reject: (reason?: unknown) => void) =>
        Promise.resolve(result).catch(reject),
      finally: (callback: () => void) =>
        Promise.resolve(result).finally(callback),
    };
    return builder;
  };

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error }),
      signInWithOAuth: async () => ({ data: null, error }),
      signOut: async () => ({ error }),
    },
    from: () => buildQuery(),
    storage: {
      from: () => ({
        upload: async () => emptyResult,
        remove: async () => emptyResult,
        createSignedUrl: async () => emptyResult,
        getPublicUrl: () => ({ data: { publicUrl: '' }, error }),
        download: async () => emptyResult,
      }),
    },
  } as SupabaseClient;
}

export function createSupabaseClient() {
  if (cachedClient) return cachedClient;
  const isPresent = (value?: string | null) =>
    Boolean(value && value !== 'undefined' && value !== 'null');
  const url = getSupabaseUrl();
  const keyRaw = getSupabaseKey();
  const key = isPresent(keyRaw) ? keyRaw : '';
  const hasValidUrl = (() => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  })();

  if (!hasValidUrl || !key) {
    // Browser bundle — consoleShim pulls in pino + 'server-only' and breaks
    // the build. Raw console.* on the client path is intentional.
     
    console.error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or public key.');
    cachedClient = createFallbackClient();
    return cachedClient;
  }

  try {
    cachedClient = createBrowserClient(url, key, {
      cookieOptions: resolveBrowserCookieOptions(),
    });
    return cachedClient;
  } catch (error) {
     
    console.error('[Supabase] Failed to initialize browser client:', error);
    cachedClient = createFallbackClient();
    return cachedClient;
  }
}
