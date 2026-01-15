/**
 * GDPR Compliance Testing Script
 * Validates data protection and privacy controls
 */

const playwright = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class GDPRComplianceTest {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      compliance: {
        dataProtection: [],
        userRights: [],
        consent: [],
        security: [],
      },
      violations: [],
      recommendations: [],
    };
  }

  /**
   * Test data protection measures
   */
  async testDataProtection(page) {
    const tests = [
      {
        name: 'Privacy Policy Accessibility',
        test: async () => {
          const response = await page.goto(`${this.baseUrl}/privacy`);
          return {
            passed: response.status() === 200,
            details: 'Privacy policy must be easily accessible',
          };
        },
      },
      {
        name: 'Data Processing Disclosure',
        test: async () => {
          await page.goto(`${this.baseUrl}/privacy`);
          const content = await page.content();
          const hasDataProcessing =
            content.includes('data processing') ||
            content.includes('personal data') ||
            content.includes('data collection');
          return {
            passed: hasDataProcessing,
            details: 'Must disclose data processing activities',
          };
        },
      },
      {
        name: 'Data Controller Information',
        test: async () => {
          await page.goto(`${this.baseUrl}/privacy`);
          const content = await page.content();
          const hasController =
            content.includes('data controller') ||
            content.includes('responsible for');
          return {
            passed: hasController,
            details: 'Must identify data controller',
          };
        },
      },
      {
        name: 'Legal Basis Declaration',
        test: async () => {
          await page.goto(`${this.baseUrl}/privacy`);
          const content = await page.content();
          const hasLegalBasis =
            content.includes('legal basis') ||
            content.includes('lawful basis') ||
            content.includes('legitimate interest');
          return {
            passed: hasLegalBasis,
            details: 'Must declare legal basis for processing',
          };
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.results.compliance.dataProtection.push({
          name: test.name,
          ...result,
        });
      } catch (error) {
        this.results.violations.push({
          category: 'Data Protection',
          test: test.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Test user rights implementation
   */
  async testUserRights(page) {
    const tests = [
      {
        name: 'Data Access Request Process',
        test: async () => {
          await page.goto(`${this.baseUrl}/app/privacy`);
          const exportButton = await page.$(
            '[data-testid="export-data"], button:has-text("Export"), a:has-text("Download")',
          );
          return {
            passed: exportButton !== null,
            details: 'Users must be able to access their personal data',
          };
        },
      },
      {
        name: 'Data Deletion Process',
        test: async () => {
          await page.goto(`${this.baseUrl}/app/settings`);
          const deleteButton = await page.$(
            '[data-testid="delete-account"], button:has-text("Delete"), a:has-text("Remove")',
          );
          return {
            passed: deleteButton !== null,
            details: 'Users must be able to delete their data',
          };
        },
      },
      {
        name: 'Data Portability',
        test: async () => {
          await page.goto(`${this.baseUrl}/app`);
          // Check for export functionality
          const exportFeature = await page.evaluate(() => {
            return (
              document.querySelector(
                '[data-export], [data-download], .export, .download',
              ) !== null
            );
          });
          return {
            passed: exportFeature,
            details: 'Must provide data portability options',
          };
        },
      },
      {
        name: 'Data Rectification',
        test: async () => {
          await page.goto(`${this.baseUrl}/app/profile`);
          const editableFields = await page.$$(
            'input[type="text"], input[type="email"], textarea',
          );
          return {
            passed: editableFields.length > 0,
            details: 'Users must be able to update their information',
          };
        },
      },
    ];

    // Setup authentication
    await page.evaluate(() => {
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          access_token: 'mock_token_for_gdpr_testing',
          user: {
            id: 'test-user-id',
            email: 'test@formaos.com',
          },
        }),
      );
    });

    for (const test of tests) {
      try {
        const result = await test.test();
        this.results.compliance.userRights.push({
          name: test.name,
          ...result,
        });
      } catch (error) {
        this.results.violations.push({
          category: 'User Rights',
          test: test.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Test consent mechanisms
   */
  async testConsent(page) {
    const tests = [
      {
        name: 'Cookie Consent Banner',
        test: async () => {
          await page.goto(this.baseUrl);
          const cookieBanner = await page.$(
            '.cookie-banner, .consent-banner, [data-testid="cookie-consent"]',
          );
          return {
            passed: cookieBanner !== null,
            details: 'Must display cookie consent banner',
          };
        },
      },
      {
        name: 'Granular Consent Options',
        test: async () => {
          await page.goto(this.baseUrl);
          const consentOptions = await page.$$(
            '.consent-option, .cookie-option, input[type="checkbox"]',
          );
          return {
            passed: consentOptions.length >= 2,
            details: 'Must provide granular consent options',
          };
        },
      },
      {
        name: 'Consent Withdrawal',
        test: async () => {
          await page.goto(`${this.baseUrl}/privacy-settings`);
          const withdrawalOption = await page.$(
            'button:has-text("Withdraw"), .withdraw-consent, [data-testid="withdraw-consent"]',
          );
          return {
            passed: withdrawalOption !== null,
            details: 'Must allow consent withdrawal',
          };
        },
      },
      {
        name: 'Marketing Consent Separate',
        test: async () => {
          await page.goto(`${this.baseUrl}/signup`);
          const marketingCheckbox = await page.$(
            'input[name*="marketing"], input[name*="newsletter"], .marketing-consent',
          );
          return {
            passed: marketingCheckbox !== null,
            details: 'Marketing consent must be separate and optional',
          };
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.results.compliance.consent.push({
          name: test.name,
          ...result,
        });
      } catch (error) {
        this.results.violations.push({
          category: 'Consent',
          test: test.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Test security measures
   */
  async testSecurity(page) {
    const tests = [
      {
        name: 'HTTPS Enforcement',
        test: async () => {
          const response = await page.goto(
            this.baseUrl.replace('http://', 'https://'),
          );
          return {
            passed: response.url().startsWith('https://'),
            details: 'Must enforce HTTPS for data protection',
          };
        },
      },
      {
        name: 'Secure Authentication',
        test: async () => {
          await page.goto(`${this.baseUrl}/login`);
          const passwordField = await page.$('input[type="password"]');
          const secureAuth = passwordField !== null;
          return {
            passed: secureAuth,
            details: 'Must implement secure authentication',
          };
        },
      },
      {
        name: 'Session Security',
        test: async () => {
          await page.goto(this.baseUrl);
          const cookies = await page.context().cookies();
          const secureCookies = cookies.filter(
            (cookie) => cookie.secure === true,
          );
          return {
            passed: secureCookies.length > 0 || cookies.length === 0,
            details: 'Authentication cookies must be secure',
          };
        },
      },
      {
        name: 'Data Breach Notification Process',
        test: async () => {
          await page.goto(`${this.baseUrl}/privacy`);
          const content = await page.content();
          const hasBreachProcess =
            content.includes('data breach') ||
            content.includes('security incident');
          return {
            passed: hasBreachProcess,
            details: 'Must have documented breach notification process',
          };
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        this.results.compliance.security.push({
          name: test.name,
          ...result,
        });
      } catch (error) {
        this.results.violations.push({
          category: 'Security',
          test: test.name,
          error: error.message,
        });
      }
    }
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const allTests = [
      ...this.results.compliance.dataProtection,
      ...this.results.compliance.userRights,
      ...this.results.compliance.consent,
      ...this.results.compliance.security,
    ];

    const failedTests = allTests.filter((test) => !test.passed);
    const totalViolations = this.results.violations.length;

    if (failedTests.length === 0 && totalViolations === 0) {
      this.results.recommendations.push(
        'Excellent! All GDPR compliance tests passed.',
      );
    } else {
      if (failedTests.length > 0) {
        this.results.recommendations.push(
          `${failedTests.length} compliance tests failed. Review and implement missing requirements.`,
        );
      }

      if (totalViolations > 0) {
        this.results.recommendations.push(
          `${totalViolations} technical violations found. Address these for full compliance.`,
        );
      }

      // Specific recommendations
      if (failedTests.some((test) => test.name.includes('Privacy Policy'))) {
        this.results.recommendations.push(
          'Ensure privacy policy is easily accessible from all pages.',
        );
      }

      if (failedTests.some((test) => test.name.includes('Consent'))) {
        this.results.recommendations.push(
          'Implement proper consent mechanisms with granular options.',
        );
      }

      if (failedTests.some((test) => test.name.includes('Rights'))) {
        this.results.recommendations.push(
          'Provide clear processes for users to exercise their data rights.',
        );
      }

      if (failedTests.some((test) => test.name.includes('Security'))) {
        this.results.recommendations.push(
          'Enhance security measures to protect personal data.',
        );
      }
    }
  }

  /**
   * Run full GDPR compliance test
   */
  async runGDPRCompliance() {
    console.log('🔒 Running GDPR compliance tests...');

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await this.testDataProtection(page);
      await this.testUserRights(page);
      await this.testConsent(page);
      await this.testSecurity(page);

      this.generateRecommendations();

      const summary = {
        totalTests: Object.values(this.results.compliance).flat().length,
        passedTests: Object.values(this.results.compliance)
          .flat()
          .filter((test) => test.passed).length,
        failedTests: Object.values(this.results.compliance)
          .flat()
          .filter((test) => !test.passed).length,
        violations: this.results.violations.length,
      };

      console.log('📊 GDPR Compliance Summary:');
      console.log(`Total Tests: ${summary.totalTests}`);
      console.log(`Passed: ${summary.passedTests}`);
      console.log(`Failed: ${summary.failedTests}`);
      console.log(`Violations: ${summary.violations}`);

      if (summary.failedTests > 0 || summary.violations > 0) {
        console.log('❌ GDPR compliance issues found');
      } else {
        console.log('✅ GDPR compliance tests passed');
      }

      return this.results;
    } finally {
      await browser.close();
    }
  }
}

module.exports = GDPRComplianceTest;

// Run if called directly
if (require.main === module) {
  const gdprTest = new GDPRComplianceTest();
  gdprTest
    .runGDPRCompliance()
    .then((results) => {
      console.log('GDPR Compliance test completed');
      require('fs').writeFileSync(
        'tests/compliance/reports/gdpr-compliance-report.json',
        JSON.stringify(results, null, 2),
      );
    })
    .catch(console.error);
}
