/**
 * Tests for lib/security/url-validator.ts
 */

import {
  validateWebhookUrl,
  UrlValidationError,
} from '@/lib/security/url-validator';

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.NODE_ENV = 'development';
});

afterAll(() => {
  process.env = originalEnv;
});

describe('validateWebhookUrl', () => {
  describe('valid URLs', () => {
    it('accepts HTTPS URLs', async () => {
      await expect(
        validateWebhookUrl('https://example.com/webhook'),
      ).resolves.toBeUndefined();
    });

    it('accepts HTTP localhost in development', async () => {
      process.env.NODE_ENV = 'development';
      await expect(
        validateWebhookUrl('http://localhost:8080/callback'),
      ).resolves.toBeUndefined();
    });

    it('accepts HTTP 127.0.0.1 in development', async () => {
      process.env.NODE_ENV = 'development';
      await expect(
        validateWebhookUrl('http://127.0.0.1:3000/webhook'),
      ).resolves.toBeUndefined();
    });
  });

  describe('invalid URLs', () => {
    it('rejects unparseable URL', async () => {
      await expect(validateWebhookUrl('not a url')).rejects.toThrow(
        UrlValidationError,
      );
      await expect(validateWebhookUrl('not a url')).rejects.toThrow(
        'unable to parse',
      );
    });

    it('rejects empty string', async () => {
      await expect(validateWebhookUrl('')).rejects.toThrow(UrlValidationError);
    });

    it('rejects FTP protocol', async () => {
      await expect(
        validateWebhookUrl('ftp://files.example.com/data'),
      ).rejects.toThrow('HTTPS');
    });

    it('rejects javascript protocol', async () => {
      await expect(validateWebhookUrl('javascript:alert(1)')).rejects.toThrow(
        UrlValidationError,
      );
    });
  });

  describe('SSRF prevention', () => {
    it('rejects HTTP in production (non-localhost)', async () => {
      process.env.NODE_ENV = 'production';
      await expect(
        validateWebhookUrl('http://example.com/webhook'),
      ).rejects.toThrow('HTTPS');
    });

    it('blocks private IP 10.x.x.x', async () => {
      await expect(
        validateWebhookUrl('https://10.0.0.1/webhook'),
      ).rejects.toThrow('private');
    });

    it('blocks private IP 172.16.x.x', async () => {
      await expect(
        validateWebhookUrl('https://172.16.0.1/webhook'),
      ).rejects.toThrow('private');
    });

    it('blocks private IP 192.168.x.x', async () => {
      await expect(
        validateWebhookUrl('https://192.168.1.1/webhook'),
      ).rejects.toThrow('private');
    });

    it('blocks loopback 127.0.0.1', async () => {
      await expect(
        validateWebhookUrl('https://127.0.0.1/webhook'),
      ).rejects.toThrow('private');
    });

    it('blocks localhost hostname', async () => {
      await expect(
        validateWebhookUrl('https://localhost/webhook'),
      ).rejects.toThrow('private');
    });

    it('blocks link-local 169.254.x.x (metadata endpoint)', async () => {
      await expect(
        validateWebhookUrl('https://169.254.169.254/latest/meta-data/'),
      ).rejects.toThrow('private');
    });

    it('blocks 0.0.0.0', async () => {
      await expect(
        validateWebhookUrl('https://0.0.0.0/webhook'),
      ).rejects.toThrow('private');
    });

    it('blocks CGNAT range 100.64.x.x', async () => {
      await expect(
        validateWebhookUrl('https://100.64.0.1/webhook'),
      ).rejects.toThrow('private');
    });

    it('blocks benchmarking range 198.18.x.x', async () => {
      await expect(
        validateWebhookUrl('https://198.18.0.1/webhook'),
      ).rejects.toThrow('private');
    });

    it('blocks IPv6 loopback ::1', async () => {
      await expect(validateWebhookUrl('https://[::1]/webhook')).rejects.toThrow(
        'private',
      );
    });

    it('blocks IPv6 loopback [::1]', async () => {
      await expect(validateWebhookUrl('https://[::1]/webhook')).rejects.toThrow(
        'private',
      );
    });
  });

  describe('edge cases', () => {
    it('allows non-private IP 172.15.x.x (outside 172.16-31 range)', async () => {
      // 172.15.x.x is NOT private
      await expect(
        validateWebhookUrl('https://172.15.0.1/webhook'),
      ).resolves.toBeUndefined();
    });

    it('allows 100.63.x.x (below CGNAT range)', async () => {
      await expect(
        validateWebhookUrl('https://100.63.255.255/webhook'),
      ).resolves.toBeUndefined();
    });

    it('allows 100.128.x.x (above CGNAT range)', async () => {
      await expect(
        validateWebhookUrl('https://100.128.0.1/webhook'),
      ).resolves.toBeUndefined();
    });
  });
});
