/**
 * Navigation Test Script
 *
 * This script tests the navigation flows in the FormaOS application.
 * It uses Puppeteer to automate browser interactions and verify that
 * navigation between pages works correctly.
 */

const puppeteer = require('puppeteer');

async function testNavigation() {
  console.log('Starting navigation tests...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });

  const page = await browser.newPage();

  try {
    // Test 1: Home page loads correctly
    console.log('Test 1: Loading home page...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    console.log('✅ Home page loaded successfully');

    // Test 2: Navigation to Product page
    console.log('Test 2: Navigating to Product page...');
    await page.click('a[href="/product"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    const productUrl = page.url();
    console.log(`Current URL: ${productUrl}`);
    console.log(
      productUrl.includes('/product')
        ? '✅ Product page loaded successfully'
        : '❌ Failed to load Product page',
    );

    // Test 3: Navigation to Industries page
    console.log('Test 3: Navigating to Industries page...');
    await page.click('a[href="/industries"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    const industriesUrl = page.url();
    console.log(`Current URL: ${industriesUrl}`);
    console.log(
      industriesUrl.includes('/industries')
        ? '✅ Industries page loaded successfully'
        : '❌ Failed to load Industries page',
    );

    // Test 4: Navigation to Security page
    console.log('Test 4: Navigating to Security page...');
    await page.click('a[href="/security"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    const securityUrl = page.url();
    console.log(`Current URL: ${securityUrl}`);
    console.log(
      securityUrl.includes('/security')
        ? '✅ Security page loaded successfully'
        : '❌ Failed to load Security page',
    );

    // Test 5: Navigation to Pricing page
    console.log('Test 5: Navigating to Pricing page...');
    await page.click('a[href="/pricing"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    const pricingUrl = page.url();
    console.log(`Current URL: ${pricingUrl}`);
    console.log(
      pricingUrl.includes('/pricing')
        ? '✅ Pricing page loaded successfully'
        : '❌ Failed to load Pricing page',
    );

    // Test 6: Navigation to Signup page
    console.log('Test 6: Navigating to Signup page...');
    // Go back to home page first
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    // Find the signup button with the correct href
    const signupButton = await page.evaluateHandle(() => {
      const buttons = Array.from(
        document.querySelectorAll('a[href^="/auth/signup"]'),
      );
      return buttons.find(
        (button) =>
          button.textContent.includes('Sign up') ||
          button.textContent.includes('Signup') ||
          button.textContent.includes('Start Free Trial') ||
          button.textContent.includes('Get Started') ||
          button.textContent.includes('Start Free'),
      );
    });

    if (signupButton) {
      await signupButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      const signupUrl = page.url();
      console.log(`Current URL: ${signupUrl}`);
      console.log(
        signupUrl.includes('/signup') ||
          signupUrl.includes('/auth/signup') ||
          signupUrl.includes('/auth/signin')
          ? '✅ Signup page loaded successfully'
          : '❌ Failed to load Signup page',
      );
    } else {
      console.log('❌ Could not find signup button');
    }

    console.log('All navigation tests completed!');
  } catch (error) {
    console.error('Error during navigation tests:', error);
  } finally {
    await browser.close();
  }
}

testNavigation();
