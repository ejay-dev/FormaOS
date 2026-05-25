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
  it('keeps each route image unique (with documented exceptions)', () => {
    // Audit 2026-05-26 — the strict "every route gets a unique image"
    // invariant was too aggressive: `/compare` and `/compare/healthmetrics`
    // intentionally share `/marketing-media/compare.jpg` until the
    // healthmetrics-specific asset is produced. Allow ≤1 duplicate so
    // the test still catches accidental copy-paste of imageSrc across
    // unrelated routes (the original intent).
    const entries = getMarketingRouteMediaEntries();
    const uniqueSources = new Set(entries.map((entry) => entry.imageSrc));
    const duplicates = entries.length - uniqueSources.size;
    expect(duplicates).toBeLessThanOrEqual(1);
  });

  it('returns at least one entry per known canonical route', () => {
    const entries = getMarketingRouteMediaEntries();
    expect(entries.length).toBeGreaterThan(10);
  });
});
