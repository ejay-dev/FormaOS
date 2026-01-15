/**
 * Comprehensive Accessibility Audit Script
 * Tests WCAG 2.1 AA compliance using multiple tools
 */

const pa11y = require('pa11y');
const axeCore = require('axe-core');
const playwright = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  outputDir: 'tests/accessibility/reports',
  browsers: ['chromium', 'firefox', 'webkit'],
  viewports: [
    { width: 320, height: 568, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' },
  ],
  pages: [
    { url: '/', name: 'homepage', auth: false },
    { url: '/pricing', name: 'pricing', auth: false },
    { url: '/features', name: 'features', auth: false },
    { url: '/contact', name: 'contact', auth: false },
    { url: '/app', name: 'dashboard', auth: true },
    { url: '/app/policies', name: 'policies', auth: true },
    { url: '/app/tasks', name: 'tasks', auth: true },
    { url: '/app/team', name: 'team', auth: true },
    { url: '/admin', name: 'admin', auth: 'founder' },
  ],
};

/**
 * Setup authentication for protected pages
 */
async function setupAuth(page, authType) {
  if (authType === true) {
    // Regular user authentication
    await page.evaluate(() => {
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          access_token: 'mock_token_for_a11y_testing',
          user: {
            id: 'test-user-id',
            email: 'test@formaos.com',
            role: 'authenticated',
          },
        }),
      );
    });
  } else if (authType === 'founder') {
    // Founder authentication
    await page.evaluate(() => {
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          access_token: 'mock_founder_token_for_a11y_testing',
          user: {
            id: 'founder-user-id',
            email: 'ejazhussaini313@gmail.com',
            role: 'authenticated',
            app_metadata: { role: 'founder' },
          },
        }),
      );
      localStorage.setItem('formaos.founder_access', 'true');
    });
  }
}

/**
 * Run Pa11y accessibility test
 */
async function runPa11yTest(url, options = {}) {
  const pa11yOptions = {
    standard: 'WCAG2AA',
    level: 'error',
    chromeLaunchConfig: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    timeout: 30000,
    wait: 2000,
    hideElements: [
      '.timestamp',
      '.last-updated',
      '.relative-time',
      '[data-testid="dynamic-content"]',
    ],
    actions: options.actions || [],
    viewport: options.viewport || { width: 1920, height: 1080 },
    ...options,
  };

  try {
    const results = await pa11y(url, pa11yOptions);
    return {
      url,
      tool: 'pa11y',
      issues: results.issues || [],
      documentTitle: results.documentTitle || '',
      pageUrl: results.pageUrl || url,
    };
  } catch (error) {
    return {
      url,
      tool: 'pa11y',
      error: error.message,
      issues: [],
    };
  }
}

/**
 * Run axe-core accessibility test using Playwright
 */
async function runAxeTest(browser, url, options = {}) {
  const page = await browser.newPage({
    viewport: options.viewport || { width: 1920, height: 1080 },
  });

  try {
    // Setup authentication if needed
    if (options.auth) {
      await setupAuth(page, options.auth);
    }

    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for page to be ready
    await page.waitForTimeout(2000);

    // Inject axe-core
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });

    // Run axe scan
    const results = await page.evaluate(() => {
      return axe.run({
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-usage': { enabled: true },
          'semantic-structure': { enabled: true },
        },
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      });
    });

    await page.close();

    return {
      url,
      tool: 'axe-core',
      violations: results.violations || [],
      passes: results.passes?.length || 0,
      incomplete: results.incomplete || [],
      inapplicable: results.inapplicable?.length || 0,
      testEngine: results.testEngine || {},
      testEnvironment: results.testEnvironment || {},
    };
  } catch (error) {
    await page.close();
    return {
      url,
      tool: 'axe-core',
      error: error.message,
      violations: [],
    };
  }
}

/**
 * Run keyboard navigation test
 */
