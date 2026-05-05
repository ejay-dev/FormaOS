import { test } from '@playwright/test';

test('inspect deferred sections on /contact', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  // Retry navigation once to handle cold-start ERR_ABORTED flakes
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await page.goto('/contact?type=compliance-plan', {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(2000 * attempt);
    }
  }
  await page
    .waitForLoadState('networkidle', { timeout: 5_000 })
    .catch(() => undefined);

  // Scroll through
  await page.evaluate(async () => {
    const total = document.documentElement.scrollHeight;
    const step = Math.max(window.innerHeight * 0.8, 600);
    for (let y = 0; y < total; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 200));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(500);

  const report = await page.evaluate(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('.mk-deferred-section'),
    );
    return sections.map((s, i) => {
      const rect = s.getBoundingClientRect();
      const firstChild = s.firstElementChild as HTMLElement | null;
      // Find all motion.div-like children and their computed opacity
      const motionChildren = Array.from(
        s.querySelectorAll<HTMLElement>('[style*="transform"]'),
      )
        .slice(0, 3)
        .map((el) => ({
          opacity: getComputedStyle(el).opacity,
          transform: getComputedStyle(el).transform.slice(0, 60),
          filter: getComputedStyle(el).filter.slice(0, 40),
          tag: el.tagName.toLowerCase(),
          classPreview: el.className.toString().slice(0, 60),
        }));
      return {
        index: i,
        height: Math.round(rect.height),
        minHeight: s.style.minHeight,
        firstChildOpacity: firstChild
          ? getComputedStyle(firstChild).opacity
          : null,
        motionChildren,
        textPreview: (s.innerText || '').slice(0, 60).replace(/\s+/g, ' '),
      };
    });
  });
  console.log(JSON.stringify(report, null, 2));
});
