import { expect, test } from '@playwright/test';

test.describe('Marketing changelog page', () => {
  test('loads latest release, major update themes, internal links, and CTA', async ({
    page,
  }) => {
    const response = await page.goto('/changelog', {
      waitUntil: 'domcontentloaded',
    });
    expect(response?.status()).toBeLessThan(400);

    await expect(
      page.getByRole('heading', { name: /Every change,\s*shipped transparently/i }),
    ).toBeVisible();

    await expect(
      page.getByText(/Latest:\s*v3\.8\.0\s*Evidence Integrity/i),
    ).toBeVisible();

    for (const theme of [
      'Feature',
      'Improvement',
      'Security',
      'Enterprise',
      'Integration',
    ]) {
      await expect(page.getByText(theme).first()).toBeVisible();
    }

    const hrefs = await page.locator('a[href^="/"]').evaluateAll((links) =>
      Array.from(
        new Set(
          links
            .map((link) => link.getAttribute('href'))
            .filter((href): href is string => Boolean(href))
            .map((href) => href.split('#')[0])
            .filter((href) => href.length > 0),
        ),
      ),
    );

    for (const href of hrefs) {
      const linked = await page.request.get(href);
      expect(linked.status(), href).toBeLessThan(400);
    }

    const primaryCta = page
      .getByRole('link', { name: /Get Compliance Plan/i })
      .last();
    await expect(primaryCta).toHaveAttribute('href', /\/contact\?type=compliance-plan/);
    await primaryCta.click();
    await expect(page).toHaveURL(/\/contact\?type=compliance-plan/);
  });
});
