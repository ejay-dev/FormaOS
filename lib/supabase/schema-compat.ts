export interface SupabaseErrorLike {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}

function normalize(value?: string | null) {
  return value?.trim() ?? '';
}

export function getSupabaseErrorMessage(error?: SupabaseErrorLike | null) {
  return normalize(error?.message);
}

export function isMissingSupabaseTableError(
  error?: SupabaseErrorLike | null,
  table?: string,
) {
  const message = getSupabaseErrorMessage(error);

  if (error?.code === 'PGRST205' || error?.code === '42P01') {
    return !table || message.includes(table) || message.length === 0;
  }

  if (!message) {
    return false;
  }

  if (table) {
    return (
      message.includes(`table 'public.${table}'`) ||
      message.includes(`relation "${table}" does not exist`) ||
      message.includes(`relation public.${table} does not exist`)
    );
  }

  return (
    message.includes('Could not find the table') ||
    message.includes('relation "') && message.includes('" does not exist')
  );
}

export function extractMissingSupabaseColumn(
  error?: SupabaseErrorLike | null,
  table?: string,
) {
  const message = getSupabaseErrorMessage(error);
  if (!message) {
    return null;
  }

  if (table) {
    const postgrestMatch = message.match(
      new RegExp(`Could not find the '([^']+)' column of '([^']+\\.)?${table}'`),
    );
    if (postgrestMatch?.[1]) {
      return postgrestMatch[1];
    }

    const postgresQualifiedMatch = message.match(
      new RegExp(`column ${table}\\.([^ ]+) does not exist`),
    );
    if (postgresQualifiedMatch?.[1]) {
      return postgresQualifiedMatch[1].replace(/"/g, '');
    }
  }

  const genericMatch = message.match(/column "?([^"]+)"? does not exist/i);
  return genericMatch?.[1] ?? null;
}

export function isMissingSupabaseColumnError(
  error?: SupabaseErrorLike | null,
  table?: string,
  column?: string,
) {
  const missingColumn = extractMissingSupabaseColumn(error, table);
  if (!missingColumn) {
    return false;
  }

  return !column || missingColumn === column;
}
