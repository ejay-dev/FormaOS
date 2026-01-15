/**
 * BackstopJS onBefore script
 * Runs before each test scenario
 */

module.exports = async (page, scenario, vp) => {
  console.log('SCENARIO > ' + scenario.label);

  // Set up authentication state if needed
  if (scenario.onBeforeScript && scenario.onBeforeScript.includes('auth')) {
    // This will be handled by specific auth scripts
    return;
  }

  // Wait for any initial animations or loading
  await page.waitForLoadState('networkidle');

  // Hide dynamic elements that change between test runs
  await page.addStyleTag({
    content: `
      .timestamp,
      .last-updated,
      .relative-time,
      [data-testid="dynamic-content"] {
        visibility: hidden !important;
      }
      
      /* Hide scroll bars */
      ::-webkit-scrollbar {
        display: none;
      }
      
      /* Disable animations for consistent screenshots */
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
};
