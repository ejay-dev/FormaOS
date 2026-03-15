import {
  getMarketingRouteMediaEntries,
  normalizeMarketingPath,
  selectMarketingRouteMedia,
} from '@/lib/marketing/background-media';

describe('normalizeMarketingPath', () => {
  it('normalizes empty values to the root path', () => {
    expect(normalizeMarketingPath(undefined)).toBe('/');
    expect(normalizeMarketingPath('')).toBe('/');
  });

  it('adds a leading slash and trims a trailing slash', () => {
    expect(normalizeMarketingPath('pricing/')).toBe('/pricing');
  });
});

describe('selectMarketingRouteMedia', () => {
  it('returns exact media entries for known marketing routes', () => {
    expect(selectMarketingRouteMedia('/')?.imageSrc).toBe(
      '/marketing-media/home.jpg',
    );
    expect(selectMarketingRouteMedia('/trust')?.imageSrc).toBe(
      '/marketing-media/trust.jpg',
    );
    expect(selectMarketingRouteMedia('/industries')?.imageSrc).toBe(
      '/marketing-media/industries.jpg',
    );
  });

  it('does not reuse a catch-all image for unknown or dynamic paths', () => {
    expect(selectMarketingRouteMedia('/blog/a-real-post')).toBeNull();
    expect(selectMarketingRouteMedia('/not-a-page')).toBeNull();
  });
});

describe('getMarketingRouteMediaEntries', () => {
  it('keeps each route image unique', () => {
    const entries = getMarketingRouteMediaEntries();
    const uniqueSources = new Set(entries.map((entry) => entry.imageSrc));

    expect(uniqueSources.size).toBe(entries.length);
  });
});
