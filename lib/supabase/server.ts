import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getCookieDomain } from "@/lib/supabase/cookie-domain";

// REVERTED: Kept your original function name
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const requestHost = headerStore.get("host") ?? undefined;
  const forwardedProto = headerStore.get("x-forwarded-proto") ?? "";
  // In development, avoid forcing a cookie domain so localhost flows keep working.
  const cookieDomain =
    process.env.NODE_ENV === "development"
      ? undefined
      : getCookieDomain(requestHost);
  const isHttps = (() => {
    if (forwardedProto) return forwardedProto === "https";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return appUrl.startsWith("https://") || siteUrl.startsWith("https://");
  })();

  const isPresent = (value?: string | null) =>
    Boolean(value && value !== "undefined" && value !== "null");
  const supabaseUrl = isPresent(process.env.NEXT_PUBLIC_SUPABASE_URL)
    ? process.env.NEXT_PUBLIC_SUPABASE_URL!
    : "";
  const supabaseKey = isPresent(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    : "";
  const hasValidUrl = (() => {
    if (!supabaseUrl) return false;
    try {
      new URL(supabaseUrl);
      return true;
    } catch {
      return false;
    }
  })();

  if (!hasValidUrl || !supabaseKey) {
    console.error("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    return createFallbackSupabaseClient();
  }

  try {
    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const normalized = { ...options };
              if (!normalized.sameSite) {
                normalized.sameSite = "lax";
              }
              if (!normalized.path) {
                normalized.path = "/";
              }
              if (isHttps) {
                normalized.secure = true;
              }
              const cookieOptions = cookieDomain ? { ...normalized, domain: cookieDomain } : normalized;
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // Safe to ignore in Server Components
          }
        },
      },
    });
  } catch (error) {
    console.error("[Supabase] Failed to initialize server client:", error);
    return createFallbackSupabaseClient();
  }
}

function createFallbackSupabaseClient() {
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
      getSession: async () => ({ data: { session: null }, error }),
      refreshSession: async () => ({ data: { session: null }, error }),
      exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error }),
      updateUser: async () => ({ data: null, error }),
      signOut: async () => ({ error }),
    },
    from: () => buildQuery(),
    rpc: async () => emptyResult,
    storage: {
      from: () => ({
        upload: async () => emptyResult,
        remove: async () => emptyResult,
        createSignedUrl: async () => emptyResult,
        getPublicUrl: () => ({ data: { publicUrl: "" }, error }),
        download: async () => emptyResult,
      }),
    },
  } as any;
}