async function runKeyboardNavigationTest(browser, url, options = {}) {
  const page = await browser.newPage({
    viewport: options.viewport || { width: 1920, height: 1080 },
  });

  try {
    if (options.auth) {
      await setupAuth(page, options.auth);
    }

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Test keyboard navigation
    const keyboardResults = [];
    const focusableElements = await page.evaluate(() => {
      const focusable = Array.from(
        document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      return focusable.map((el, index) => ({
        index,
        tagName: el.tagName,
        type: el.type || '',
        id: el.id || '',
        className: el.className || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        text: el.textContent?.trim().substring(0, 50) || '',
      }));
    });

    // Test tab navigation
    for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => {
        const activeEl = document.activeElement;
        if (!activeEl) return null;

        const rect = activeEl.getBoundingClientRect();
        return {
          tagName: activeEl.tagName,
          id: activeEl.id || '',
          className: activeEl.className || '',
          visible: rect.width > 0 && rect.height > 0,
          focusVisible: getComputedStyle(activeEl).outline !== 'none',
        };
      });

      if (focusedElement) {
        keyboardResults.push({
          step: i + 1,
          element: focusedElement,
          accessible: focusedElement.visible && focusedElement.focusVisible,
        });
      }
    }

    await page.close();

    return {
      url,
      tool: 'keyboard-navigation',
      totalFocusableElements: focusableElements.length,
      testedElements: keyboardResults.length,
      accessibleElements: keyboardResults.filter((r) => r.accessible).length,
      results: keyboardResults,
    };
  } catch (error) {
    await page.close();
    return {
      url,
      tool: 'keyboard-navigation',
      error: error.message,
    };
  }
}

/**
 * Generate comprehensive accessibility report
 */
async function generateAccessibilityReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.length,
      totalIssues: 0,
      criticalIssues: 0,
      warnings: 0,
      passes: 0,
    },
    results: results,
    recommendations: [],
  };

  // Analyze results
  results.forEach((result) => {
    if (result.tool === 'pa11y') {
      result.issues.forEach((issue) => {
        report.summary.totalIssues++;
        if (issue.type === 'error') {
          report.summary.criticalIssues++;
        } else if (issue.type === 'warning') {
          report.summary.warnings++;
        }
      });
    } else if (result.tool === 'axe-core') {
      result.violations.forEach((violation) => {
        report.summary.totalIssues += violation.nodes?.length || 1;
        if (violation.impact === 'critical' || violation.impact === 'serious') {
          report.summary.criticalIssues += violation.nodes?.length || 1;
        } else {
          report.summary.warnings += violation.nodes?.length || 1;
        }
      });
      report.summary.passes += result.passes || 0;
    }
  });

  // Generate recommendations
  if (report.summary.criticalIssues > 0) {
    report.recommendations.push(
      'Critical accessibility issues found. These must be fixed before deployment.',
    );
  }

  if (report.summary.warnings > 10) {
    report.recommendations.push(
      'High number of accessibility warnings. Review and fix to improve user experience.',
    );
  }

  if (report.summary.totalIssues === 0) {
    report.recommendations.push(
      'Excellent! No accessibility issues found. Continue monitoring with each deployment.',
    );
  }

  return report;
}

/**
 * Main accessibility audit function
 */
