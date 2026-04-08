/**
 * Tests for lib/supabase/cookie-domain.ts
 */

import { getCookieDomain } from '@/lib/supabase/cookie-domain';

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  delete process.env.COOKIE_DOMAIN;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
});

describe('getCookieDomain', () => {
  describe('explicit cookie domain', () => {
    it('returns explicit domain when set and no request host', () => {
      process.env.NEXT_PUBLIC_COOKIE_DOMAIN = '.example.com';
      expect(getCookieDomain()).toBe('.example.com');
    });

    it('uses COOKIE_DOMAIN fallback', () => {
      process.env.COOKIE_DOMAIN = '.fallback.com';
      expect(getCookieDomain()).toBe('.fallback.com');
    });

    it('returns undefined for localhost request host with explicit domain', () => {
      process.env.NEXT_PUBLIC_COOKIE_DOMAIN = '.example.com';
      expect(getCookieDomain('localhost')).toBeUndefined();
    });

    it('returns undefined for subdomain of localhost', () => {
      process.env.NEXT_PUBLIC_COOKIE_DOMAIN = '.example.com';
      expect(getCookieDomain('app.localhost')).toBeUndefined();
    });

    it('returns undefined for IP address request host', () => {
      process.env.NEXT_PUBLIC_COOKIE_DOMAIN = '.example.com';
      expect(getCookieDomain('192.168.1.1')).toBeUndefined();
    });

    it('returns explicit domain when request host matches', () => {
      process.env.NEXT_PUBLIC_COOKIE_DOMAIN = '.example.com';
      expect(getCookieDomain('app.example.com')).toBe('.example.com');
    });

    it('returns undefined when request host does not match explicit domain', () => {
      process.env.NEXT_PUBLIC_COOKIE_DOMAIN = '.example.com';
      expect(getCookieDomain('other.com')).toBeUndefined();
    });
  });

  describe('auto-detection from site/app URLs', () => {
    it('returns undefined when no URLs configured', () => {
      expect(getCookieDomain('app.example.com')).toBeUndefined();
    });

    it('returns undefined when no request host and URLs present', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getCookieDomain()).toBeUndefined();
    });

    it('returns undefined for localhost primary host', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
      expect(getCookieDomain('localhost')).toBeUndefined();
    });

    it('returns undefined for IP address primary host', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'http://192.168.1.1:3000';
      expect(getCookieDomain('192.168.1.1')).toBeUndefined();
    });

    it('returns undefined for localhost request host', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getCookieDomain('localhost')).toBeUndefined();
    });

    it('returns undefined for IP address request host', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getCookieDomain('10.0.0.1')).toBeUndefined();
    });

    it('returns undefined for Vercel preview deployments', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getCookieDomain('formaos-abc123-team.vercel.app')).toBeUndefined();
    });

    it('returns undefined when request host matches app host exactly', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
      expect(getCookieDomain('app.example.com')).toBeUndefined();
    });

    it('returns undefined when request host matches site host exactly', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      expect(getCookieDomain('example.com')).toBeUndefined();
    });

    it('returns common suffix for cross-subdomain auth', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://www.example.com';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
      expect(getCookieDomain('admin.example.com')).toBe('.example.com');
    });

    it('returns undefined when site and app are same host', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
      expect(getCookieDomain('other.example.com')).toBeUndefined();
    });

    it('returns undefined when request host does not match common suffix', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://www.example.com';
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
      expect(getCookieDomain('different.com')).toBeUndefined();
    });

    it('returns undefined for invalid URL', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'not-a-url';
      expect(getCookieDomain('example.com')).toBeUndefined();
    });

    it('uses app URL when site URL is not set', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com';
      expect(getCookieDomain('other.example.com')).toBeUndefined();
    });
  });
});
