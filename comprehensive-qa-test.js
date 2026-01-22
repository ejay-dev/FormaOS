/**
 * COMPREHENSIVE QA VERIFICATION SUITE
 *
 * This script performs complete end-to-end testing of all user journeys,
 * CTAs, navigation flows, and edge cases with evidence-based validation.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Test results storage
const results = {
  timestamp: new Date().toISOString(),
  flows: [],
  screenshots: [],
  errors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

// Helper to log test results
function logTest(flow, step, expected, actual, status, notes = '') {
  const result = {
    flow,
    step,
    expected,
    actual,
    status,
    notes,
    timestamp: new Date().toISOString(),
  };
  results.flows.push(result);
  results.summary.total++;

  if (status === 'PASS') {
    results.summary.passed++;
    console.log(`✅ ${flow} → ${step}: PASS`);
  } else if (status === 'FAIL') {
    results.summary.failed++;
    console.log(`❌ ${flow} → ${step}: FAIL - ${notes}`);
  } else if (status === 'WARNING') {
    results.summary.warnings++;
    console.log(`⚠️  ${flow} → ${step}: WARNING - ${notes}`);
  }

  if (notes) {
    console.log(`   Notes: ${notes}`);
  }
}

// Helper to take screenshot
async function takeScreenshot(page, name) {
  const filename = `test-results/screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  results.screenshots.push({
    name,
    filename,
    timestamp: new Date().toISOString(),
  });
  console.log(`📸 Screenshot saved: ${filename}`);
  return filename;
}

async function runComprehensiveQA() {
  console.log('🚀 STARTING COMPREHENSIVE QA VERIFICATION\n');
  console.log('='.repeat(80));

  // Create screenshots directory
  if (!fs.existsSync('test-results/screenshots')) {
    fs.mkdirSync('test-results/screenshots', { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Enable console logging from the page
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      results.errors.push({
        type: 'console_error',
        message: msg.text(),
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Enable error tracking
  page.on('pageerror', (error) => {
    results.errors.push({
      type: 'page_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  });

  try {
    // ========================================
    // TEST 1: HOME PAGE LOAD
    // ========================================
    console.log('\n📋 TEST 1: HOME PAGE LOAD');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const homeUrl = page.url();
    const homeTitle = await page.title();
    await takeScreenshot(page, 'home-page-load');

    logTest(
      'Home Page',
      'Initial Load',
      'http://localhost:3000',
      homeUrl,
      homeUrl === 'http://localhost:3000/' ? 'PASS' : 'FAIL',
      `Title: ${homeTitle}`,
    );

    // ========================================
    // TEST 2: PRIMARY CTA BUTTONS (First Click)
    // ========================================
    console.log('\n📋 TEST 2: PRIMARY CTA BUTTONS');
    console.log('-'.repeat(80));

    const ctaTests = [
      {
        name: 'Start Free Trial',
        selector: 'a[href^="/auth/signup"]',
        expectedPath: '/auth/signup',
      },
      {
        name: 'Request Demo',
        selector: 'a[href="/contact"]',
        expectedPath: '/contact',
      },
    ];

    for (const cta of ctaTests) {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

      const button = await page.$(cta.selector);
      if (!button) {
        logTest(
          'CTA Buttons',
          cta.name,
          'Button exists',
          'Not found',
          'FAIL',
          `Selector: ${cta.selector}`,
        );
        continue;
      }

      const href = await page.evaluate((el) => el.getAttribute('href'), button);
      await button.click();
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 10000,
      });

      const currentUrl = page.url();
      await takeScreenshot(
        page,
        `cta-${cta.name.toLowerCase().replace(/ /g, '-')}`,
      );

      logTest(
        'CTA Buttons',
        cta.name,
        cta.expectedPath,
        currentUrl,
        currentUrl.includes(cta.expectedPath) ? 'PASS' : 'FAIL',
        `Href: ${href}`,
      );
    }

    // ========================================
    // TEST 3: NAVIGATION LINKS
    // ========================================
    console.log('\n📋 TEST 3: NAVIGATION LINKS');
    console.log('-'.repeat(80));

    const navTests = [
      { name: 'Product', path: '/product' },
      { name: 'Industries', path: '/industries' },
      { name: 'Security', path: '/security' },
      { name: 'Pricing', path: '/pricing' },
    ];

    for (const nav of navTests) {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

      const link = await page.$(`a[href="${nav.path}"]`);
      if (!link) {
        logTest('Navigation', nav.name, 'Link exists', 'Not found', 'FAIL');
        continue;
      }

      await link.click();
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 10000,
      });

      const currentUrl = page.url();
      await takeScreenshot(page, `nav-${nav.name.toLowerCase()}`);

      logTest(
        'Navigation',
        nav.name,
        nav.path,
        currentUrl,
        currentUrl.includes(nav.path) ? 'PASS' : 'FAIL',
      );
    }

    // ========================================
    // TEST 4: SIGNUP PAGE VERIFICATION
    // ========================================
    console.log('\n📋 TEST 4: SIGNUP PAGE VERIFICATION');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/auth/signup', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await takeScreenshot(page, 'signup-page');

    // Check for signup form elements
    const hasEmailInput = (await page.$('input[type="email"]')) !== null;
    const hasPasswordInput = (await page.$('input[type="password"]')) !== null;
    const hasGoogleButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some((btn) => btn.textContent.includes('Google'));
    });

    logTest(
      'Signup Page',
      'Email Input',
      'Present',
      hasEmailInput ? 'Present' : 'Missing',
      hasEmailInput ? 'PASS' : 'FAIL',
    );

    logTest(
      'Signup Page',
      'Password Input',
      'Present',
      hasPasswordInput ? 'Present' : 'Missing',
      hasPasswordInput ? 'PASS' : 'FAIL',
    );

    logTest(
      'Signup Page',
      'Google OAuth Button',
      'Present',
      hasGoogleButton ? 'Present' : 'Missing',
      hasGoogleButton ? 'PASS' : 'FAIL',
    );

    // ========================================
    // TEST 5: CONTACT PAGE VERIFICATION
    // ========================================
    console.log('\n📋 TEST 5: CONTACT PAGE VERIFICATION');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000/contact', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await takeScreenshot(page, 'contact-page');

    const hasContactForm = (await page.$('form')) !== null;
    const hasNameInput = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.some(
        (input) =>
          input.name?.includes('name') ||
          input.placeholder?.toLowerCase().includes('name'),
      );
    });

    logTest(
      'Contact Page',
      'Form Present',
      'Present',
      hasContactForm ? 'Present' : 'Missing',
      hasContactForm ? 'PASS' : 'FAIL',
    );

    logTest(
      'Contact Page',
      'Name Input',
      'Present',
      hasNameInput ? 'Present' : 'Missing',
      hasNameInput ? 'PASS' : 'WARNING',
      hasNameInput ? '' : 'Form may exist but name field not detected',
    );

    // ========================================
    // TEST 6: HEADER & FOOTER LINKS
    // ========================================
    console.log('\n📋 TEST 6: HEADER & FOOTER LINKS');
    console.log('-'.repeat(80));

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

    // Test header login link
    const headerLogin = await page.$('a[href="/auth/signin"]');
    logTest(
      'Header/Footer',
      'Login Link',
      'Present',
      headerLogin ? 'Present' : 'Missing',
      headerLogin ? 'PASS' : 'WARNING',
    );

    // Test footer links
    const footerLinks = await page.$$eval('footer a', (links) =>
      links.map((link) => ({
        href: link.getAttribute('href'),
        text: link.textContent.trim(),
      })),
    );

    logTest(
      'Header/Footer',
      'Footer Links Count',
      '> 5',
      footerLinks.length.toString(),
      footerLinks.length > 5 ? 'PASS' : 'WARNING',
      `Found ${footerLinks.length} footer links`,
    );

    // ========================================
    // TEST 7: MOBILE RESPONSIVENESS
    // ========================================
    console.log('\n📋 TEST 7: MOBILE RESPONSIVENESS');
    console.log('-'.repeat(80));

    await page.setViewport({ width: 375, height: 667 }); // iPhone SE
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'mobile-home');

    const mobileMenuButton = await page.$(
      'button[aria-label*="menu" i], button[aria-expanded]',
    );
    logTest(
      'Mobile',
      'Menu Button',
      'Present',
      mobileMenuButton ? 'Present' : 'Missing',
      mobileMenuButton ? 'PASS' : 'FAIL',
    );

    if (mobileMenuButton) {
      await mobileMenuButton.click();
      await page.waitForTimeout(500); // Wait for menu animation
      await takeScreenshot(page, 'mobile-menu-open');

      const mobileNav = await page.$('[id="mobile-menu"], [role="dialog"]');
      logTest(
        'Mobile',
        'Menu Opens',
        'Visible',
        mobileNav ? 'Visible' : 'Not visible',
        mobileNav ? 'PASS' : 'FAIL',
      );
    }

    // Reset viewport
    await page.setViewport({ width: 1280, height: 800 });

    // ========================================
    // TEST 8: ERROR HANDLING
    // ========================================
    console.log('\n📋 TEST 8: ERROR HANDLING');
    console.log('-'.repeat(80));

    // Test 404 page
    await page.goto('http://localhost:3000/nonexistent-page-12345', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const is404 =
      page.url().includes('404') ||
      (await page.evaluate(
        () =>
          document.body.textContent.includes('404') ||
          document.body.textContent.includes('not found'),
      ));

    await takeScreenshot(page, '404-page');

    logTest(
      'Error Handling',
      '404 Page',
      'Shows error page',
      is404 ? 'Error page shown' : 'No error page',
      is404 ? 'PASS' : 'WARNING',
      'Should show user-friendly 404 page',
    );

    // ========================================
    // TEST 9: PAGE LOAD PERFORMANCE
    // ========================================
    console.log('\n📋 TEST 9: PAGE LOAD PERFORMANCE');
    console.log('-'.repeat(80));

    const performanceTests = [
      { name: 'Home', url: 'http://localhost:3000' },
      { name: 'Product', url: 'http://localhost:3000/product' },
      { name: 'Pricing', url: 'http://localhost:3000/pricing' },
    ];

    for (const test of performanceTests) {
      const startTime = Date.now();
      await page.goto(test.url, { waitUntil: 'networkidle2', timeout: 30000 });
      const loadTime = Date.now() - startTime;

      logTest(
        'Performance',
        `${test.name} Load Time`,
        '< 5000ms',
        `${loadTime}ms`,
        loadTime < 5000 ? 'PASS' : 'WARNING',
        loadTime >= 5000 ? 'Page load is slow' : '',
      );
    }

    // ========================================
    // TEST 10: CONSOLE ERRORS CHECK
    // ========================================
    console.log('\n📋 TEST 10: CONSOLE ERRORS CHECK');
    console.log('-'.repeat(80));

    logTest(
      'Console Errors',
      'Error Count',
      '0',
      results.errors.length.toString(),
      results.errors.length === 0 ? 'PASS' : 'WARNING',
      results.errors.length > 0
        ? `${results.errors.length} errors detected`
        : '',
    );
  } catch (error) {
    console.error('\n❌ FATAL ERROR DURING TESTING:', error);
    results.errors.push({
      type: 'fatal_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  } finally {
    await browser.close();
  }

  // ========================================
  // GENERATE REPORT
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️  Warnings: ${results.summary.warnings}`);
  console.log(`🐛 Errors: ${results.errors.length}`);
  console.log(`📸 Screenshots: ${results.screenshots.length}`);

  // Save results to file
  fs.writeFileSync(
    'test-results/comprehensive-qa-results.json',
    JSON.stringify(results, null, 2),
  );

  console.log(
    '\n📄 Full results saved to: test-results/comprehensive-qa-results.json',
  );

  // Generate markdown report
  generateMarkdownReport(results);

  return results;
}

function generateMarkdownReport(results) {
  let markdown = `# Comprehensive QA Test Results\n\n`;
  markdown += `**Test Date**: ${results.timestamp}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Count |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Tests | ${results.summary.total} |\n`;
  markdown += `| ✅ Passed | ${results.summary.passed} |\n`;
  markdown += `| ❌ Failed | ${results.summary.failed} |\n`;
  markdown += `| ⚠️ Warnings | ${results.summary.warnings} |\n`;
  markdown += `| 🐛 Errors | ${results.errors.length} |\n\n`;

  markdown += `## Detailed Results\n\n`;
  markdown += `| Flow | Step | Expected | Actual | Status | Notes |\n`;
  markdown += `|------|------|----------|--------|--------|-------|\n`;

  for (const test of results.flows) {
    const statusIcon =
      test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
    markdown += `| ${test.flow} | ${test.step} | ${test.expected} | ${test.actual} | ${statusIcon} ${test.status} | ${test.notes} |\n`;
  }

  if (results.errors.length > 0) {
    markdown += `\n## Errors Detected\n\n`;
    for (const error of results.errors) {
      markdown += `### ${error.type}\n`;
      markdown += `- **Message**: ${error.message}\n`;
      markdown += `- **Time**: ${error.timestamp}\n\n`;
    }
  }

  markdown += `\n## Screenshots\n\n`;
  for (const screenshot of results.screenshots) {
    markdown += `- ${screenshot.name}: \`${screenshot.filename}\`\n`;
  }

  fs.writeFileSync('test-results/QA_TEST_REPORT.md', markdown);
  console.log('📄 Markdown report saved to: test-results/QA_TEST_REPORT.md');
}

// Run the tests
runComprehensiveQA()
  .then((results) => {
    const exitCode = results.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