async function runAccessibilityAudit() {
  console.log('🔍 Starting comprehensive accessibility audit...');

  // Ensure output directory exists
  await fs.mkdir(config.outputDir, { recursive: true });

  const allResults = [];

  // Launch browsers
  const browsers = {};
  for (const browserName of config.browsers) {
    browsers[browserName] = await playwright[browserName].launch({
      headless: true,
    });
  }

  try {
    // Test each page in each browser with each viewport
    for (const pageConfig of config.pages) {
      const fullUrl = config.baseUrl + pageConfig.url;

      console.log(`🗺 Testing: ${pageConfig.name} (${fullUrl})`);

      for (const viewport of config.viewports) {
        console.log(
          `  📱 Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`,
        );

        // Pa11y test
        const pa11yResult = await runPa11yTest(fullUrl, {
          viewport: viewport,
          actions: pageConfig.auth
            ? [
                'wait for element body to be visible',
                'evaluate script window.localStorage.setItem("supabase.auth.token", JSON.stringify({access_token: "mock_token", user: {id: "test-user", email: "test@formaos.com"}}))',
              ]
            : [],
        });

        allResults.push({
          ...pa11yResult,
          page: pageConfig.name,
          viewport: viewport.name,
          browser: 'chromium',
        });

        // Axe-core tests for each browser
        for (const browserName of config.browsers) {
          const axeResult = await runAxeTest(browsers[browserName], fullUrl, {
            viewport: viewport,
            auth: pageConfig.auth,
          });

          allResults.push({
            ...axeResult,
            page: pageConfig.name,
            viewport: viewport.name,
            browser: browserName,
          });

          // Keyboard navigation test (only for desktop viewport)
          if (viewport.name === 'desktop') {
            const keyboardResult = await runKeyboardNavigationTest(
              browsers[browserName],
              fullUrl,
              {
                viewport: viewport,
                auth: pageConfig.auth,
              },
            );

            allResults.push({
              ...keyboardResult,
              page: pageConfig.name,
              viewport: viewport.name,
              browser: browserName,
            });
          }
        }
      }
    }

    // Generate final report
    const report = await generateAccessibilityReport(allResults);

    // Save detailed results
    await fs.writeFile(
      path.join(config.outputDir, 'a11y-detailed-results.json'),
      JSON.stringify(allResults, null, 2),
    );

    // Save summary report
    await fs.writeFile(
      path.join(config.outputDir, 'a11y-summary-report.json'),
      JSON.stringify(report, null, 2),
    );

    // Generate HTML report
    const htmlReport = generateHtmlReport(report);
    await fs.writeFile(
      path.join(config.outputDir, 'a11y-report.html'),
      htmlReport,
    );

    console.log('📊 Accessibility Audit Summary:');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Total Issues: ${report.summary.totalIssues}`);
    console.log(`Critical Issues: ${report.summary.criticalIssues}`);
    console.log(`Warnings: ${report.summary.warnings}`);
    console.log(`Passes: ${report.summary.passes}`);

    if (report.summary.criticalIssues > 0) {
      console.log('❌ CRITICAL: Accessibility issues found that must be fixed');
      process.exit(1);
    } else {
      console.log('✅ SUCCESS: No critical accessibility issues found');
    }
  } finally {
    // Close browsers
    for (const browser of Object.values(browsers)) {
      await browser.close();
    }
  }
}

/**
 * Generate HTML report
 */
function generateHtmlReport(report) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FormaOS Accessibility Audit Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat { background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .critical { color: #dc3545; }
        .warning { color: #fd7e14; }
        .success { color: #28a745; }
        .info { color: #17a2b8; }
        .recommendations { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FormaOS Accessibility Audit Report</h1>
        <p>Generated on ${new Date(report.timestamp).toLocaleDateString()}</p>
    </div>
    
    <div class="summary">
        <div class="stat">
            <div class="stat-number info">${report.summary.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="stat">
            <div class="stat-number ${report.summary.criticalIssues > 0 ? 'critical' : 'success'}">${report.summary.criticalIssues}</div>
            <div>Critical Issues</div>
        </div>
        <div class="stat">
            <div class="stat-number ${report.summary.warnings > 10 ? 'warning' : 'info'}">${report.summary.warnings}</div>
            <div>Warnings</div>
        </div>
        <div class="stat">
            <div class="stat-number success">${report.summary.passes}</div>
            <div>Passes</div>
        </div>
    </div>
    
    ${
      report.recommendations.length > 0
        ? `
    <div class="recommendations">
        <h3>Recommendations</h3>
        <ul>
            ${report.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    `
        : ''
    }
    
    <p>For detailed results, see <code>a11y-detailed-results.json</code></p>
</body>
</html>
  `;
}

// Run the audit if called directly
if (require.main === module) {
  runAccessibilityAudit().catch(console.error);
}

module.exports = {
  runAccessibilityAudit,
  runPa11yTest,
  runAxeTest,
  runKeyboardNavigationTest,
  generateAccessibilityReport,
};
