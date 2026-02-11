type EnvValue = string | undefined | null;

const isPresent = (value: EnvValue) =>
  Boolean(value && value !== 'undefined' && value !== 'null');

export function getSupabaseUrl(): string {
  const url =
    (isPresent(process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : undefined) ??
    (isPresent(process.env.SUPABASE_URL) ? process.env.SUPABASE_URL : undefined);
  return url ?? '';
}

export function getSupabaseAnonKey(): string {
  const key =
    (isPresent(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : undefined) ??
    (isPresent(process.env.SUPABASE_ANON_KEY)
      ? process.env.SUPABASE_ANON_KEY
      : undefined);
  return key ?? '';
}

export function getSupabaseServiceRoleKey(): string {
  const key =
    (isPresent(process.env.SUPABASE_SERVICE_ROLE_KEY)
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : undefined) ??
    (isPresent(process.env.SUPABASE_SERVICE_KEY)
      ? process.env.SUPABASE_SERVICE_KEY
      : undefined) ??
    (isPresent(process.env.SUPABASE_SERVICE_ROLE)
      ? process.env.SUPABASE_SERVICE_ROLE
      : undefined);
  return key ?? '';
}

