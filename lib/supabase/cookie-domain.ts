function isLocalhost(host: string) {
  return host === 'localhost' || host.endsWith('.localhost');
}

function isIpAddress(host: string) {
  return /^\d+\.\d+\.\d+\.\d+$/.test(host);
}

function isVercelPreview(host: string) {
  // Vercel preview deployments use patterns like:
  // - formaos-<hash>-<team>.vercel.app
  // - formaos-git-<branch>-<team>.vercel.app
  return host.endsWith('.vercel.app');
}

function normalizeHost(host: string) {
  return host.startsWith('.') ? host.slice(1) : host;
}

function longestCommonSuffixHost(hostA: string, hostB: string) {
  const partsA = normalizeHost(hostA).split('.');
  const partsB = normalizeHost(hostB).split('.');
  const suffix: string[] = [];
  for (let idx = 1; idx <= Math.min(partsA.length, partsB.length); idx += 1) {
    const partA = partsA[partsA.length - idx];
    const partB = partsB[partsB.length - idx];
    if (partA !== partB) break;
    suffix.unshift(partA);
  }
  return suffix.length > 0 ? suffix.join('.') : '';
}

function widenHost(host: string) {
  const normalized = normalizeHost(host);
  const parts = normalized.split('.');
  const dropPrefixes = new Set(['www', 'app', 'admin']);
  if (parts.length >= 3 && dropPrefixes.has(parts[0])) {
    return parts.slice(1).join('.');
  }
  return normalized;
}

export function getCookieDomain(requestHost?: string): string | undefined {
  const explicit =
    process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? process.env.COOKIE_DOMAIN;
  if (explicit) {
    if (!requestHost) return explicit;
    const clean = normalizeHost(explicit);
    if (isLocalhost(requestHost) || isIpAddress(requestHost)) {
      return undefined;
    }
    return requestHost.endsWith(clean) ? explicit : undefined;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  try {
    const siteHost = siteUrl ? new URL(siteUrl).hostname : '';
    const appHost = appUrl ? new URL(appUrl).hostname : '';
    const primaryHost = siteHost || appHost;

    if (!primaryHost) return undefined;

    const normalizedPrimary = normalizeHost(primaryHost);
    if (isLocalhost(normalizedPrimary) || isIpAddress(normalizedPrimary)) {
      return undefined;
    }

    // For mobile Safari compatibility: don't use domain cookie if on same subdomain
    // Only use cross-subdomain cookies if truly needed
    if (!requestHost) {
      // No cross-subdomain needed - let browser handle it
      return undefined;
    }

    if (isLocalhost(requestHost) || isIpAddress(requestHost)) {
      return undefined;
    }

    // CRITICAL: For Vercel preview deployments, NEVER set a domain cookie.
    // Each preview gets a unique subdomain (e.g., formaos-abc123-team.vercel.app)
    // Setting a domain cookie would cause cross-deployment cookie leakage.
    if (isVercelPreview(requestHost)) {
      return undefined;
    }

    // If request host matches app host exactly, don't set domain cookie
    if (requestHost === appHost || requestHost === siteHost) {
      return undefined;
    }

    // Only set domain cookie if we need cross-subdomain auth
    const cookieHost = normalizedPrimary;
    if (siteHost && appHost && siteHost !== appHost) {
      const common = longestCommonSuffixHost(siteHost, appHost);
      if (common && requestHost.endsWith(common)) {
        return `.${common}`;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}
