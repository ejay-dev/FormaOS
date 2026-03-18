#!/usr/bin/env node
/**
 * 🧪 FormaOS Production Smoke Tests
 *
 * Quick verification script to test critical paths after deployment.
 * Run this immediately after deploying to production.
 *
 * Usage:
 *   node smoke-tests.js https://app.formaos.com.au
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

console.log('🧪 FormaOS Production Smoke Tests');
console.log('===================================');
console.log(`Testing: ${BASE_URL}\n`);

let passed = 0;
let failed = 0;

/**
 * Test helper
 */
async function test(name, fn) {
  try {
    process.stdout.write(`${name}... `);
    await fn();
    console.log('✅ PASS');
    passed++;
  } catch (error) {
    console.log('❌ FAIL');
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

/**
 * HTTP helper
 */
async function fetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await global.fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Assert helpers
 */
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertStatus(response, expected) {
  assert(
    response.status === expected,
    `Expected status ${expected}, got ${response.status}`,
  );
}

function assertContains(text, substring) {
  assert(text.includes(substring), `Expected text to contain "${substring}"`);
}

/**
 * Smoke Tests
 */
async function runSmokeTests() {
  console.log('📋 1. HOMEPAGE & MARKETING PAGES\n');

  await test('Homepage loads', async () => {
    const response = await fetch(BASE_URL);
    assertStatus(response, 200);
    const html = await response.text();
    assertContains(html, 'FormaOS');
  });

  await test('Pricing page loads', async () => {
    const response = await fetch(`${BASE_URL}/pricing`);
    assertStatus(response, 200);
    const html = await response.text();
    assertContains(html, 'Basic');
    assertContains(html, 'Pro');
    assertContains(html, 'Enterprise');
  });

  await test('Product page loads', async () => {
    const response = await fetch(`${BASE_URL}/product`);
    assertStatus(response, 200);
    const html = await response.text();
    assertContains(html, 'compliance');
  });

  await test('Industries page loads', async () => {
    const response = await fetch(`${BASE_URL}/industries`);
    assertStatus(response, 200);
    const html = await response.text();
    assertContains(html, 'NDIS');
    assertContains(html, 'Healthcare');
  });

  await test('Contact page loads', async () => {
    const response = await fetch(`${BASE_URL}/contact`);
    assertStatus(response, 200);
  });

  console.log('\n📋 2. AUTH PAGES\n');

  await test('Signin page loads', async () => {
    const response = await fetch(`${BASE_URL}/auth/signin`);
    assertStatus(response, 200);
    const html = await response.text();
    assertContains(html, 'Sign in');
  });

  await test('Signup page loads', async () => {
    const response = await fetch(`${BASE_URL}/auth/signup`);
    assertStatus(response, 200);
    const html = await response.text();
    assertContains(html, 'Sign up');
  });

  console.log('\n📋 3. PROTECTED ROUTES (Should redirect)\n');

  await test('Protected /app redirects to signin', async () => {
    const response = await fetch(`${BASE_URL}/app`, {
      redirect: 'manual',
    });
    assert(
      response.status === 307 || response.status === 302,
      'Expected redirect status',
    );
  });

  await test('Protected /app/tasks redirects to signin', async () => {
    const response = await fetch(`${BASE_URL}/app/tasks`, {
      redirect: 'manual',
    });
    assert(
      response.status === 307 || response.status === 302,
      'Expected redirect status',
    );
  });

  console.log('\n📋 4. API HEALTH CHECKS\n');

  await test('Health endpoint responds', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    assertStatus(response, 200);
    const data = await response.json();
    assert(data.status === 'ok', 'Health status should be ok');
  });

  await test('Detailed health check works', async () => {
    const response = await fetch(`${BASE_URL}/api/health/detailed`);
    assertStatus(response, 200);
    const data = await response.json();
    assert(data.database !== undefined, 'Should have database check');
  });

  console.log('\n📋 5. STATIC ASSETS\n');

  await test('Favicon loads', async () => {
    const response = await fetch(`${BASE_URL}/favicon.ico`);
    assert(response.status === 200, 'Favicon should load');
  });

  await test('Icon SVG loads', async () => {
    const response = await fetch(`${BASE_URL}/icon.svg`);
    assert(response.status === 200, 'Icon SVG should load');
  });

  console.log('\n📋 6. USE CASE PAGES\n');

  await test('NDIS use case page loads', async () => {
    const response = await fetch(`${BASE_URL}/use-cases/ndis-aged-care`);
    assertStatus(response, 200);
    const html = await response.text();
    assertContains(html, 'NDIS');
  });

  await test('Healthcare use case page loads', async () => {
    const response = await fetch(`${BASE_URL}/use-cases/healthcare`);
    assertStatus(response, 200);
  });

  await test('Incident management page loads', async () => {
    const response = await fetch(`${BASE_URL}/use-cases/incident-management`);
    assertStatus(response, 200);
  });

  console.log('\n📋 7. SECURITY HEADERS\n');

  await test('Security headers present', async () => {
    const response = await fetch(BASE_URL);
    const headers = response.headers;

    // Check for important security headers
    // Note: Some may be set by Vercel automatically
    assert(
      headers.get('x-frame-options') || headers.get('content-security-policy'),
      'Should have security headers',
    );
  });

  console.log('\n📋 8. ERROR PAGES\n');

  await test('404 page renders', async () => {
    const response = await fetch(`${BASE_URL}/nonexistent-page-12345`);
    assertStatus(response, 404);
  });

  await test('Unauthorized page loads', async () => {
    const response = await fetch(`${BASE_URL}/unauthorized`);
    assertStatus(response, 200);
  });

  console.log('\n📋 9. BLOG PAGES\n');

  await test('Blog index loads', async () => {
    const response = await fetch(`${BASE_URL}/blog`);
    assertStatus(response, 200);
  });

  console.log('\n📋 10. LEGAL PAGES\n');

  await test('Privacy policy loads', async () => {
    const response = await fetch(`${BASE_URL}/legal/privacy`);
    assertStatus(response, 200);
  });

  await test('Terms of service loads', async () => {
    const response = await fetch(`${BASE_URL}/legal/terms`);
    assertStatus(response, 200);
  });
}

/**
 * Main execution
 */
async function main() {
  try {
    await runSmokeTests();

    console.log('\n===================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('===================================\n');

    if (failed > 0) {
      console.log('⚠️  Some tests failed. Review errors above.');
      process.exit(1);
    } else {
      console.log('🎉 All smoke tests passed!');
      console.log('\nNext steps:');
      console.log('1. Test user signup flow manually');
      console.log('2. Test OAuth login manually');
      console.log('3. Verify Stripe checkout works');
      console.log('4. Check automation cron job runs');
      console.log('5. Monitor error logs for 48 hours');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run tests
main();
