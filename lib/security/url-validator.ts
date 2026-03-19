/**
 * =========================================================
 * URL Validator — SSRF Prevention
 * =========================================================
 * Shared utility that validates outbound URLs (webhooks, callbacks, etc.)
 * to prevent Server-Side Request Forgery attacks.
 *
 * - Only allows https:// (and http://localhost in development)
 * - Blocks private/internal IP ranges and metadata endpoints
 * - Resolves DNS and verifies resolved IPs are not private
 *
 * Uses only Node.js built-in modules: dns, url, net.
 */

import dns from 'dns/promises';
import net from 'net';

// ---------------------------------------------------------------------------
// Private IP detection
// ---------------------------------------------------------------------------

/**
 * Returns true when the IP address falls within a private, internal, or
 * reserved range. Covers RFC 1918, loopback, link-local, CGNAT,
 * benchmarking, IPv6 loopback, and IPv6 unique-local (fc00::/7).
 */
function isPrivateIp(ip: string): boolean {
  // IPv4 check
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;

    if (a === 10) return true;                                  // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true;           // 172.16.0.0/12
    if (a === 192 && b === 168) return true;                    // 192.168.0.0/16
    if (a === 127) return true;                                 // 127.0.0.0/8
    if (a === 169 && b === 254) return true;                    // 169.254.0.0/16 (link-local + metadata)
    if (a === 0) return true;                                   // 0.0.0.0/8
    if (a === 100 && b >= 64 && b <= 127) return true;          // 100.64.0.0/10 (CGNAT)
    if (a === 198 && (b === 18 || b === 19)) return true;       // 198.18.0.0/15 (benchmarking)

    return false;
  }

  // IPv6 check
  if (net.isIPv6(ip)) {
    if (ip === '::1' || ip === '::') return true;               // loopback / unspecified
    const lower = ip.toLowerCase();
    if (lower.startsWith('fe80:')) return true;                  // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) {     // fc00::/7 unique-local
      return true;
    }
    // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
    const v4Mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (v4Mapped) return isPrivateIp(v4Mapped[1]);

    return false;
  }

  // Not a valid IP address — this is a hostname, not suspicious by itself
  return false;
}

/**
 * Returns true when the hostname itself is a known private name
 * (before any DNS resolution).
 */
function isPrivateHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true;
  return isPrivateIp(hostname);
}

// ---------------------------------------------------------------------------
// DNS resolution check
// ---------------------------------------------------------------------------

/**
 * Resolve a hostname via DNS and verify that ALL resolved addresses
 * are public (non-private). Returns false if any resolved IP is private
 * or if the hostname cannot be resolved.
 */
async function allResolvedAddressesPublic(hostname: string): Promise<boolean> {
  if (isPrivateIp(hostname)) return false;

  try {
    const [ipv4Result, ipv6Result] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname),
    ]);

    const addresses: string[] = [];
    if (ipv4Result.status === 'fulfilled') addresses.push(...ipv4Result.value);
    if (ipv6Result.status === 'fulfilled') addresses.push(...ipv6Result.value);

    if (addresses.length === 0) return false;

    for (const addr of addresses) {
      if (isPrivateIp(addr)) return false;
    }

    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlValidationError';
  }
}

/**
 * Validate that a URL is safe for outbound requests (SSRF prevention).
 *
 * Rules:
 * - Must be a valid URL
 * - Protocol must be `https:` (or `http:` only for localhost in development)
 * - Hostname must not be a private/internal address
 * - In production, DNS-resolved IPs must all be public (blocks DNS rebinding)
 *
 * @throws {UrlValidationError} with a descriptive message when validation fails
 */
export async function validateWebhookUrl(url: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UrlValidationError(
      `Invalid webhook URL: unable to parse "${url}"`,
    );
  }

  const isDev = process.env.NODE_ENV !== 'production';

  // Protocol check
  if (parsed.protocol === 'http:') {
    const isLocalhost =
      parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (!(isDev && isLocalhost)) {
      throw new UrlValidationError(
        'Webhook URL must use HTTPS. HTTP is only allowed for localhost in development.',
      );
    }
    // localhost in dev is allowed — skip further checks
    return;
  }

  if (parsed.protocol !== 'https:') {
    throw new UrlValidationError(
      `Webhook URL must use HTTPS. Received protocol: "${parsed.protocol}"`,
    );
  }

  // Block private/internal hostnames
  if (isPrivateHostname(parsed.hostname)) {
    throw new UrlValidationError(
      `Webhook URL blocked: "${parsed.hostname}" resolves to a private/internal address.`,
    );
  }

  // In production, resolve DNS and verify the target IPs are public
  if (!isDev) {
    const isPublic = await allResolvedAddressesPublic(parsed.hostname);
    if (!isPublic) {
      throw new UrlValidationError(
        `Webhook URL blocked: "${parsed.hostname}" resolves to a private or reserved IP address.`,
      );
    }
  }
}
