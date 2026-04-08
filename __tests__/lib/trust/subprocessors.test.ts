import { TRUST_SUBPROCESSORS } from '@/lib/trust/subprocessors';

describe('TRUST_SUBPROCESSORS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(TRUST_SUBPROCESSORS)).toBe(true);
    expect(TRUST_SUBPROCESSORS.length).toBeGreaterThan(0);
  });

  it('every entry has required fields', () => {
    for (const sp of TRUST_SUBPROCESSORS) {
      expect(sp.name).toBeTruthy();
      expect(sp.purpose).toBeTruthy();
      expect(sp.location).toBeTruthy();
      expect(sp.category).toBeTruthy();
      expect(sp.icon).toBeDefined();
    }
  });

  it('includes Supabase', () => {
    expect(
      TRUST_SUBPROCESSORS.find((s) => s.name.includes('Supabase')),
    ).toBeDefined();
  });

  it('includes Vercel', () => {
    expect(TRUST_SUBPROCESSORS.find((s) => s.name === 'Vercel')).toBeDefined();
  });

  it('includes Stripe for payments', () => {
    const stripe = TRUST_SUBPROCESSORS.find((s) => s.name === 'Stripe');
    expect(stripe).toBeDefined();
    expect(stripe!.category).toBe('Payments');
  });

  it('includes Sentry for monitoring', () => {
    const sentry = TRUST_SUBPROCESSORS.find((s) => s.name === 'Sentry');
    expect(sentry).toBeDefined();
    expect(sentry!.category).toBe('Monitoring');
  });

  it('has unique names', () => {
    const names = TRUST_SUBPROCESSORS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
