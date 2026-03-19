/** @jest-environment node */

/**
 * Unit tests for lib/security/url-validator.ts — SSRF prevention
 */

// Mock dns module before imports
jest.mock('dns/promises', () => ({
  resolve4: jest.fn(),
  resolve6: jest.fn(),
}));

import dns from 'dns/promises';
import {
  validateWebhookUrl,
  UrlValidationError,
} from '@/lib/security/url-validator';

const mockResolve4 = dns.resolve4 as jest.MockedFunction<typeof dns.resolve4>;
const mockResolve6 = dns.resolve6 as jest.MockedFunction<typeof dns.resolve6>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupPublicDns(ipv4: string[] = ['93.184.216.34']) {
  mockResolve4.mockResolvedValue(ipv4);
  mockResolve6.mockRejectedValue(new Error('no AAAA'));
}

function setupPrivateDns(ipv4: string[] = ['10.0.0.1']) {
  mockResolve4.mockResolvedValue(ipv4);
  mockResolve6.mockRejectedValue(new Error('no AAAA'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateWebhookUrl', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    mockResolve4.mockReset();
    mockResolve6.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // --- Valid URLs ---

  it('accepts a valid HTTPS URL with public DNS', async () => {
    setupPublicDns();
    await expect(
      validateWebhookUrl('https://hooks.example.com/webhook'),
    ).resolves.toBeUndefined();
  });

  // --- Protocol enforcement ---

  it('rejects HTTP URLs in production', async () => {
    await expect(
      validateWebhookUrl('http://hooks.example.com/webhook'),
    ).rejects.toThrow(UrlValidationError);
    await expect(
      validateWebhookUrl('http://hooks.example.com/webhook'),
    ).rejects.toThrow(/must use HTTPS/);
  });

  it('rejects non-HTTP(S) protocols', async () => {
    await expect(validateWebhookUrl('ftp://files.example.com/data')).rejects.toThrow(
      /must use HTTPS/,
    );
    await expect(
      validateWebhookUrl('file:///etc/passwd'),
    ).rejects.toThrow(UrlValidationError);
  });

  it('allows HTTP localhost in development mode', async () => {
    process.env.NODE_ENV = 'development';
    await expect(
      validateWebhookUrl('http://localhost:3000/webhook'),
    ).resolves.toBeUndefined();
  });

  it('allows HTTP 127.0.0.1 in development mode', async () => {
    process.env.NODE_ENV = 'development';
    await expect(
      validateWebhookUrl('http://127.0.0.1:8080/hook'),
    ).resolves.toBeUndefined();
  });

  it('rejects HTTP non-localhost even in development', async () => {
    process.env.NODE_ENV = 'development';
    await expect(
      validateWebhookUrl('http://example.com/hook'),
    ).rejects.toThrow(/must use HTTPS/);
  });

  // --- Invalid URLs ---

  it('rejects an unparseable URL string', async () => {
    await expect(validateWebhookUrl('not-a-url')).rejects.toThrow(
      /Invalid webhook URL/,
    );
  });

  // --- Private hostname blocking ---

  it('blocks https://localhost', async () => {
    await expect(
      validateWebhookUrl('https://localhost/hook'),
    ).rejects.toThrow(/private\/internal address/);
  });

  it('blocks https://[::1]', async () => {
    await expect(
      validateWebhookUrl('https://[::1]/hook'),
    ).rejects.toThrow(/private\/internal address/);
  });

  it('blocks https://127.0.0.1', async () => {
    await expect(
      validateWebhookUrl('https://127.0.0.1/hook'),
    ).rejects.toThrow(/private\/internal address/);
  });

  it('blocks https://10.0.0.1 (RFC 1918)', async () => {
    await expect(
      validateWebhookUrl('https://10.0.0.1/hook'),
    ).rejects.toThrow(/private\/internal address/);
  });

  it('blocks https://192.168.1.1 (RFC 1918)', async () => {
    await expect(
      validateWebhookUrl('https://192.168.1.1/hook'),
    ).rejects.toThrow(/private\/internal address/);
  });

  it('blocks https://169.254.169.254 (cloud metadata endpoint)', async () => {
    await expect(
      validateWebhookUrl('https://169.254.169.254/latest/meta-data/'),
    ).rejects.toThrow(/private\/internal address/);
  });

  // --- DNS rebinding protection ---

  it('blocks URLs where DNS resolves to a private IP', async () => {
    setupPrivateDns(['10.0.0.5']);
    await expect(
      validateWebhookUrl('https://evil-rebind.attacker.com/hook'),
    ).rejects.toThrow(/resolves to a private/);
  });

  it('blocks URLs where DNS resolves to 172.16.x.x', async () => {
    setupPrivateDns(['172.16.0.1']);
    await expect(
      validateWebhookUrl('https://internal.attacker.com/hook'),
    ).rejects.toThrow(/resolves to a private/);
  });

  it('blocks URLs where DNS resolves to CGNAT range (100.64.x.x)', async () => {
    setupPrivateDns(['100.64.0.1']);
    await expect(
      validateWebhookUrl('https://cgnat.attacker.com/hook'),
    ).rejects.toThrow(/resolves to a private/);
  });

  it('blocks URLs where DNS fails to resolve (no addresses)', async () => {
    mockResolve4.mockRejectedValue(new Error('ENOTFOUND'));
    mockResolve6.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(
      validateWebhookUrl('https://nonexistent.invalid/hook'),
    ).rejects.toThrow(/resolves to a private/);
  });

  it('blocks when any resolved IP is private (mixed results)', async () => {
    // One public and one private — should still block
    mockResolve4.mockResolvedValue(['93.184.216.34', '10.0.0.1']);
    mockResolve6.mockRejectedValue(new Error('no AAAA'));
    await expect(
      validateWebhookUrl('https://mixed.attacker.com/hook'),
    ).rejects.toThrow(/resolves to a private/);
  });

  // --- Skips DNS check in development ---

  it('skips DNS resolution check in development mode', async () => {
    process.env.NODE_ENV = 'development';
    // Do not set up DNS mocks — in dev, DNS check is skipped
    await expect(
      validateWebhookUrl('https://hooks.example.com/webhook'),
    ).resolves.toBeUndefined();
    expect(mockResolve4).not.toHaveBeenCalled();
  });

  // --- UrlValidationError type ---

  it('throws UrlValidationError instances (not plain Error)', async () => {
    try {
      await validateWebhookUrl('not-a-url');
      fail('Expected an error to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(UrlValidationError);
      expect((err as UrlValidationError).name).toBe('UrlValidationError');
    }
  });
});
