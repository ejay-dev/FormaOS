/**
 * Cross-browser visual testing configuration
 * Tests across Chrome, Firefox, Safari, and Edge
 */

const { test, expect } = require('@playwright/test');
const backstop = require('backstopjs');

// Browser configurations
const browsers = [
  { name: 'chromium', use: { ...require('@playwright/test').devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...require('@playwright/test').devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...require('@playwright/test').devices['Desktop Safari'] } }
];

// Mobile device configurations
const mobileDevices = [
  'iPhone 12',
  'iPhone 12 Pro',
  'iPhone SE',
  'iPad',
  'Pixel 5',
  'Galaxy S8+'
];

/**
 * Generate BackstopJS config for specific browser
 */
function generateBrowserConfig(browser) {
  const baseConfig = require('../../backstop.config.js');
  
  return {
    ...baseConfig,
    id: `formaos_visual_${browser}`,
    engineOptions: {
      ...baseConfig.engineOptions,
      browser: browser === 'webkit' ? 'webkit' : browser,
      args: browser === 'firefox' ? 
        ['--no-sandbox', '--disable-setuid-sandbox', '--headless'] :
        ['--no-sandbox', '--disable-setuid-sandbox']
    },
    paths: {
      ...baseConfig.paths,
      bitmaps_reference: `tests/visual/backstop_data/${browser}/bitmaps_reference`,
      bitmaps_test: `tests/visual/backstop_data/${browser}/bitmaps_test`,
      html_report: `tests/visual/backstop_data/${browser}/html_report`,
      ci_report: `tests/visual/backstop_data/${browser}/ci_report`
    }
  };
}

/**
 * Generate mobile device testing config
 */
function generateMobileConfig(deviceName) {
  const baseConfig = require('../../backstop.config.js');
  const device = require('@playwright/test').devices[deviceName];
  
  return {
    ...baseConfig,
    id: `formaos_mobile_${deviceName.replace(/\s+/g, '_').toLowerCase()}`,
    viewports: [
      {
        label: 'mobile_device',
        width: device.viewport.width,
        height: device.viewport.height
      }
    ],
    engineOptions: {
      ...baseConfig.engineOptions,
      args: [
        ...baseConfig.engineOptions.args,
        `--user-agent="${device.userAgent}"`
      ]
    },
    paths: {
      ...baseConfig.paths,
      bitmaps_reference: `tests/visual/backstop_data/mobile_${deviceName.replace(/\s+/g, '_').toLowerCase()}/bitmaps_reference`,
      bitmaps_test: `tests/visual/backstop_data/mobile_${deviceName.replace(/\s+/g, '_').toLowerCase()}/bitmaps_test`,
      html_report: `tests/visual/backstop_data/mobile_${deviceName.replace(/\s+/g, '_').toLowerCase()}/html_report`,
      ci_report: `tests/visual/backstop_data/mobile_${deviceName.replace(/\s+/g, '_').toLowerCase()}/ci_report`
    }
  };
}

/**
 * Run visual tests across all browsers
 */
async function runCrossBrowserTests() {
  console.log('🚀 Starting cross-browser visual regression tests...');

  const results = [];

  // Test each browser
  for (const browser of ['chromium', 'firefox', 'webkit']) {
    console.log(`\n📱 Testing ${browser}...`);

    try {
      const config = generateBrowserConfig(browser);
      const result = await backstop('test', { config });
      results.push({ browser, status: 'passed', result });
      console.log(`✅ ${browser} tests passed`);
    } catch (error) {
      results.push({ browser, status: 'failed', error: error.message });
      console.log(`❌ ${browser} tests failed: ${error.message}`);
    }
  }

  // Test mobile devices
  for (const device of mobileDevices) {
    console.log(`\n📱 Testing ${device}...`);

    try {
      const config = generateMobileConfig(device);
      const result = await backstop('test', { config });
      results.push({ device, status: 'passed', result });
      console.log(`✅ ${device} tests passed`);
    } catch (error) {
      results.push({ device, status: 'failed', error: error.message });
      console.log(`❌ ${device} tests failed: ${error.message}`);
    }
  }

  // Generate summary report
  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'passed').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };

  console.log('\n📊 Cross-Browser Test Summary:');
  console.log(`Total: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);

  // Write detailed report
  require('fs').writeFileSync(
    'tests/visual/cross-browser-report.json',
    JSON.stringify(summary, null, 2),
  );

  return summary;
}

/**
 * Generate reference images for all browsers
 */
async function generateReferences() {
  console.log('📸 Generating reference images for all browsers...');

  for (const browser of ['chromium', 'firefox', 'webkit']) {
    console.log(`Generating ${browser} references...`);
    const config = generateBrowserConfig(browser);
    await backstop('reference', { config });
  }

  for (const device of mobileDevices) {
    console.log(`Generating ${device} references...`);
    const config = generateMobileConfig(device);
    await backstop('reference', { config });
  }

  console.log('✅ All reference images generated');
}

/**
 * Approve visual changes across all browsers
 */
async function approveAll() {
  console.log('✅ Approving visual changes across all browsers...');

  for (const browser of ['chromium', 'firefox', 'webkit']) {
    console.log(`Approving ${browser} changes...`);
    const config = generateBrowserConfig(browser);
    await backstop('approve', { config });
  }

  for (const device of mobileDevices) {
    console.log(`Approving ${device} changes...`);
    const config = generateMobileConfig(device);
    await backstop('approve', { config });
  }

  console.log('✅ All visual changes approved');
}

module.exports = {
  runCrossBrowserTests,
  generateReferences,
  approveAll,
  generateBrowserConfig,
  generateMobileConfig,
  browsers,
  mobileDevices,
};
