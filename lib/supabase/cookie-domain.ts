export function getCookieDomain(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? process.env.COOKIE_DOMAIN;
  if (explicit) return explicit;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!siteUrl) return undefined;

  try {
    const host = new URL(siteUrl).hostname;
    if (host === "localhost" || host.endsWith(".localhost")) return undefined;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return undefined;
    return host.startsWith(".") ? host : `.${host}`;
  } catch {
    return undefined;
  }
}
