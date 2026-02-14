export interface GeoLookupResult {
  country?: string;
  region?: string;
  city?: string;
}

export interface GeoIpProvider {
  lookup(ip: string): Promise<GeoLookupResult | null>;
}

class NoopGeoIpProvider implements GeoIpProvider {
  async lookup(_ip: string): Promise<GeoLookupResult | null> {
    return null;
  }
}

class IpApiGeoProvider implements GeoIpProvider {
  private readonly endpoint: string;
  private readonly apiKey?: string;

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint ?? 'https://ipapi.co';
    this.apiKey = apiKey;
  }

  async lookup(ip: string): Promise<GeoLookupResult | null> {
    const safeIp = ip.trim();
    if (!safeIp) return null;

    const url = new URL(`${this.endpoint.replace(/\/$/, '')}/${safeIp}/json/`);
    if (this.apiKey) {
      url.searchParams.set('key', this.apiKey);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return {
      country:
        typeof payload.country_name === 'string'
          ? payload.country_name
          : undefined,
      region:
        typeof payload.region === 'string' ? payload.region : undefined,
      city: typeof payload.city === 'string' ? payload.city : undefined,
    };
  }
}

let provider: GeoIpProvider | null = null;

export function getGeoIpProvider(): GeoIpProvider {
  if (provider) return provider;

  const configuredProvider = (
    process.env.GEOIP_PROVIDER ?? 'none'
  ).toLowerCase();

  if (configuredProvider === 'ipapi') {
    provider = new IpApiGeoProvider(
      process.env.GEOIP_ENDPOINT,
      process.env.GEOIP_API_KEY,
    );
    return provider;
  }

  provider = new NoopGeoIpProvider();
  return provider;
}
