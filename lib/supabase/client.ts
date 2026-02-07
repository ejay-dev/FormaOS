import { createBrowserClient } from "@supabase/ssr";
import { getCookieDomain } from "@/lib/supabase/cookie-domain";

type SupabaseClient = ReturnType<typeof createBrowserClient>;

let cachedClient: SupabaseClient | null = null;

function resolveBrowserCookieOptions() {
  if (typeof window === "undefined") return undefined;
  const domain = getCookieDomain(window.location.hostname);
  const secure = window.location.protocol === "https:";
  const options: {
    domain?: string;
    path: string;
    sameSite: "lax";
    secure?: boolean;
  } = {
    path: "/",
    sameSite: "lax",
  };
  if (domain) options.domain = domain;
  if (secure) options.secure = true;
  return options;
}

function getSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}

function createFallbackClient() {
  const error = { message: "Supabase is not configured." };
  const emptyResult: { data: unknown; error: { message: string } } = { data: null, error };
  const emptyListResult: { data: unknown[]; error: { message: string } } = { data: [], error };

  const buildQuery = (result: { data: unknown; error: { message: string } } = emptyListResult) => {
    const builder: any = {
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
      then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
      catch: (reject: (reason?: unknown) => void) => Promise.resolve(result).catch(reject),
      finally: (callback: () => void) => Promise.resolve(result).finally(callback),
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
        getPublicUrl: () => ({ data: { publicUrl: "" }, error }),
        download: async () => emptyResult,
      }),
    },
  } as SupabaseClient;
}

export function createSupabaseClient() {
  if (cachedClient) return cachedClient;
  const isPresent = (value?: string | null) =>
    Boolean(value && value !== "undefined" && value !== "null");
  const url = isPresent(process.env.NEXT_PUBLIC_SUPABASE_URL)
    ? process.env.NEXT_PUBLIC_SUPABASE_URL!
    : "";
  const keyRaw = getSupabaseKey();
  const key = isPresent(keyRaw) ? keyRaw : "";
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
    console.error("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or public key.");
    cachedClient = createFallbackClient();
    return cachedClient;
  }

  try {
    cachedClient = createBrowserClient(url, key, {
      cookieOptions: resolveBrowserCookieOptions(),
    });
    return cachedClient;
  } catch (error) {
    console.error("[Supabase] Failed to initialize browser client:", error);
    cachedClient = createFallbackClient();
    return cachedClient;
  }
}
