/**
 * CTA Button Testing Script
 *
 * This script tests all primary CTA buttons across the FormaOS application
 * to ensure they navigate correctly and don't crash.
 */

const puppeteer = require('puppeteer');

const CTA_TESTS = [
  // HOME PAGE
  {
    page: 'Home',
    url: 'http://localhost:3000',
    buttons: [
      {
        text: 'Start Free Trial',
        expectedPath: '/auth/signup',
        selector: 'a[href^="/auth/signup"]',
      },
      {
        text: 'Request Demo',
        expectedPath: '/contact',
        selector: 'a[href="/contact"]',
      },
    ],
  },
  // PRICING PAGE
  {
    page: 'Pricing',
    url: 'http://localhost:3000/pricing',
    buttons: [
      {
        text: 'Start Free',
        expectedPath: '/auth/signup',
        selector: 'a[href^="/auth/signup"]',
      },
      {
        text: 'Contact Sales',
        expectedPath: '/contact',
        selector: 'a[href="/contact"]',
      },
    ],
  },
  // PRODUCT PAGE
  {
    page: 'Product',
    url: 'http://localhost:3000/product',
    buttons: [
      {
        text: 'Get Started',
        expectedPath: '/auth/signup',
        selector: 'a[href^="/auth/signup"]',
      },
      {
        text: 'Request Demo',
        expectedPath: '/contact',
        selector: 'a[href="/contact"]',
      },
    ],
  },
  // INDUSTRIES PAGE
  {
    page: 'Industries',
    url: 'http://localhost:3000/industries',
    buttons: [
      {
        text: 'Start Free',
        expectedPath: '/auth/signup',
        selector: 'a[href^="/auth/signup"]',
      },
    ],
  },
  // SECURITY PAGE
  {
    page: 'Security',
    url: 'http://localhost:3000/security',
    buttons: [
      {
        text: 'Start Free',
        expectedPath: '/auth/signup',
        selector: 'a[href^="/auth/signup"]',
      },
    ],
  },
];

async function testCTAButtons() {
  console.log('🚀 Starting CTA Button Testing...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();
  const results = [];

  try {
    for (const test of CTA_TESTS) {
      console.log(`\n📄 Testing ${test.page} Page (${test.url})`);
      console.log('─'.repeat(60));

      // Navigate to the page
      await page.goto(test.url, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log(`✅ Page loaded successfully`);

      // Test each button on the page
      for (const button of test.buttons) {
        console.log(`\n🔘 Testing button: "${button.text}"`);

        try {
          // Find the button
          const buttonElement = await page.$(button.selector);

          if (!buttonElement) {
            console.log(
              `❌ FAIL: Button not found with selector: ${button.selector}`,
            );
            results.push({
              page: test.page,
              button: button.text,
              status: 'NOT_FOUND',
              error: `Selector ${button.selector} not found`,
            });
            continue;
          }

          // Get the href attribute
          const href = await page.evaluate(
            (el) => el.getAttribute('href'),
            buttonElement,
          );
          console.log(`   Found button with href: ${href}`);

          // Click the button
          await buttonElement.click();

          // Wait for navigation
          await page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 10000,
          });

          const currentUrl = page.url();
          console.log(`   Navigated to: ${currentUrl}`);

          // Check if we're on the expected path
          const isCorrectPath = currentUrl.includes(button.expectedPath);

          if (isCorrectPath) {
            console.log(`✅ SUCCESS: Navigated to correct path`);
            results.push({
              page: test.page,
              button: button.text,
              status: 'PASS',
              expectedPath: button.expectedPath,
              actualUrl: currentUrl,
            });
          } else {
            console.log(`❌ FAIL: Wrong destination`);
            console.log(`   Expected path: ${button.expectedPath}`);
            console.log(`   Actual URL: ${currentUrl}`);
            results.push({
              page: test.page,
              button: button.text,
              status: 'WRONG_DESTINATION',
              expectedPath: button.expectedPath,
              actualUrl: currentUrl,
            });
          }

          // Go back to the original page for next button test
          await page.goto(test.url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
          });
        } catch (error) {
          console.log(`❌ FAIL: ${error.message}`);
          results.push({
            page: test.page,
            button: button.text,
            status: 'ERROR',
            error: error.message,
          });

          // Try to recover by going back to the test page
          try {
            await page.goto(test.url, {
              waitUntil: 'networkidle2',
              timeout: 30000,
            });
          } catch (recoveryError) {
            console.log(
              `⚠️  Could not recover, skipping remaining buttons on this page`,
            );
            break;
          }
        }
      }
    }

    // Print summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status !== 'PASS').length;
    const total = results.length;

    console.log(`\nTotal Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results
        .filter((r) => r.status !== 'PASS')
        .forEach((r) => {
          console.log(`\n  Page: ${r.page}`);
          console.log(`  Button: ${r.button}`);
          console.log(`  Status: ${r.status}`);
          if (r.error) console.log(`  Error: ${r.error}`);
          if (r.expectedPath) console.log(`  Expected: ${r.expectedPath}`);
          if (r.actualUrl) console.log(`  Actual: ${r.actualUrl}`);
        });
    }

    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed');
  }

  return results;
}

// Run the tests
testCTAButtons()
  .then((results) => {
    const failed = results.filter((r) => r.status !== 'PASS').length;
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
