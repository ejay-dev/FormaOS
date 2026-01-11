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
  // Dev fallback: try to read .env.local if the process env var isn't set (helps local dev)
  if (!serviceKey) {
    try {
      const fs = require("fs");
      const path = require("path");
      const envPath = path.resolve(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        const m = content.match(/^SUPABASE_SERVICE_ROLE_KEY=(.+)$/m);
        if (m && m[1]) {
          // strip optional quotes
          const extracted = m[1].trim().replace(/^"|"$/g, "");
          // assign to serviceKey variable for subsequent checks
          // (not assigning to process.env to avoid side-effects)
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          (global as any).__DEV_SUPABASE_SERVICE_ROLE_KEY = extracted;
        }
      }
    } catch (e) {
      // ignore
    }
  }
  const hasValidUrl = (() => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  })();

  // Debug: log presence of env values to help diagnose missing-service-role issues
  try {
    const present = Boolean(serviceKey) || Boolean((global as any).__DEV_SUPABASE_SERVICE_ROLE_KEY);
    console.log(`[Supabase DEBUG] hasValidUrl=${hasValidUrl}, serviceKeyPresent=${present}`);
  } catch (e) {}

  const finalServiceKey = serviceKey || (global as any).__DEV_SUPABASE_SERVICE_ROLE_KEY || "";

  if (!hasValidUrl || !finalServiceKey) {
    console.error("[Supabase] Missing service role configuration.");
    return createFallbackAdminClient();
  }

  try {
    return createClient(url, finalServiceKey, {
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
