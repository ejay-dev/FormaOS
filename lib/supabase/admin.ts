import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  const isPresent = (value?: string | null) =>
    Boolean(value && value !== "undefined" && value !== "null");
  const url = isPresent(process.env.NEXT_PUBLIC_SUPABASE_URL)
    ? process.env.NEXT_PUBLIC_SUPABASE_URL!
    : "";
  const serviceKey = isPresent(process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : "";
  const hasValidUrl = (() => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  })();

  if (!hasValidUrl || !serviceKey) {
    console.error("[Supabase] Missing service role configuration.");
    return createFallbackAdminClient();
  }

  try {
    return createClient(url, serviceKey, {
      auth: {
        persistSession: false,
      },
    });
  } catch (error) {
    console.error("[Supabase] Failed to initialize admin client:", error);
    return createFallbackAdminClient();
  }
}

function createFallbackAdminClient() {
  const error = { message: "Supabase admin client is not configured." };
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
      match: () => builder,
      in: () => builder,
      not: () => builder,
      gt: () => builder,
      gte: () => builder,
      lt: () => builder,
      lte: () => builder,
      order: () => builder,
      limit: () => builder,
      single: () => Promise.resolve(emptyResult),
      maybeSingle: () => Promise.resolve(emptyResult),
      then: (resolve: (value: typeof result) => void) => Promise.resolve(result).then(resolve),
      catch: (reject: (reason?: unknown) => void) => Promise.resolve(result).catch(reject),
      finally: (callback: () => void) => Promise.resolve(result).finally(callback),
    };
    return builder;
  };

  return {
    from: () => buildQuery(),
    rpc: async () => emptyResult,
  } as any;
}
