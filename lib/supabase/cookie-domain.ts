export function getCookieDomain(requestHost?: string): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? process.env.COOKIE_DOMAIN;
  if (explicit) {
    if (!requestHost) return explicit;
    const clean = explicit.startsWith('.') ? explicit.slice(1) : explicit;
    if (requestHost === 'localhost' || requestHost.endsWith('.localhost')) {
      return undefined;
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(requestHost)) return undefined;
    return requestHost.endsWith(clean) ? explicit : undefined;
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!siteUrl) return undefined;

  try {
    const host = new URL(siteUrl).hostname;
    const normalized = host.startsWith('.') ? host.slice(1) : host;
    if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
      return undefined;
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(normalized)) return undefined;
    if (!requestHost) return host.startsWith('.') ? host : `.${host}`;
    if (
      requestHost === 'localhost' ||
      requestHost.endsWith('.localhost') ||
      /^\d+\.\d+\.\d+\.\d+$/.test(requestHost)
    ) {
      return undefined;
    }
    if (!requestHost.endsWith(normalized)) return undefined;
    return host.startsWith('.') ? host : `.${host}`;
  } catch {
    return undefined;
  }
}
