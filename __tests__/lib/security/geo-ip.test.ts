/** @jest-environment node */

const mockFetch = jest.fn();
global.fetch = mockFetch as any;


describe('lib/security/geo-ip', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockFetch.mockReset();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('NoopGeoIpProvider (default)', () => {
    it('returns null for any IP', async () => {
      process.env.GEOIP_PROVIDER = 'none';
      const { getGeoIpProvider: getProvider } =
        await import('@/lib/security/geo-ip');
      const provider = getProvider();
      const result = await provider.lookup('1.2.3.4');
      expect(result).toBeNull();
    });
  });

  describe('IpApiGeoProvider', () => {
    it('returns geo data for valid IPv4', async () => {
      process.env.GEOIP_PROVIDER = 'ipapi';
      const { getGeoIpProvider: getProvider } =
        await import('@/lib/security/geo-ip');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country_name: 'Australia',
          region: 'Victoria',
          city: 'Melbourne',
        }),
      });

      const provider = getProvider();
      const result = await provider.lookup('203.0.113.1');
      expect(result).toEqual({
        country: 'Australia',
        region: 'Victoria',
        city: 'Melbourne',
      });
    });

    it('returns null for empty IP', async () => {
      process.env.GEOIP_PROVIDER = 'ipapi';
      const { getGeoIpProvider: getProvider } =
        await import('@/lib/security/geo-ip');

      const provider = getProvider();
      const result = await provider.lookup('');
      expect(result).toBeNull();
    });

    it('returns null for invalid IP', async () => {
      process.env.GEOIP_PROVIDER = 'ipapi';
      const { getGeoIpProvider: getProvider } =
        await import('@/lib/security/geo-ip');

      const provider = getProvider();
      const result = await provider.lookup('not-an-ip');
      expect(result).toBeNull();
    });

    it('returns null on API error', async () => {
      process.env.GEOIP_PROVIDER = 'ipapi';
      const { getGeoIpProvider: getProvider } =
        await import('@/lib/security/geo-ip');

      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });

      const provider = getProvider();
      const result = await provider.lookup('1.2.3.4');
      expect(result).toBeNull();
    });

    it('includes API key when configured', async () => {
      process.env.GEOIP_PROVIDER = 'ipapi';
      process.env.GEOIP_API_KEY = 'test-key';
      const { getGeoIpProvider: getProvider } =
        await import('@/lib/security/geo-ip');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_name: 'US' }),
      });

      const provider = getProvider();
      await provider.lookup('1.2.3.4');

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('key=test-key');
    });

    it('handles IPv6', async () => {
      process.env.GEOIP_PROVIDER = 'ipapi';
      const { getGeoIpProvider: getProvider } =
        await import('@/lib/security/geo-ip');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          country_name: 'Germany',
          region: 'Berlin',
          city: 'Berlin',
        }),
      });

      const provider = getProvider();
      const result = await provider.lookup(
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      );
      expect(result?.country).toBe('Germany');
    });

    it('handles missing fields in response', async () => {
      process.env.GEOIP_PROVIDER = 'ipapi';
      const { getGeoIpProvider: getProvider } =
        await import('@/lib/security/geo-ip');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ country_name: 123 }), // non-string
      });

      const provider = getProvider();
      const result = await provider.lookup('1.2.3.4');
      expect(result?.country).toBeUndefined();
    });
  });
});
