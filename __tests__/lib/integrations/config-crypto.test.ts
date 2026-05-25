/** @jest-environment node */
import {
  encodeIntegrationConfig,
  decodeIntegrationConfig,
} from '@/lib/integrations/config-crypto';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('integration config crypto', () => {
  it('round-trips a payload with INTEGRATION_CONFIG_KEY set', () => {
    process.env.INTEGRATION_CONFIG_KEY = 'test-key-1234-must-be-stable';
    delete process.env.INTEGRATION_CONFIG_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const payload = { token: 'abc123', refresh: 'xyz' } as const;
    const env = encodeIntegrationConfig(payload as Record<string, unknown>);
    expect(env).toHaveProperty('__encrypted', true);

    const decoded = decodeIntegrationConfig<typeof payload>(env);
    expect(decoded).toEqual(payload);
  });

  it('still honours INTEGRATION_CONFIG_SECRET (legacy alias)', () => {
    process.env.INTEGRATION_CONFIG_SECRET = 'legacy-config-secret';
    delete process.env.INTEGRATION_CONFIG_KEY;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const env = encodeIntegrationConfig({ a: 1 });
    expect(decodeIntegrationConfig<{ a: number }>(env)).toEqual({ a: 1 });
  });

  it('does NOT fall back to SUPABASE_SERVICE_ROLE_KEY anymore', () => {
    // Prior code chained ... || SUPABASE_SERVICE_ROLE_KEY which meant
    // a service-role leak could decrypt every customer's integration
    // tokens. With no integration-key envs set, dev falls back to a
    // documented constant; the test below covers the production
    // failure path.
    delete process.env.INTEGRATION_CONFIG_KEY;
    delete process.env.INTEGRATION_CONFIG_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'super-secret-service-role';
    process.env.NODE_ENV = 'production';

    expect(() => encodeIntegrationConfig({ a: 1 })).toThrow(
      /INTEGRATION_CONFIG_KEY/,
    );
  });

  it('throws in production when no key is configured', () => {
    delete process.env.INTEGRATION_CONFIG_KEY;
    delete process.env.INTEGRATION_CONFIG_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NODE_ENV = 'production';

    expect(() => encodeIntegrationConfig({ a: 1 })).toThrow(
      /INTEGRATION_CONFIG_KEY/,
    );
  });

  it('uses dev fallback secret when no key in non-production', () => {
    delete process.env.INTEGRATION_CONFIG_KEY;
    delete process.env.INTEGRATION_CONFIG_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NODE_ENV = 'development';

    const env = encodeIntegrationConfig({ a: 1 });
    expect(decodeIntegrationConfig<{ a: number }>(env)).toEqual({ a: 1 });
  });

  it('returns the value unchanged when input is not an encrypted envelope', () => {
    const raw = { hello: 'world' };
    expect(decodeIntegrationConfig(raw)).toEqual(raw);
    expect(decodeIntegrationConfig(null)).toEqual({});
    expect(decodeIntegrationConfig(undefined)).toEqual({});
  });
});
