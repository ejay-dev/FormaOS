import { HELP_ARTICLES } from '@/lib/help/articles';

describe('HELP_ARTICLES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(HELP_ARTICLES)).toBe(true);
    expect(HELP_ARTICLES.length).toBeGreaterThan(0);
  });

  it('every article has required fields', () => {
    for (const article of HELP_ARTICLES) {
      expect(article.id).toBeTruthy();
      expect(article.title).toBeTruthy();
      expect(article.summary).toBeTruthy();
      expect(article.body).toBeTruthy();
      expect(Array.isArray(article.tags)).toBe(true);
      expect(article.tags.length).toBeGreaterThan(0);
      expect(Array.isArray(article.routes)).toBe(true);
      expect(article.routes.length).toBeGreaterThan(0);
    }
  });

  it('has unique IDs', () => {
    const ids = HELP_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes getting-started article', () => {
    expect(HELP_ARTICLES.find((a) => a.id === 'getting-started')).toBeDefined();
  });

  it('includes tasks article', () => {
    const tasks = HELP_ARTICLES.find((a) => a.id === 'tasks');
    expect(tasks).toBeDefined();
    expect(tasks!.routes).toContain('/app/tasks');
  });

  it('includes evidence article linked to vault', () => {
    const evidence = HELP_ARTICLES.find((a) => a.id === 'evidence');
    expect(evidence).toBeDefined();
    expect(evidence!.routes).toContain('/app/vault');
  });

  it('all routes start with /app', () => {
    for (const article of HELP_ARTICLES) {
      for (const route of article.routes) {
        expect(route.startsWith('/app')).toBe(true);
      }
    }
  });
});
