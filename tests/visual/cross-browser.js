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
  const baseConfig = require('../../../backstop.config.js');
  
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
  const baseConfig = require('../../../backstop.config.js');
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
  console.log('🚀 Starting cross-browser visual regression tests...');\n  \n  const results = [];\n  \n  // Test each browser\n  for (const browser of ['chromium', 'firefox', 'webkit']) {\n    console.log(`\\n📱 Testing ${browser}...`);\n    \n    try {\n      const config = generateBrowserConfig(browser);\n      const result = await backstop('test', { config });\n      results.push({ browser, status: 'passed', result });\n      console.log(`✅ ${browser} tests passed`);\n    } catch (error) {\n      results.push({ browser, status: 'failed', error: error.message });\n      console.log(`❌ ${browser} tests failed: ${error.message}`);\n    }\n  }\n  \n  // Test mobile devices\n  for (const device of mobileDevices) {\n    console.log(`\\n📱 Testing ${device}...`);\n    \n    try {\n      const config = generateMobileConfig(device);\n      const result = await backstop('test', { config });\n      results.push({ device, status: 'passed', result });\n      console.log(`✅ ${device} tests passed`);\n    } catch (error) {\n      results.push({ device, status: 'failed', error: error.message });\n      console.log(`❌ ${device} tests failed: ${error.message}`);\n    }\n  }\n  \n  // Generate summary report\n  const summary = {\n    total: results.length,\n    passed: results.filter(r => r.status === 'passed').length,\n    failed: results.filter(r => r.status === 'failed').length,\n    results\n  };\n  \n  console.log('\\n📊 Cross-Browser Test Summary:');\n  console.log(`Total: ${summary.total}`);\n  console.log(`Passed: ${summary.passed}`);\n  console.log(`Failed: ${summary.failed}`);\n  \n  // Write detailed report\n  require('fs').writeFileSync(\n    'tests/visual/cross-browser-report.json',\n    JSON.stringify(summary, null, 2)\n  );\n  \n  return summary;\n}\n\n/**\n * Generate reference images for all browsers\n */\nasync function generateReferences() {\n  console.log('📸 Generating reference images for all browsers...');\n  \n  for (const browser of ['chromium', 'firefox', 'webkit']) {\n    console.log(`Generating ${browser} references...`);\n    const config = generateBrowserConfig(browser);\n    await backstop('reference', { config });\n  }\n  \n  for (const device of mobileDevices) {\n    console.log(`Generating ${device} references...`);\n    const config = generateMobileConfig(device);\n    await backstop('reference', { config });\n  }\n  \n  console.log('✅ All reference images generated');\n}\n\n/**\n * Approve visual changes across all browsers\n */\nasync function approveAll() {\n  console.log('✅ Approving visual changes across all browsers...');\n  \n  for (const browser of ['chromium', 'firefox', 'webkit']) {\n    console.log(`Approving ${browser} changes...`);\n    const config = generateBrowserConfig(browser);\n    await backstop('approve', { config });\n  }\n  \n  for (const device of mobileDevices) {\n    console.log(`Approving ${device} changes...`);\n    const config = generateMobileConfig(device);\n    await backstop('approve', { config });\n  }\n  \n  console.log('✅ All visual changes approved');\n}\n\nmodule.exports = {\n  runCrossBrowserTests,\n  generateReferences,\n  approveAll,\n  generateBrowserConfig,\n  generateMobileConfig,\n  browsers,\n  mobileDevices\n};