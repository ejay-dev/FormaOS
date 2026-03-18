type EnvValue = string | undefined | null;

const isPresent = (value: EnvValue) =>
  Boolean(value && value !== 'undefined' && value !== 'null');

let hasWarnedLegacyServiceRoleAlias = false;

function warnOnLegacyServiceRoleAliases(): void {
  if (hasWarnedLegacyServiceRoleAlias) return;
  if (typeof window !== 'undefined') return;

  const hasLegacyServiceKey = isPresent(process.env.SUPABASE_SERVICE_KEY);
  const hasLegacyServiceRole = isPresent(process.env.SUPABASE_SERVICE_ROLE);

  if (!hasLegacyServiceKey && !hasLegacyServiceRole) {
    return;
  }

  hasWarnedLegacyServiceRoleAlias = true;

  const aliases: string[] = [];
  if (hasLegacyServiceKey) aliases.push('SUPABASE_SERVICE_KEY');
  if (hasLegacyServiceRole) aliases.push('SUPABASE_SERVICE_ROLE');

  const hasCanonical = isPresent(process.env.SUPABASE_SERVICE_ROLE_KEY);

  console.warn(
    `[Supabase env] Legacy service-role alias detected (${aliases.join(
      ', ',
    )}). Prefer SUPABASE_SERVICE_ROLE_KEY${
      hasCanonical ? ' (canonical key is also set).' : '.'
    }`,
  );
}

warnOnLegacyServiceRoleAliases();

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
