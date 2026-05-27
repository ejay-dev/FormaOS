/** @jest-environment node */
/**
 * Audit 2026-05-27 Tier 4.1 — industry-gated framework picker tests.
 */

import {
  FRAMEWORK_OPTIONS,
  frameworkOptionsForIndustry,
  validateFrameworks,
} from '@/lib/validators/organization';

describe('frameworkOptionsForIndustry()', () => {
  it('returns the full list when industry is null/undefined', () => {
    expect(frameworkOptionsForIndustry(null).length).toBe(FRAMEWORK_OPTIONS.length);
    expect(frameworkOptionsForIndustry(undefined).length).toBe(FRAMEWORK_OPTIONS.length);
  });

  it('hides NDIS for non-NDIS industries (Tier 4.1 default)', () => {
    const saas = frameworkOptionsForIndustry('saas_technology');
    expect(saas.some((o) => o.id === 'ndis')).toBe(false);
    expect(saas.some((o) => o.id === 'soc2')).toBe(true);
  });

  it('shows NDIS for industry=ndis', () => {
    const ndis = frameworkOptionsForIndustry('ndis');
    expect(ndis.some((o) => o.id === 'ndis')).toBe(true);
  });

  it('hides aged_care for non-aged-care industries', () => {
    const healthcare = frameworkOptionsForIndustry('healthcare');
    expect(healthcare.some((o) => o.id === 'aged_care')).toBe(false);
  });

  it('keeps universal frameworks (SOC2, ISO27001, GDPR, HIPAA, PCI, custom) on every industry', () => {
    const universal = ['soc2', 'iso27001', 'gdpr', 'hipaa', 'pci-dss', 'custom'];
    for (const industry of ['ndis', 'healthcare', 'aged_care', 'saas_technology', 'financial_services']) {
      const options = frameworkOptionsForIndustry(industry);
      for (const slug of universal) {
        expect(options.some((o) => o.id === slug)).toBe(true);
      }
    }
  });
});

describe('validateFrameworks() industry-aware mode', () => {
  it('accepts NDIS when industry=ndis', () => {
    const result = validateFrameworks(['ndis', 'soc2'], 'ndis');
    expect(result.valid).toBe(true);
  });

  it('rejects NDIS when industry=saas_technology (bypass attempt)', () => {
    const result = validateFrameworks(['ndis'], 'saas_technology');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid framework selection');
  });

  it('rejects aged_care when industry=ndis (cross-industry-pack bypass)', () => {
    const result = validateFrameworks(['aged_care'], 'ndis');
    expect(result.valid).toBe(false);
  });

  it('falls back to full-list validation when industry is omitted (back-compat)', () => {
    expect(validateFrameworks(['ndis']).valid).toBe(true);
    expect(validateFrameworks(['aged_care']).valid).toBe(true);
    expect(validateFrameworks(['not-a-real-framework']).valid).toBe(false);
  });

  it('still requires at least one framework', () => {
    const result = validateFrameworks([], 'ndis');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least one');
  });
});
