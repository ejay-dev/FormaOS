import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

export function createSupabaseAdminClient() {
  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();
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
    // Allow graceful fallback during Next.js build phase (prerender analysis)
    // and in test environments. In production runtime, throw immediately.
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (process.env.NODE_ENV !== 'test' && !isBuildPhase) {
      throw new Error(
        '[Supabase] Cannot create admin client — SUPABASE_SERVICE_ROLE_KEY is missing or invalid. ' +
          'Check environment configuration.',
      );
    }
    return createFallbackAdminClient();
  }

  try {
    return createClient(url, serviceKey, {
      auth: {
        persistSession: false,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        `[Supabase] Failed to initialize admin client: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return createFallbackAdminClient();
  }
}

function createFallbackAdminClient() {
  const error = { message: 'Supabase admin client is not configured.' };
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
  ) => {
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
    from: () => buildQuery(),
    rpc: async () => emptyResult,
  } as any;
}
