/**
 * BackstopJS onReady script
 * Runs when page is ready for screenshot
 */

module.exports = async (page, scenario, vp) => {
  console.log('READY > ' + scenario.label);

  // Ensure all images are loaded
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise((resolve) => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve);
            }),
        ),
    );
  });

  // Wait for any lazy-loaded content
  await page.waitForTimeout(500);

  // Scroll to ensure lazy-loaded content appears
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(500);

  // Scroll back to top for consistent screenshot
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(200);

  // Remove focus from any focused elements
  await page.evaluate(() => {
    if (document.activeElement) {
      document.activeElement.blur();
    }
  });
};
