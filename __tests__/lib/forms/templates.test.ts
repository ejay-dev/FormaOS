/**
 * Tests for lib/forms/templates/index.ts — form template registry (653 LOC)
 */

import {
  FORM_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByIndustry,
  getTemplateById,
} from '@/lib/forms/templates/index';

describe('FORM_TEMPLATES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(FORM_TEMPLATES)).toBe(true);
    expect(FORM_TEMPLATES.length).toBeGreaterThan(0);
  });

  it('each template has required fields', () => {
    for (const tpl of FORM_TEMPLATES) {
      expect(tpl.id).toBeTruthy();
      expect(tpl.name).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.category).toBeTruthy();
      expect(tpl.industry).toBeTruthy();
      expect(Array.isArray(tpl.fields)).toBe(true);
      expect(tpl.fields.length).toBeGreaterThan(0);
    }
  });

  it('template IDs are unique', () => {
    const ids = FORM_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each field has id, type, label', () => {
    for (const tpl of FORM_TEMPLATES) {
      for (const field of tpl.fields) {
        expect(field.id).toBeTruthy();
        expect(field.type).toBeTruthy();
        expect(field.label).toBeTruthy();
      }
    }
  });
});

describe('getTemplatesByCategory', () => {
  it('returns all templates when no category', () => {
    expect(getTemplatesByCategory()).toEqual(FORM_TEMPLATES);
    expect(getTemplatesByCategory(undefined)).toEqual(FORM_TEMPLATES);
  });

  it('returns only risk templates', () => {
    const risk = getTemplatesByCategory('risk');
    for (const t of risk) {
      expect(t.category).toBe('risk');
    }
  });

  it('returns only compliance templates', () => {
    const compliance = getTemplatesByCategory('compliance');
    for (const t of compliance) {
      expect(t.category).toBe('compliance');
    }
  });

  it('returns empty for unknown category', () => {
    expect(getTemplatesByCategory('nonexistent')).toHaveLength(0);
  });
});

describe('getTemplatesByIndustry', () => {
  it('returns all templates when no industry', () => {
    expect(getTemplatesByIndustry()).toEqual(FORM_TEMPLATES);
  });

  it('returns general + matching industry templates', () => {
    const healthcareTemplates = getTemplatesByIndustry('healthcare');
    for (const t of healthcareTemplates) {
      expect(['healthcare', 'general']).toContain(t.industry);
    }
  });

  it('includes general templates for any industry', () => {
    const generalCount = FORM_TEMPLATES.filter(
      (t) => t.industry === 'general',
    ).length;
    const healthcareTemplates = getTemplatesByIndustry('healthcare');
    expect(healthcareTemplates.length).toBeGreaterThanOrEqual(generalCount);
  });
});

describe('getTemplateById', () => {
  it('finds existing template', () => {
    const firstId = FORM_TEMPLATES[0].id;
    const found = getTemplateById(firstId);
    expect(found).toBeDefined();
    expect(found!.id).toBe(firstId);
  });

  it('returns undefined for nonexistent ID', () => {
    expect(getTemplateById('nonexistent-id')).toBeUndefined();
  });
});
