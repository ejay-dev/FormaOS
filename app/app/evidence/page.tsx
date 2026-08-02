import { redirect } from 'next/navigation';

type EvidenceAliasProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * /app/evidence is an alias for the vault. Remediation links arrive here
 * carrying the control or task they came from, so the query string has to
 * survive the redirect or the user loses their place.
 */
export default async function EvidenceAliasPage({
  searchParams,
}: EvidenceAliasProps) {
  const params = (await searchParams) ?? {};
  const forwarded = new URLSearchParams();

  for (const key of ['control', 'task', 'q', 'status']) {
    const raw = params[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value) forwarded.set(key, value);
  }

  const query = forwarded.toString();
  redirect(query ? `/app/vault?${query}` : '/app/vault');
}
