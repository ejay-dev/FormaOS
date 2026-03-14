import {
  normalizeMarketingPath,
  selectMarketingBackgroundTheme,
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

describe('selectMarketingBackgroundTheme', () => {
  it('uses the executive theme on the homepage', () => {
    expect(selectMarketingBackgroundTheme('/').id).toBe('executive');
  });

  it('routes security surfaces to the security media stack', () => {
    expect(selectMarketingBackgroundTheme('/trust/vendor-assurance').id).toBe(
      'security',
    );
    expect(selectMarketingBackgroundTheme('/compare/vanta').id).toBe(
      'security',
    );
  });

  it('routes care and industry surfaces to the care media stack', () => {
    expect(selectMarketingBackgroundTheme('/industries').id).toBe('care');
    expect(
      selectMarketingBackgroundTheme('/use-cases/healthcare').id,
    ).toBe('care');
  });

  it('routes product and documentation surfaces to operations media', () => {
    expect(selectMarketingBackgroundTheme('/product').id).toBe('operations');
    expect(selectMarketingBackgroundTheme('/documentation/api').id).toBe(
      'operations',
    );
  });

  it('routes company and funnel surfaces to executive media', () => {
    expect(selectMarketingBackgroundTheme('/pricing').id).toBe('executive');
    expect(selectMarketingBackgroundTheme('/customer-stories').id).toBe(
      'executive',
    );
  });
});
